import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');

    if (!slug) {
      return new Response('Missing slug parameter', { 
        status: 400, 
        headers: corsHeaders 
      });
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
        profiles!inner (
          username,
          display_name,
          display_name_ar,
          avatar_url,
          is_verified
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

    if (error || !post) {
      console.error('Post not found:', error);
      return new Response('Post not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    // Extract data
    const profile = post.profiles as any;
    const category = post.categories as any;
    const media = (post.post_media as any[]) || [];

    // Get display name and truncated content
    const displayName = profile?.display_name || profile?.username || 'User';
    const isVerified = profile?.is_verified || false;
    const categoryName = category?.name_en || 'Post';
    
    // Truncate content for display
    const contentPreview = post.content.length > 120 
      ? post.content.substring(0, 117) + '...' 
      : post.content;

    // Get first image from post if available
    const sortedMedia = media.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const firstImage = sortedMedia.find(m => m.media_type === 'image' || m.media_type?.startsWith('image/'));
    const postImageUrl = firstImage?.media_url || null;

    // Build the prompt for image generation
    const verifiedBadge = isVerified ? '✓' : '';
    const imagePrompt = `Create a professional social media Open Graph preview card for a forum post with the following specifications:

LAYOUT (1200x630 pixels, 16:9 aspect ratio):
- Dark gradient background from deep purple (#1a1a2e) to dark blue (#16213e)
- Tahweel branding: "TAHWEEL" logo text in magenta/pink gradient top-left corner
- Main content area with subtle glass/frosted effect card

CONTENT TO DISPLAY:
- Author: "${displayName}" ${verifiedBadge ? 'with blue verified checkmark badge' : ''}
- Category: "${categoryName}" as a small pill/badge
- Post text: "${contentPreview}"
${postImageUrl ? '- Include a small thumbnail preview of the post image in bottom right' : ''}

STYLE:
- Modern, clean, fintech/social media aesthetic
- Use magenta/pink (#c9379d) and gold (#d4a12a) accent colors
- Professional typography with good contrast
- The card should look premium and trustworthy

Make sure the text is clearly readable and the overall design is visually appealing for social media sharing.`;

    // Call Lovable AI to generate the image
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response('AI service not configured', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    console.log('Generating OG image for post:', slug);

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [
          {
            role: 'user',
            content: imagePrompt,
          },
        ],
        modalities: ['image', 'text'],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      return new Response('Failed to generate image', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    // Extract the generated image
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageData) {
      console.error('No image in AI response:', JSON.stringify(aiData).substring(0, 500));
      return new Response('No image generated', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    // If it's a base64 data URL, extract and return the image
    if (imageData.startsWith('data:image/')) {
      const base64Data = imageData.split(',')[1];
      const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      // Determine content type
      const contentType = imageData.split(';')[0].replace('data:', '');
      
      return new Response(imageBytes, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
      });
    }

    // If it's a URL, redirect to it
    return Response.redirect(imageData, 302);

  } catch (err) {
    console.error('Error generating OG image:', err);
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
