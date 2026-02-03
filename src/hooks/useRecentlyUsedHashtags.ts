import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

export interface RecentHashtag {
  hashtag: string;
  last_used: string;
  use_count: number;
}

export function useRecentlyUsedHashtags(limit = 5) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recently-used-hashtags', user?.id, limit],
    queryFn: async (): Promise<RecentHashtag[]> => {
      if (!user) return [];

      const response = await api.getRecentlyUsedHashtags(user.id, limit);
      return (response.data || []) as RecentHashtag[];
    },
    enabled: !!user,
    staleTime: 60000, // 1 minute
  });
}
