import { useQuery } from '@tanstack/react-query';
import { api, StorageStatsResponse } from '@/lib/api';

export type { StorageStatsResponse };

export function useStorageStats() {
  return useQuery({
    queryKey: ['storage-stats'],
    queryFn: async (): Promise<StorageStatsResponse> => {
      const response = await api.getStorageStats();
      if (!response.data) {
        throw new Error('Failed to fetch storage stats');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
