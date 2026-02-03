import { useQuery } from '@tanstack/react-query';
import { api, TrendingHashtag } from '@/lib/api';

export type { TrendingHashtag };

export function useTrendingHashtags(limit: number = 5) {
  return useQuery({
    queryKey: ['trending-hashtags', limit],
    queryFn: async () => {
      const response = await api.getTrendingHashtags(limit);
      return response.data || [];
    },
    staleTime: 60 * 1000, // 60 seconds - match Redis TTL
  });
}
