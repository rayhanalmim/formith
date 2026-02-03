import { useQuery } from '@tanstack/react-query';
import { api, MutualSuggestion } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentUserProfile } from '@/hooks/useProfile';

export type { MutualSuggestion };

export function usePeopleYouMayKnow(limit: number = 6) {
  const { user } = useAuth();
  const { data: currentUserProfile } = useCurrentUserProfile();
  
  return useQuery({
    queryKey: ['people-you-may-know', user?.id, currentUserProfile?.current_location, limit],
    queryFn: async (): Promise<MutualSuggestion[]> => {
      if (!user) return [];
      
      const response = await api.getPeopleYouMayKnow(
        user.id,
        currentUserProfile?.current_location || undefined,
        limit
      );
      
      return response.data || [];
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  });
}
