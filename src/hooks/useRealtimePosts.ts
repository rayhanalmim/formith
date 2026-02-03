import { useEffect, useCallback, useState } from 'react';
import { useQueryClient, InfiniteData } from '@tanstack/react-query';
import { socketClient, PostEvent } from '@/lib/socket';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Post } from './usePosts';

// Store for new posts count - accessible globally
const newPostsCountRef = { count: 0 };
const newPostsListeners: Set<() => void> = new Set();

export function useNewPostsCount() {
  const [count, setCount] = useState(newPostsCountRef.count);
  
  useEffect(() => {
    const listener = () => setCount(newPostsCountRef.count);
    newPostsListeners.add(listener);
    return () => { newPostsListeners.delete(listener); };
  }, []);
  
  const reset = useCallback(() => {
    newPostsCountRef.count = 0;
    newPostsListeners.forEach(l => l());
  }, []);
  
  return { count, reset };
}

export function useRealtimePosts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { language } = useLanguage();
  const { user } = useAuth();

  useEffect(() => {
    // Subscribe to posts room and user's personal feed
    socketClient.subscribeToPosts();
    if (user) {
      socketClient.subscribeToFeed();
    }

    // Handle post changes
    const handlePostChange = (event: PostEvent) => {
      console.log('Post realtime update:', event.type);

      if (event.type === 'insert') {
        const newPost = event.post as Post;
        
        // Check if the post author is the current user
        const isOwnPost = user?.id === newPost?.user_id;
        
        if (isOwnPost || event.userId === user?.id) {
          // This is the user's own post or sent to their feed (followed user)
          // Prepend to cache
          queryClient.setQueryData<InfiniteData<{ posts: Post[]; nextPage?: number }>>(
            ['infinite-posts', undefined, 'latest', '', user?.id],
            (oldData) => {
              if (!oldData) return oldData;
              
              return {
                ...oldData,
                pages: oldData.pages.map((page, index) => {
                  if (index === 0) {
                    const exists = page.posts.some(p => p.id === newPost.id);
                    if (exists) return page;
                    return {
                      ...page,
                      posts: [newPost, ...page.posts],
                    };
                  }
                  return page;
                }),
              };
            }
          );
          
          // Show toast notification for followed users' posts
          if (!isOwnPost && newPost?.profile) {
            toast({
              title: language === 'ar' ? 'منشور جديد' : 'New Post',
              description: language === 'ar' 
                ? `${newPost.profile?.display_name || newPost.profile?.username} نشر منشوراً جديداً` 
                : `${newPost.profile?.display_name || newPost.profile?.username} just posted`,
              duration: 3000,
            });
          }
        } else {
          // For non-followed users, increment new posts counter
          newPostsCountRef.count += 1;
          newPostsListeners.forEach(l => l());
        }
      } else if (event.type === 'update') {
        const updatedPost = event.post;
        
        // If post was hidden or unapproved, remove it from cache
        if (updatedPost?.is_hidden === true || updatedPost?.is_approved === false) {
          queryClient.setQueriesData<InfiniteData<{ posts: Post[]; nextPage?: number }>>(
            { queryKey: ['infinite-posts'] },
            (oldData) => {
              if (!oldData) return oldData;
              return {
                ...oldData,
                pages: oldData.pages.map((page) => ({
                  ...page,
                  posts: page.posts.filter(p => p.id !== updatedPost.id),
                })),
              };
            }
          );
          
          queryClient.invalidateQueries({ queryKey: ['user-posts'] });
          queryClient.invalidateQueries({ queryKey: ['profile'] });
        } else {
          queryClient.invalidateQueries({ queryKey: ['infinite-posts'] });
        }
        
        queryClient.invalidateQueries({ queryKey: ['posts'] });
        queryClient.invalidateQueries({ queryKey: ['post', updatedPost?.id] });
        queryClient.invalidateQueries({ queryKey: ['post-by-slug', updatedPost?.slug] });
      } else if (event.type === 'delete') {
        queryClient.invalidateQueries({ queryKey: ['posts'] });
        queryClient.invalidateQueries({ queryKey: ['infinite-posts'] });
      } else if (event.type === 'like') {
        // Update likes_count in cached posts (only count, not user_liked since that's user-specific)
        const likeData = event.post as { id: string; likes_count: number; user_id: string };
        
        queryClient.setQueriesData<InfiniteData<{ posts: Post[]; nextPage?: number }>>(
          { queryKey: ['infinite-posts'] },
          (oldData) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                posts: page.posts.map(p => 
                  p.id === likeData.id 
                    ? { ...p, likes_count: likeData.likes_count }
                    : p
                ),
              })),
            };
          }
        );
        
        // Also update individual post cache
        queryClient.setQueryData(['post', likeData.id], (oldPost: Post | undefined) => {
          if (!oldPost) return oldPost;
          return { ...oldPost, likes_count: likeData.likes_count };
        });
      }
    };

    const unsubscribe = socketClient.onPostChange(handlePostChange);

    return () => {
      unsubscribe();
    };
  }, [queryClient, toast, language, user]);
}
