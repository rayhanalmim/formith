import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');
    const baseUrl = 'https://forumth.lovable.app';
    const siteName = 'Tahweel';
    const defaultDescription = 'Tahweel Community - Money Transfer, eSIM, Top-up & More';
    // Use Tahweel banner as default OG image
    const defaultImage = `${baseUrl}/images/tahweel-banner.jpg`;

    if (!slug) {
      // Return default OG tags
      return generateHtmlResponse({
        title: 'Tahweel - Money Transfer, eSIM, Top-up & More',
        description: defaultDescription,
        image: defaultImage,
        url: baseUrl,
        type: 'website',
        siteName,
      }, baseUrl);
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

    if (error || !post) {
      // Return default OG tags if post not found
      return generateHtmlResponse({
        title: 'Post Not Found | Tahweel',
        description: 'The post you are looking for does not exist',
        image: defaultImage,
        url: baseUrl,
        type: 'website',
        siteName,
      }, baseUrl);
    }

    // Extract data
    const profile = post.profiles as any;
    const category = post.categories as any;
    const media = (post.post_media as any[]) || [];

    // Get display name
    const displayName = profile?.display_name || profile?.username || 'User';

    // Get first image from post media - prioritize actual post images
    const sortedMedia = media.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const firstImage = sortedMedia.find(m => m.media_type === 'image' || m.media_type?.startsWith('image/'));
    // Use post's first image if available, otherwise fall back to default Tahweel banner
    const ogImage = firstImage?.media_url || defaultImage;
    
    console.log('Post slug:', slug, 'Media count:', media.length, 'First image:', firstImage?.media_url, 'OG Image:', ogImage);

    // Create description (first 160 chars)
    const description = post.content.length > 160 
      ? post.content.substring(0, 157) + '...' 
      : post.content;

    // Create title
    const title = `${displayName}: ${post.content.substring(0, 50)}${post.content.length > 50 ? '...' : ''} | Tahweel`;

    // Build canonical URL
    const canonicalPath = category?.slug 
      ? `/category/${category.slug}/post/${post.slug}`
      : `/post/${post.slug}`;
    const canonicalUrl = `${baseUrl}${canonicalPath}`;

    return generateHtmlResponse({
      title,
      description,
      image: ogImage,
      url: canonicalUrl,
      type: 'article',
      siteName,
      author: displayName,
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
    }, baseUrl);

  } catch (err) {
    console.error('Error:', err);
    // Return basic HTML on error
    return new Response(
      '<!DOCTYPE html><html><head><title>Tahweel</title></head><body>Redirecting...</body></html>',
      { 
        status: 200, 
        headers: { 'Content-Type': 'text/html; charset=utf-8' } 
      }
    );
  }
});

interface OGData {
  title: string;
  description: string;
  image: string;
  url: string;
  type: string;
  siteName: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

function generateHtmlResponse(og: OGData, baseUrl: string): Response {
  // Escape HTML special characters
  const escapeHtml = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(og.title)}</title>
  <meta name="description" content="${escapeHtml(og.description)}">
  <link rel="canonical" href="${escapeHtml(og.url)}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="${og.type}">
  <meta property="og:url" content="${escapeHtml(og.url)}">
  <meta property="og:title" content="${escapeHtml(og.title)}">
  <meta property="og:description" content="${escapeHtml(og.description)}">
  <meta property="og:image" content="${escapeHtml(og.image)}">
  <meta property="og:site_name" content="${escapeHtml(og.siteName)}">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${escapeHtml(og.url)}">
  <meta name="twitter:title" content="${escapeHtml(og.title)}">
  <meta name="twitter:description" content="${escapeHtml(og.description)}">
  <meta name="twitter:image" content="${escapeHtml(og.image)}">
  
  ${og.type === 'article' && og.author ? `<meta property="article:author" content="${escapeHtml(og.author)}">` : ''}
  ${og.type === 'article' && og.publishedTime ? `<meta property="article:published_time" content="${og.publishedTime}">` : ''}
  ${og.type === 'article' && og.modifiedTime ? `<meta property="article:modified_time" content="${og.modifiedTime}">` : ''}
  
  <!-- Redirect to actual app -->
  <script>
    window.location.replace("${escapeHtml(og.url)}");
  </script>
  <meta http-equiv="refresh" content="0;url=${escapeHtml(og.url)}">
</head>
<body>
  <p>Redirecting to <a href="${escapeHtml(og.url)}">${escapeHtml(og.title)}</a>...</p>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=60, s-maxage=60', // Shorter cache for fresher previews
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
