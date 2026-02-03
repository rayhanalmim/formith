  import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socketClient, CommentEvent } from '@/lib/socket';

export function useRealtimeComments(postId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!postId) return;

    // Subscribe to comments room for this post
    socketClient.subscribeToComments(postId);

    // Handle comment changes
    const handleCommentChange = (event: CommentEvent) => {
      if (event.postId === postId) {
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
