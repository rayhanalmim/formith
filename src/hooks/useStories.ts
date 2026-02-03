/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api, UserStories, Story, StoryProfile } from '@/lib/api';
import { socketClient } from '@/lib/socket';
import { useAuth } from '@/contexts/AuthContext';
import { deleteFromSpaces } from '@/hooks/useDeleteFromSpaces';

export type { StoryProfile, Story, UserStories };

export interface TextOverlay {
  text: string;
  position: { x: number; y: number };
  font: string;
  color: string;
  size: number;
  backgroundColor?: string;
}

export interface Sticker {
  type: 'emoji' | 'sticker' | 'gif';
  data: string;
  position: { x: number; y: number };
  size: number;
  rotation?: number;
}

// Fetch stories from users the current user follows + own stories
export function useStories() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['stories', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const response = await api.getStories(user.id);
      return response.data || [];
    },
    enabled: !!user,
    staleTime: 60 * 1000, // 60 seconds - match Redis TTL
    // No polling - using socket instead
  });

  // Subscribe to Socket.io for realtime stories updates
  useEffect(() => {
    if (!user) return;

    const unsubStoriesUpdate = socketClient.onStoriesUpdate((event) => {
      // Invalidate stories query when any story event occurs
      queryClient.invalidateQueries({ queryKey: ['stories', user.id] });
    });

    return () => {
      unsubStoriesUpdate();
    };
  }, [user, queryClient]);

  return query;
}

export interface ReactionEmoji {
  emoji: string;
  position: { x: number; y: number };
}

// Create a new story
export function useCreateStory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({
      mediaUrl,
      mediaType,
      thumbnailUrl,
      textOverlay,
      stickers,
      filter,
      audioUrl,
      reactionEmoji,
    }: {
      mediaUrl: string;
      mediaType: 'image' | 'video';
      thumbnailUrl?: string;
      textOverlay?: TextOverlay | null;
      stickers?: Sticker[];
      filter?: string | null;
      audioUrl?: string | null;
      reactionEmoji?: ReactionEmoji;
    }) => {
      if (!user) throw new Error('Must be logged in to create a story');
      
      const response = await api.createStory({
        userId: user.id,
        mediaUrl,
        mediaType,
        thumbnailUrl,
        textOverlay: textOverlay as any,
        stickers: stickers as any[] || [],
        filter: filter || undefined,
        audioUrl: audioUrl || undefined,
        reactionEmoji: reactionEmoji as any,
      });
      
      if (!response.success) throw new Error('Failed to create story');
      return response.data as { id: string; [key: string]: any };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}

// Delete a story (also deletes media from Spaces)
export function useDeleteStory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (storyId: string) => {
      if (!user) throw new Error('Must be logged in');
      
      const response = await api.deleteStory(storyId, user.id);
      if (!response.success) throw new Error('Failed to delete story');
      
      // Delete media files from Spaces (non-blocking)
      const urlsToDelete: string[] = [];
      if (response.data?.mediaUrl) urlsToDelete.push(response.data.mediaUrl);
      if (response.data?.thumbnailUrl) urlsToDelete.push(response.data.thumbnailUrl);
      
      if (urlsToDelete.length > 0) {
        deleteFromSpaces(urlsToDelete).then(result => {
          console.log('[useDeleteStory] Spaces cleanup result:', result);
        }).catch(err => {
          console.error('[useDeleteStory] Failed to delete from Spaces:', err);
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}

// Mark a story as viewed
export function useViewStory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ storyId, storyOwnerId }: { storyId: string; storyOwnerId: string }) => {
      if (!user) return { storyId, storyOwnerId };
      
      await api.viewStory(storyId, user.id, storyOwnerId);
      return { storyId, storyOwnerId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}

// Get story viewers
export function useStoryViewers(storyId: string) {
  return useQuery({
    queryKey: ['story-viewers', storyId],
    queryFn: async () => {
      const response = await api.getStoryViewers(storyId);
      return response.data || [];
    },
    enabled: !!storyId,
  });
}

// React to a story
export function useReactToStory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ storyId, emoji }: { storyId: string; emoji: string }) => {
      if (!user) throw new Error('Must be logged in');
      await api.reactToStory(storyId, user.id, emoji);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story-reactions'] });
    },
  });
}

// Reply to a story
export function useReplyToStory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ storyId, content }: { storyId: string; content: string }) => {
      if (!user) throw new Error('Must be logged in');
      await api.replyToStory(storyId, user.id, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story-replies'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
