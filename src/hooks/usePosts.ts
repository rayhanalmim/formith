/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, Post, PostProfile, PostCategory, PostMedia } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { deleteFromSpaces } from './useDeleteFromSpaces';

// Re-export types from api.ts
export type { Post, PostProfile, PostCategory, PostMedia };

// Simplified original post data for reposts/quotes
export interface OriginalPostData {
  id: string;
  content: string;
  slug: string | null;
  profile: PostProfile | null;
  media: PostMedia[];
}

export function usePosts(options?: { categoryId?: string; tab?: string }) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['posts', options?.categoryId, options?.tab, user?.id],
    queryFn: async (): Promise<Post[]> => {
      const response = await api.getPostsFeed({
        categoryId: options?.categoryId,
        tab: options?.tab,
        userId: user?.id,
        limit: 50,
      });
      return response.data || [];
    },
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      content, 
      categoryId, 
      location, 
      feeling,
      userProfile,
      category,
    }: { 
      content: string; 
      categoryId?: string; 
      location?: string; 
      feeling?: string;
      userProfile?: PostProfile | null;
      category?: PostCategory | null;
    }) => {
      if (!user) throw new Error('Must be logged in to create a post');
      
      const response = await api.createPost({
        content,
        user_id: user.id,
        category_id: categoryId,
        location,
        feeling,
      });
      
      if (!response.success || !response.data) {
        throw new Error('Failed to create post');
      }
      
      const now = new Date().toISOString();
      
      // Return full post data for optimistic update
      return {
        ...response.data,
        profile: userProfile || null,
        category: category || null,
        media: [],
        user_liked: false,
        user_bookmarked: false,
        original_post: null,
      } as Post;
    },
    onSuccess: (newPost) => {
      // Immediately prepend the new post to infinite-posts cache
      queryClient.setQueriesData<any>(
        { queryKey: ['infinite-posts'] },
        (oldData: any) => {
          if (!oldData?.pages) return oldData;
          
          return {
            ...oldData,
            pages: oldData.pages.map((page: any, index: number) => {
              if (index === 0) {
                // Remove any temp posts and add the real one
                const filteredPosts = page.posts?.filter((p: any) => !p.id.startsWith('temp-')) || [];
                const exists = filteredPosts.some((p: any) => p.id === newPost.id);
                if (exists) return { ...page, posts: filteredPosts };
                return {
                  ...page,
                  posts: [newPost, ...filteredPosts],
                };
              }
              // Remove temp posts from other pages too
              return {
                ...page,
                posts: page.posts?.filter((p: any) => !p.id.startsWith('temp-')) || [],
              };
            }),
          };
        }
      );
      
      // Invalidate other queries for consistency
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      queryClient.invalidateQueries({ queryKey: ['trending-hashtags'] });
      queryClient.invalidateQueries({ queryKey: ['hashtag-search'] });
    },
  });
}

