/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import type { Post } from './usePosts';

export function useBookmarkedPosts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bookmarked-posts', user?.id],
    queryFn: async (): Promise<Post[]> => {
      if (!user) return [];

      const response = await api.getBookmarkedPosts(user.id);
      return (response.data || []) as Post[];
    },
    enabled: !!user,
  });
}
