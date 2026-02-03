import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, SuggestedUser } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export type { SuggestedUser };

export function useSuggestedUsers(limit: number = 5) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['suggested-users', user?.id, limit],
    queryFn: async () => {
      const response = await api.getSuggestedUsers(user?.id, limit);
      return response.data || [];
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFollowUser() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ userId, isFollowing }: { userId: string; isFollowing: boolean }) => {
      if (!user) throw new Error('Must be logged in');
      
      if (isFollowing) {
        await api.unfollowUser(user.id, userId);
      } else {
        await api.followUser(user.id, userId);
      }
      
      return { userId, isFollowing: !isFollowing };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggested-users'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['people-you-may-know'] });
      queryClient.invalidateQueries({ queryKey: ['infinite-suggested-users'] });
    },
  });
}
