import { supabase } from '@/integrations/supabase/client';

interface DeleteResult {
  success: boolean;
  deleted: string[];
  failed: string[];
}

/**
 * Delete files from DigitalOcean Spaces storage
 * @param urls - Array of file URLs to delete
 * @returns Promise with deletion results
 */
export async function deleteFromSpaces(urls: string[]): Promise<DeleteResult> {
  if (!urls || urls.length === 0) {
    return { success: true, deleted: [], failed: [] };
  }

  // Filter out empty/null URLs
  const validUrls = urls.filter(url => url && typeof url === 'string' && url.trim().length > 0);
  
  if (validUrls.length === 0) {
    return { success: true, deleted: [], failed: [] };
  }

  try {
    console.log('[deleteFromSpaces] Deleting files:', validUrls);

    const { data, error } = await supabase.functions.invoke('delete-from-spaces', {
      body: { urls: validUrls },
    });

    if (error) {
      console.error('[deleteFromSpaces] Edge function error:', error);
      return { success: false, deleted: [], failed: validUrls };
    }

    console.log('[deleteFromSpaces] Result:', data);
    return data as DeleteResult;
  } catch (e) {
    console.error('[deleteFromSpaces] Error:', e);
    return { success: false, deleted: [], failed: validUrls };
  }
}

/**
 * Delete a single file from DigitalOcean Spaces storage
 * @param url - File URL to delete
 * @returns Promise<boolean> - true if deleted successfully
 */
export async function deleteFileFromSpaces(url: string): Promise<boolean> {
  const result = await deleteFromSpaces([url]);
  return result.deleted.includes(url);
}

/**
 * Extract media URLs from a post (including post_media records)
 */
export function extractPostMediaUrls(post: {
  media?: Array<{ media_url?: string; thumbnail_url?: string }>;
}): string[] {
  const urls: string[] = [];
  
  if (post.media && Array.isArray(post.media)) {
    for (const m of post.media) {
      if (m.media_url) urls.push(m.media_url);
      if (m.thumbnail_url) urls.push(m.thumbnail_url);
    }
  }
  
  return urls;
}

/**
 * Extract media URL from a message (DM or room message)
 */
export function extractMessageMediaUrl(message: {
  media_url?: string | null;
}): string[] {
  const urls: string[] = [];
  
  if (message.media_url) {
    urls.push(message.media_url);
  }
  
  return urls;
}
