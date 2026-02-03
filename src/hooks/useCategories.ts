import { useQuery } from '@tanstack/react-query';
import { api, Category } from '@/lib/api';

export type { Category };

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.getCategories();
      if (!response.success || !response.data) {
        return [] as Category[];
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - match Redis TTL
  });
}

export function useCategoryBySlug(slug: string) {
  return useQuery({
    queryKey: ['category', slug],
    queryFn: async () => {
      const response = await api.getCategoryBySlug(slug);
      if (!response.success || !response.data) {
        return null;
      }
      return response.data;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes - match Redis TTL
  });
}
