import { useInfiniteQuery } from '@tanstack/react-query';
import { api, SuggestedUser } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export type { SuggestedUser };
export type SortOption = 'most_followed' | 'recently_joined' | 'verified';

const PAGE_SIZE = 10;

export function useInfiniteSuggestedUsers(
  sortBy: SortOption = 'most_followed',
  verifiedOnly: boolean = false,
  searchQuery: string = ''
) {
  const { user } = useAuth();
  
  return useInfiniteQuery({
    queryKey: ['infinite-suggested-users', user?.id, sortBy, verifiedOnly, searchQuery],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await api.getInfiniteSuggestedUsers({
        userId: user?.id,
        sortBy,
        verifiedOnly,
        searchQuery,
        limit: PAGE_SIZE,
        offset: pageParam * PAGE_SIZE,
      });

      const users = response.data || [];

      return {
        users,
        nextPage: users.length === PAGE_SIZE ? pageParam + 1 : undefined,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 5 * 60 * 1000,
  });
}
