import { useQuery } from '@tanstack/react-query';
import { api, MutualFollower } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export type { MutualFollower };

export function useMutualFollowers(targetUserIds: string[]) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['mutual-followers', user?.id, targetUserIds],
    queryFn: async (): Promise<Record<string, MutualFollower[]>> => {
      if (!user || targetUserIds.length === 0) {
        return {};
      }

      const response = await api.getMutualFollowers(user.id, targetUserIds);
      return response.data || {};
    },
    enabled: !!user && targetUserIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMutualFollowersCount(targetUserId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['mutual-followers-count', user?.id, targetUserId],
    queryFn: async (): Promise<{ count: number; samples: MutualFollower[] }> => {
      if (!user) {
        return { count: 0, samples: [] };
      }

      const response = await api.getMutualFollowersCount(user.id, targetUserId);
      return response.data || { count: 0, samples: [] };
    },
    enabled: !!user && !!targetUserId && user.id !== targetUserId,
    staleTime: 5 * 60 * 1000,
  });
}
