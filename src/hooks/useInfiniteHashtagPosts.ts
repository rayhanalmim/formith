import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import type { Post } from './usePosts';

const PAGE_SIZE = 20;

export function useInfiniteHashtagPosts(hashtag: string | undefined) {
  const { user } = useAuth();
  
  return useInfiniteQuery({
    queryKey: ['infinite-hashtag-posts', hashtag, user?.id],
    queryFn: async ({ pageParam = 0 }) => {
      if (!hashtag) return { posts: [], nextPage: undefined };

      const response = await api.getHashtagPosts(hashtag, user?.id || null, pageParam, PAGE_SIZE);
      
      if (!response.success || !response.data) {
        return { posts: [], nextPage: undefined };
      }

      return {
        posts: response.data.posts as Post[],
        nextPage: response.data.nextPage ?? undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: !!hashtag,
  });
}
