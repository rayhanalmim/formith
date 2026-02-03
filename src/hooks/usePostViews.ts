import { useRef, useCallback } from 'react';
import { api } from '@/lib/api';

// Track a unique view for a post (only counts once per user)
export async function trackPostView(postId: string, userId?: string): Promise<boolean> {
  try {
    // If no postId provided, return early
    if (!postId) return false;
    
    // If no user is logged in, we can't track unique views
    if (!userId || userId === 'null' || userId === 'undefined') {
      return false;
    }

    // Try to insert a view record via API
    try {
      const response = await api.trackPostView(postId, userId);
      return response.data?.tracked ?? false;
    } catch (error) {
      console.error('Error inserting view:', error);
      return false;
    }
  } catch (error) {
    console.error('Error tracking view:', error);
    return false;
  }
}

// Hook that returns a function to track views (prevents duplicate tracking in session)
export function usePostViews(postId: string | undefined) {
  const hasTracked = useRef(false);

  const trackView = useCallback(async () => {
    if (!postId || hasTracked.current) return false;
    
    const success = await trackPostView(postId);
    if (success) {
      hasTracked.current = true;
    }
    return success;
  }, [postId]);

  return { trackView, hasTracked: hasTracked.current };
}
