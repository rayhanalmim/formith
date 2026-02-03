import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export interface CommentProfile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  display_name_ar: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  likes_count: number | null;
  is_hidden: boolean | null;
  created_at: string;
  updated_at: string;
  profile: CommentProfile | null;
  replies: Comment[];
  user_liked: boolean;
}

export function useComments(postId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['comments', postId, user?.id],
    queryFn: async () => {
      const response = await api.getComments(postId, user?.id);
      return response.data || [];
    },
    enabled: !!postId,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      postId, 
      content, 
      parentId 
    }: { 
      postId: string; 
      content: string; 
      parentId?: string;
    }) => {
      if (!user) throw new Error('Must be logged in to comment');
      
      const response = await api.createComment(postId, user.id, content, parentId);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['infinite-comments', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['infinite-posts'] });
      queryClient.invalidateQueries({ queryKey: ['infinite-hashtag-posts'] });
      queryClient.invalidateQueries({ queryKey: ['trending-hashtags'] });
      queryClient.invalidateQueries({ queryKey: ['hashtag-search'] });
    },
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      commentId, 
      postId,
      content 
    }: { 
      commentId: string; 
      postId: string;
      content: string;
    }) => {
      if (!user) throw new Error('Must be logged in to edit a comment');
      
      const response = await api.updateComment(commentId, user.id, content);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['infinite-comments', variables.postId] });
    },
  });
}

export function useToggleCommentLike() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      commentId, 
      postId,
      isLiked 
    }: { 
      commentId: string; 
      postId: string;
      isLiked: boolean;
    }) => {
      if (!user) throw new Error('Must be logged in to like a comment');
      
      const response = await api.toggleCommentLike(commentId, user.id, isLiked);
      return { commentId, isLiked: response.data?.liked ?? !isLiked };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['infinite-comments', variables.postId] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      commentId, 
      postId 
    }: { 
      commentId: string; 
      postId: string;
    }) => {
      if (!user) throw new Error('Must be logged in to delete a comment');
      
      await api.deleteComment(commentId, user.id, postId);
      return { commentId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['infinite-comments', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['infinite-posts'] });
    },
  });
}
