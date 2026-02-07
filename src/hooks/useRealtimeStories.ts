import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socketClient, StoryEvent } from '@/lib/socket';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

export function useRealtimeStories() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Subscribe to stories room
    socketClient.subscribeToStories();

    // Handle story changes
    const handleStoryUpdate = (event: { type: 'new' | 'delete' | 'view'; userId?: string; storyId?: string }) => {
      console.log('[useRealtimeStories] Story update received:', event);
      // Invalidate stories query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      
      // Also invalidate highlights so other users see highlight changes in realtime
      queryClient.invalidateQueries({ queryKey: ['story-highlights'] });
      
      // If it's a view event, refresh viewers for that story
      if (event.type === 'view' && event.storyId) {
        queryClient.invalidateQueries({ 
          queryKey: ['story-viewers', event.storyId] 
        });
      }
    };

    const unsubscribe = socketClient.onStoriesUpdate(handleStoryUpdate);

    return () => {
      unsubscribe();
    };
  }, [user, queryClient]);

  // Broadcast a story event via API (which will emit via socket)
  const broadcastStoryEvent = useCallback(async (event: StoryEvent) => {
    // The backend will emit the socket event
    // This is handled by the stories service when creating/viewing stories
  }, []);

  return { broadcastStoryEvent };
}

// Hook to broadcast when creating a new story (handled by backend now)
export function useBroadcastNewStory() {
  const { user } = useAuth();

  return useCallback(async (storyId: string) => {
    if (!user) return;
    // Story creation now handled by backend which emits socket event
  }, [user]);
}

// Hook to broadcast when viewing a story (handled by backend now)
export function useBroadcastStoryView() {
  const { user } = useAuth();

  return useCallback(async (storyId: string, storyOwnerId: string) => {
    if (!user || user.id === storyOwnerId) return;
    // Story view now handled by backend which emits socket event
  }, [user]);
}
