import { useQuery } from '@tanstack/react-query';
import { api, Post } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export function usePostBySlug(slugOrId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['post-by-slug', slugOrId, user?.id],
    queryFn: async (): Promise<(Post & { slug: string }) | null> => {
      const response = await api.getPostBySlug(slugOrId, user?.id);
      return (response.data as Post & { slug: string }) || null;
    },
    enabled: !!slugOrId,
  });
}
