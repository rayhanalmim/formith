import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface HashtagSuggestion {
  hashtag: string;
  post_count: number;
}

export function useHashtagSearch(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['hashtag-search', query],
    queryFn: async (): Promise<HashtagSuggestion[]> => {
      const response = await api.searchHashtags(query || '');
      return response.data || [];
    },
    enabled: enabled && query.length >= 0,
    staleTime: 5000, // 5 seconds for near real-time updates
  });
}
