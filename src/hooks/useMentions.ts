import { useQuery } from '@tanstack/react-query';
import { api, MentionUser } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export type { MentionUser };

export function useMentionSearch(query: string, enabled: boolean = true) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mention-search', query, user?.id],
    queryFn: async (): Promise<MentionUser[]> => {
      if (!user) return [];
      
      const response = await api.searchMentions(user.id, query);
      return response.data || [];
    },
    enabled: enabled && !!user,
    staleTime: 30000,
  });
}
