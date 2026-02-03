import { useInfiniteQuery } from '@tanstack/react-query';
import { api, Post } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const PAGE_SIZE = 20;

export function useInfinitePosts(options?: { categoryId?: string; tab?: string; location?: string }) {
  const { user } = useAuth();
  
  // Note: user?.id is NOT in queryKey to prevent refetch when auth hydrates
  // User-specific data (likes/bookmarks) is hydrated server-side via the API call
  return useInfiniteQuery({
    queryKey: ['infinite-posts', options?.categoryId, options?.tab, options?.location],
    queryFn: async ({ pageParam = 0 }): Promise<{ posts: Post[]; nextPage: number | undefined }> => {
      const response = await api.getPostsFeed({
        categoryId: options?.categoryId,
        tab: options?.tab,
        location: options?.location,
        userId: user?.id,
        limit: PAGE_SIZE,
        offset: pageParam * PAGE_SIZE,
      });
      
      const posts = response.data || [];
      
      return {
        posts,
        nextPage: posts.length === PAGE_SIZE ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: 60 * 1000, // 60 seconds - match Redis cache TTL to prevent refetch flicker
  });
}
