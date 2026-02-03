/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, StoryHighlight } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export type { StoryHighlight };

export interface StoryHighlightItem {
  id: string;
  highlight_id: string;
  story_id: string;
  added_at: string;
  sort_order: number;
  story?: {
    id: string;
    media_url: string;
    media_type: string;
    thumbnail_url: string | null;
    text_overlay: any;
    stickers: any[];
    filter: string | null;
    audio_url: string | null;
    created_at: string;
  };
}

// Fetch highlights for a user
export function useUserHighlights(userId: string | undefined) {
  return useQuery({
    queryKey: ['story-highlights', userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await api.getUserHighlights(userId);
      return response.data || [];
    },
    enabled: !!userId,
    staleTime: 60 * 1000, // 60 seconds - match Redis TTL
  });
}

// Create a new highlight
export function useCreateHighlight() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ title, coverUrl }: { title: string; coverUrl?: string }) => {
      if (!user) throw new Error('Must be logged in');
      
      const response = await api.createHighlight(user.id, title, coverUrl);
      if (!response.success) throw new Error('Failed to create highlight');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story-highlights'] });
    },
  });
}

// Update a highlight
export function useUpdateHighlight() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      highlightId, 
      title, 
      coverUrl 
    }: { 
      highlightId: string; 
      title?: string; 
      coverUrl?: string | null;
    }) => {
      if (!user) throw new Error('Must be logged in');
      
      const response = await api.updateHighlight(highlightId, user.id, { title, coverUrl });
      if (!response.success) throw new Error('Failed to update highlight');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story-highlights'] });
    },
  });
}

// Delete a highlight
export function useDeleteHighlight() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (highlightId: string) => {
      if (!user) throw new Error('Must be logged in');
      
      const response = await api.deleteHighlight(highlightId, user.id);
      if (!response.success) throw new Error('Failed to delete highlight');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story-highlights'] });
    },
  });
}

// Add a story to a highlight
export function useAddToHighlight() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ highlightId, storyId }: { highlightId: string; storyId: string }) => {
      if (!user) throw new Error('Must be logged in');
      
      const response = await api.addToHighlight(highlightId, storyId, user.id);
      if (!response.success) throw new Error('Failed to add to highlight');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story-highlights'] });
    },
  });
}

// Remove a story from a highlight
export function useRemoveFromHighlight() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ highlightId, storyId }: { highlightId: string; storyId: string }) => {
      if (!user) throw new Error('Must be logged in');
      
      const response = await api.removeFromHighlight(highlightId, storyId, user.id);
      if (!response.success) throw new Error('Failed to remove from highlight');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story-highlights'] });
    },
  });
}

// Fetch user's stories for adding to highlights
export function useUserStoriesForHighlights() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-stories-for-highlights', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const response = await api.getUserStoriesForHighlights(user.id);
      return response.data || [];
    },
    enabled: !!user,
  });
}
