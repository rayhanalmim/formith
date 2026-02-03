import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socketClient, CommentEvent } from '@/lib/socket';

interface LikeCountUpdate {
  commentId: string;
  likesCount: number;
}

// Global callback for comment like updates
type LikeCountCallback = (update: LikeCountUpdate) => void;
const likeCountCallbacks = new Set<LikeCountCallback>();

export function subscribeToCommentLikeUpdates(callback: LikeCountCallback): () => void {
  likeCountCallbacks.add(callback);
  return () => {
    likeCountCallbacks.delete(callback);
  };
}

export function useRealtimeCommentLikes(postId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!postId) return;

    // Subscribe to comments room for this post
    socketClient.subscribeToComments(postId);

    // Handle comment changes (which includes like updates)
    const handleCommentChange = (event: CommentEvent) => {
      if (event.postId === postId && event.type === 'update') {
        // Invalidate comments query to refresh data including like counts
        queryClient.invalidateQueries({ queryKey: ['comments', postId] });
        queryClient.invalidateQueries({ queryKey: ['infinite-comments', postId] });
      }
    };

    const unsubscribe = socketClient.onCommentChange(handleCommentChange);

    return () => {
      unsubscribe();
      socketClient.unsubscribeFromComments(postId);
    };
  }, [postId, queryClient]);
}
