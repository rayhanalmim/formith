import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socketClient, PendingPostEvent } from '@/lib/socket';

export function useRealtimePendingPosts() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to admin pending posts room
    socketClient.subscribeToAdminPending();

    // Handle pending post changes
    const handlePendingPostChange = (event: PendingPostEvent) => {
      console.log('Pending posts realtime update:', event.type);
      
      // Invalidate pending posts queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['pending-posts'] });
      queryClient.invalidateQueries({ queryKey: ['pending-posts-count'] });
    };

    const unsubscribe = socketClient.onPendingPostChange(handlePendingPostChange);

    return () => {
      unsubscribe();
    };
  }, [queryClient]);
}
