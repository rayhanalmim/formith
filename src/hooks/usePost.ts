import { useQuery } from '@tanstack/react-query';
import { api, Post } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export function usePost(postId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['post', postId, user?.id],
    queryFn: async (): Promise<Post | null> => {
      const response = await api.getPostById(postId, user?.id);
      return response.data || null;
    },
    enabled: !!postId,
  });
}
