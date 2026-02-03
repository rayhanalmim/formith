/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socketClient, CounterEvent } from '@/lib/socket';
import type { Post } from './usePosts';

interface CounterUpdate {
  postId: string;
  field: 'likes_count' | 'comments_count' | 'shares_count' | 'views_count';
  value: number;
}

// Global counter update callback
type CounterCallback = (update: CounterUpdate) => void;
const counterCallbacks = new Set<CounterCallback>();

export function subscribeToCounterUpdates(callback: CounterCallback): () => void {
  counterCallbacks.add(callback);
  return () => {
    counterCallbacks.delete(callback);
  };
}

export function useRealtimePostCounters() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to posts room for counter updates
    socketClient.subscribeToPosts();

    // Handle counter changes via Socket.io
    const handleCounterChange = (event: CounterEvent) => {
      const { postId, field, value } = event;
      
      // Notify all subscribers
      counterCallbacks.forEach(cb => cb({ postId, field, value }));
      
      // Update cache
      updatePostInCache(queryClient, postId, { [field]: value });
    };

    const unsubscribe = socketClient.onCounterChange(handleCounterChange);

    return () => {
      unsubscribe();
    };
  }, [queryClient]);
}

// Helper to update post data in query cache
function updatePostInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  postId: string,
  updates: Partial<Pick<Post, 'likes_count' | 'comments_count' | 'shares_count' | 'views_count'>>
) {
  // Update infinite-posts cache
  queryClient.setQueriesData(
    { queryKey: ['infinite-posts'] },
    (oldData: any) => {
      if (!oldData?.pages) return oldData;
      
      return {
        ...oldData,
        pages: oldData.pages.map((page: any) => ({
          ...page,
          posts: page.posts.map((post: Post) =>
            post.id === postId ? { ...post, ...updates } : post
          ),
        })),
      };
    }
  );

  // Update single post cache
  queryClient.setQueriesData(
    { queryKey: ['post', postId] },
    (oldData: any) => {
      if (!oldData) return oldData;
      return { ...oldData, ...updates };
    }
  );

  // Update post-by-slug cache
  queryClient.setQueriesData(
    { queryKey: ['post-by-slug'] },
    (oldData: any) => {
      if (!oldData || oldData.id !== postId) return oldData;
      return { ...oldData, ...updates };
    }
  );
}
