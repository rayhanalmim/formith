import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/**
 * Hook to fetch unique saved locations from posts
 */
export function useSavedLocations(searchTerm?: string) {
  return useQuery<string[]>({
    queryKey: ['saved-locations', searchTerm],
    queryFn: async (): Promise<string[]> => {
      const response = await api.getSavedLocations(searchTerm);
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
