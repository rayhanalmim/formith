import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Comment } from './useComments';

// Check if a string is a valid UUID (not a temp ID)
const isValidPostId = (id: string | undefined): boolean => {
  if (!id) return false;
  if (id.startsWith('temp-')) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export interface PaginatedComment extends Comment {
  hasMoreReplies: boolean;
  totalReplies: number;
}

export function useInfiniteComments(postId: string) {
  const { user } = useAuth();
  const isValidId = isValidPostId(postId);
  
  return useInfiniteQuery({
    queryKey: ['infinite-comments', postId, user?.id],
    queryFn: async ({ pageParam = 0 }) => {
      // Skip query for temp IDs
      if (!isValidId) {
        return { comments: [], nextPage: undefined, totalCount: 0 };
      }

      const response = await api.getInfiniteComments(postId, user?.id, pageParam);
      const data = response.data || { comments: [], nextPage: undefined, totalCount: 0 };
      
      return {
        comments: data.comments as PaginatedComment[],
        nextPage: data.nextPage,
        totalCount: data.totalCount,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: !!postId && isValidId,
  });
}

export function useLoadMoreReplies(parentId: string, postId: string, loadedCount: number) {
  const { user } = useAuth();
  
  return useInfiniteQuery({
    queryKey: ['comment-replies', parentId, user?.id],
    queryFn: async ({ pageParam = loadedCount }) => {
      const response = await api.getReplies(parentId, user?.id, pageParam);
      const replies = response.data || [];

      return {
        replies: replies as Comment[],
        nextOffset: replies.length === 5 ? pageParam + 5 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialPageParam: loadedCount,
    enabled: false, // Only fetch on demand
  });
}
