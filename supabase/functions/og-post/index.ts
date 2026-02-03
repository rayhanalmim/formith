import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');

    if (!slug) {
      return new Response(
        JSON.stringify({ error: 'Missing slug parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch post by slug
    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        id,
        content,
        slug,
        created_at,
        updated_at,
        profiles!inner (
          username,
          display_name,
          display_name_ar,
          avatar_url
        ),
        categories (
          name_en,
          name_ar,
          slug
        ),
        post_media (
          media_url,
          media_type,
          sort_order
        )
      `)
      .eq('slug', slug)
      .eq('is_approved', true)
      .eq('is_hidden', false)
      .maybeSingle();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!post) {
      return new Response(
        JSON.stringify({ error: 'Post not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract data
    const profile = post.profiles as any;
    const category = post.categories as any;
    const media = (post.post_media as any[]) || [];

    // Get display name
    const displayName = profile?.display_name || profile?.username || 'User';

    // Get first image
    const sortedMedia = media.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const firstImage = sortedMedia.find(m => m.media_type === 'image');
    const ogImage = firstImage?.media_url || null;

    // Create description (first 160 chars)
    const description = post.content.length > 160 
      ? post.content.substring(0, 157) + '...' 
      : post.content;

    // Create title
    const title = `${displayName}: ${post.content.substring(0, 50)}${post.content.length > 50 ? '...' : ''}`;

    // Build canonical URL
    const baseUrl = 'https://forumth.lovable.app';
    const canonicalPath = category?.slug 
      ? `/category/${category.slug}/post/${post.slug}`
      : `/post/${post.slug}`;
    const canonicalUrl = `${baseUrl}${canonicalPath}`;

    // Return OG data
    return new Response(
      JSON.stringify({
        title: `${title} | Tahweel`,
        description,
        image: ogImage,
        url: canonicalUrl,
        type: 'article',
        author: displayName,
        publishedTime: post.created_at,
        modifiedTime: post.updated_at,
        siteName: 'Tahweel',
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
        } 
      }
    );
  } catch (err) {
    console.error('Error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
