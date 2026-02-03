import { useQuery } from '@tanstack/react-query';
import { api, TrendingTopic } from '@/lib/api';

export type { TrendingTopic };

export function useTrendingTopics(limit: number) {
  return useQuery({
    queryKey: ['trending-topics', limit],
    queryFn: async () => {
      const response = await api.getTrendingTopics(limit);
      return response.data || [];
    },
    staleTime: 60 * 1000, // 60 seconds - match Redis TTL
  });
}
