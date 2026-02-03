import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const doSpacesEndpoint = Deno.env.get('DO_SPACES_ENDPOINT')!;
    const doSpacesBucket = Deno.env.get('DO_SPACES_BUCKET')!;
    const doSpacesKey = Deno.env.get('DO_SPACES_KEY')!;
    const doSpacesSecret = Deno.env.get('DO_SPACES_SECRET')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find all expired stories
    const { data: expiredStories, error: fetchError } = await supabase
      .from('stories')
      .select('id, media_url, thumbnail_url, audio_url')
      .lt('expires_at', new Date().toISOString());

    if (fetchError) {
      console.error('Error fetching expired stories:', fetchError);
      throw fetchError;
    }

    if (!expiredStories || expiredStories.length === 0) {
      console.log('No expired stories to clean up');
      return new Response(
        JSON.stringify({ message: 'No expired stories to clean up', deleted: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${expiredStories.length} expired stories to delete`);

    // Collect all media URLs to delete from DO Spaces
    const mediaUrls: string[] = [];
    for (const story of expiredStories) {
      if (story.media_url) mediaUrls.push(story.media_url);
      if (story.thumbnail_url) mediaUrls.push(story.thumbnail_url);
      if (story.audio_url) mediaUrls.push(story.audio_url);
    }

    // Delete story highlight items first (foreign key constraint)
    const storyIds = expiredStories.map(s => s.id);
    
    const { error: highlightItemsError } = await supabase
      .from('story_highlight_items')
      .delete()
      .in('story_id', storyIds);

    if (highlightItemsError) {
      console.error('Error deleting highlight items:', highlightItemsError);
    }

    // Delete story views
    const { error: viewsError } = await supabase
      .from('story_views')
      .delete()
      .in('story_id', storyIds);

    if (viewsError) {
      console.error('Error deleting story views:', viewsError);
    }

    // Delete story reactions
    const { error: reactionsError } = await supabase
      .from('story_reactions')
      .delete()
      .in('story_id', storyIds);

    if (reactionsError) {
      console.error('Error deleting story reactions:', reactionsError);
    }

    // Delete story replies
    const { error: repliesError } = await supabase
      .from('story_replies')
      .delete()
      .in('story_id', storyIds);

    if (repliesError) {
      console.error('Error deleting story replies:', repliesError);
    }

    // Delete the stories themselves
    const { error: deleteError } = await supabase
      .from('stories')
      .delete()
      .in('id', storyIds);

    if (deleteError) {
      console.error('Error deleting stories:', deleteError);
      throw deleteError;
    }

    // Delete media files from DO Spaces
    for (const url of mediaUrls) {
      try {
        // Extract the file path from the URL
        const urlObj = new URL(url);
        const filePath = urlObj.pathname.replace(`/${doSpacesBucket}/`, '').replace(/^\//, '');
        
        if (!filePath) continue;

        // Call delete-from-spaces edge function
        const { error: deleteMediaError } = await supabase.functions.invoke('delete-from-spaces', {
          body: { filePath }
        });

        if (deleteMediaError) {
          console.error(`Error deleting media file ${filePath}:`, deleteMediaError);
        } else {
          console.log(`Deleted media file: ${filePath}`);
        }
      } catch (e) {
        console.error(`Error processing media URL ${url}:`, e);
      }
    }

    console.log(`Successfully deleted ${expiredStories.length} expired stories`);

    return new Response(
      JSON.stringify({ 
        message: 'Expired stories cleaned up successfully', 
        deleted: expiredStories.length,
        mediaFilesProcessed: mediaUrls.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Cleanup error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
