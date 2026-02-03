import { useQuery } from '@tanstack/react-query';
import { api, TrendingPost } from '@/lib/api';

export type { TrendingPost };

export function useTrendingPosts(limit: number = 5) {
  return useQuery({
    queryKey: ['trending-posts', limit],
    queryFn: async () => {
      const response = await api.getTrendingPosts(limit);
      return response.data || [];
    },
    staleTime: 60 * 1000, // 60 seconds - match Redis TTL
  });
}