export function useCreateRepost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      originalPostId, 
      quoteContent, 
      categoryId 
    }: { 
      originalPostId: string; 
      quoteContent?: string; 
      categoryId?: string;
    }) => {
      if (!user) throw new Error('Must be logged in to repost');
      
      // Get original post data for the response
      const origResponse = await api.getPostById(originalPostId, user.id);
      const originalPost = origResponse.data;
      
      if (!originalPost) throw new Error('Original post not found');
      
      // Get current user's profile from cache for optimistic update
      const cachedProfile = queryClient.getQueryData<any>(['profile', user.id]);
      const userProfile: PostProfile | null = cachedProfile ? {
        id: cachedProfile.id || user.id,
        user_id: user.id,
        username: cachedProfile.username || user.email?.split('@')[0] || 'user',
        display_name: cachedProfile.display_name || null,
        display_name_ar: cachedProfile.display_name_ar || null,
        avatar_url: cachedProfile.avatar_url || null,
        is_verified: cachedProfile.is_verified || false,
      } : null;
      
      // Create repost via API
      const response = await api.createPost({
        content: quoteContent || originalPost.content,
        user_id: user.id,
        category_id: categoryId,
        repost_of_id: originalPostId,
        quote_content: quoteContent,
      });
      
      if (!response.success || !response.data) {
        throw new Error('Failed to create repost');
      }
      
      // Server now returns enriched post with profile data
      // Use server data if available, fallback to cached profile
      return {
        ...response.data,
        profile: response.data.profile || userProfile,
      } as Post;
    },
    onSuccess: (newPost) => {
      // Immediately prepend the new repost to infinite-posts cache
      queryClient.setQueriesData<any>(
        { queryKey: ['infinite-posts'] },
        (oldData: any) => {
          if (!oldData?.pages) return oldData;
          
          return {
            ...oldData,
            pages: oldData.pages.map((page: any, index: number) => {
              if (index === 0) {
                // Prepend to first page, avoid duplicates
                const exists = page.posts?.some((p: any) => p.id === newPost.id);
                if (exists) return page;
                return {
                  ...page,
                  posts: [newPost, ...(page.posts || [])],
                };
              }
              return page;
            }),
          };
        }
      );
      
      // Also update shares_count on the original post in the cache
      if (newPost.repost_of_id) {
        queryClient.setQueriesData<any>(
          { queryKey: ['infinite-posts'] },
          (oldData: any) => {
            if (!oldData?.pages) return oldData;
            
            return {
              ...oldData,
              pages: oldData.pages.map((page: any) => ({
                ...page,
                posts: page.posts?.map((p: any) => 
                  p.id === newPost.repost_of_id 
                    ? { ...p, shares_count: (p.shares_count || 0) + 1 }
                    : p
                ) || [],
              })),
            };
          }
        );
      }
      
      // Invalidate other queries for consistency
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['infinite-hashtag-posts'] });
      queryClient.invalidateQueries({ queryKey: ['trending-hashtags'] });
      queryClient.invalidateQueries({ queryKey: ['hashtag-search'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useToggleLike() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      if (!user) throw new Error('Must be logged in to like a post');
      
      const response = await api.togglePostLike(postId, user.id, isLiked);
      
      return { postId, ...(response.data as { is_liked: boolean; likes_count: number }) };
    },
    onMutate: async ({ postId, isLiked }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['infinite-posts'] });
      
      // Optimistically update the like count and user_liked status
      queryClient.setQueriesData<any>(
        { queryKey: ['infinite-posts'] },
        (oldData: any) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              posts: page.posts.map((p: any) => 
                p.id === postId 
                  ? { 
                      ...p, 
                      user_liked: !isLiked,
                      likes_count: isLiked 
                        ? Math.max((p.likes_count || 0) - 1, 0)
                        : (p.likes_count || 0) + 1
                    }
                  : p
              ),
            })),
          };
        }
      );
    },
    onSuccess: (data, { postId }) => {
      // Update with actual server response
      if (data?.likes_count !== undefined) {
        queryClient.setQueriesData<any>(
          { queryKey: ['infinite-posts'] },
          (oldData: any) => {
            if (!oldData?.pages) return oldData;
            return {
              ...oldData,
              pages: oldData.pages.map((page: any) => ({
                ...page,
                posts: page.posts.map((p: any) => 
                  p.id === postId 
                    ? { ...p, likes_count: data.likes_count, user_liked: data.is_liked }
                    : p
                ),
              })),
            };
          }
        );
      }
    },
    onError: () => {
      // Refetch on error to restore correct state
      queryClient.invalidateQueries({ queryKey: ['infinite-posts'] });
    },
  });
}

export function useToggleBookmark() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ postId, isBookmarked }: { postId: string; isBookmarked: boolean }) => {
      if (!user) throw new Error('Must be logged in to bookmark a post');
      
      await api.togglePostBookmark(postId, user.id, isBookmarked);
      
      return { postId, isBookmarked: !isBookmarked };
    },
    onMutate: async ({ postId, isBookmarked }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      await queryClient.cancelQueries({ queryKey: ['infinite-posts'] });
      await queryClient.cancelQueries({ queryKey: ['bookmarked-posts'] });
      
      // Get previous values for rollback
      const previousPosts = queryClient.getQueryData(['posts']);
      const previousInfinitePosts = queryClient.getQueryData(['infinite-posts']);
      const previousBookmarkedPosts = queryClient.getQueryData(['bookmarked-posts']);
      
      return { previousPosts, previousInfinitePosts, previousBookmarkedPosts };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts'], context.previousPosts);
      }
      if (context?.previousInfinitePosts) {
        queryClient.setQueryData(['infinite-posts'], context.previousInfinitePosts);
      }
      if (context?.previousBookmarkedPosts) {
        queryClient.setQueryData(['bookmarked-posts'], context.previousBookmarkedPosts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['infinite-posts'] });
      queryClient.invalidateQueries({ queryKey: ['bookmarked-posts'] });
      queryClient.invalidateQueries({ queryKey: ['trending-hashtags'] });
      queryClient.invalidateQueries({ queryKey: ['hashtag-search'] });
    },
  });
}

export function useEditPost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      if (!user) throw new Error('Must be logged in to edit a post');
      
      const response = await api.updatePost(postId, user.id, content);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      queryClient.invalidateQueries({ queryKey: ['trending-hashtags'] });
      queryClient.invalidateQueries({ queryKey: ['hashtag-search'] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error('Must be logged in to delete a post');
      
      const response = await api.deletePost(postId, user.id);
      
      // Delete files from storage if any media URLs returned
      const mediaUrls = response.data?.mediaUrls || [];
      if (mediaUrls.length > 0) {
        console.log('[useDeletePost] Deleting media from storage:', mediaUrls);
        deleteFromSpaces(mediaUrls).then(result => {
          console.log('[useDeletePost] Storage cleanup result:', result);
        }).catch(err => {
          console.error('[useDeletePost] Storage cleanup failed:', err);
        });
      }
      
      return postId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['trending-hashtags'] });
      queryClient.invalidateQueries({ queryKey: ['hashtag-search'] });
    },
  });
}

// Helper function to check if a post can be edited (within 30 minutes of creation)
export function canEditPost(createdAt: string): boolean {
  const createdTime = new Date(createdAt).getTime();
  const now = Date.now();
  const thirtyMinutes = 30 * 60 * 1000;
  return now - createdTime < thirtyMinutes;
}
