import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  display_name_ar: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  is_verified: boolean | null;
  is_banned: boolean | null;
  followers_count: number | null;
  following_count: number | null;
  posts_count: number | null;
  status: string | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
  // Additional profile fields
  birthday: string | null;
  gender: string | null;
  birthplace: string | null;
  current_location: string | null;
  relationship_status: string | null;
  // Privacy settings
  show_birthday: boolean | null;
  show_gender: boolean | null;
  show_birthplace: boolean | null;
  show_location: boolean | null;
  show_relationship: boolean | null;
  show_joined_date: boolean | null;
  show_followers_count: boolean | null;
  show_following_count: boolean | null;
}

export function useProfile(username: string) {
  return useQuery({
    queryKey: ['profile', username],
    queryFn: async (): Promise<Profile | null> => {
      const response = await api.getProfileByUsername(username);
      if (!response.success || !response.data) return null;
      return response.data as unknown as Profile;
    },
    enabled: !!username,
  });
}

export function useCurrentUserProfile() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['profile', 'current', user?.id],
    queryFn: async (): Promise<Profile | null> => {
      if (!user) return null;
      const response = await api.getProfile(user.id);
      if (!response.success || !response.data) return null;
      return response.data as unknown as Profile;
    },
    enabled: !!user,
  });
}

export function useUserPosts(userId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-posts', userId],
    queryFn: async () => {
      const response = await api.getUserPosts(userId, user?.id);
      return response.data || [];
    },
    enabled: !!userId,
  });
}

// Fetch posts that a user has liked (for their own profile only)
export function useUserLikes(userId: string, enabled: boolean = true) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-likes', userId],
    queryFn: async () => {
      const response = await api.getUserLikes(userId, user?.id);
      return response.data || [];
    },
    enabled: !!userId && enabled,
  });
}

export function useFollowers(userId: string) {
  return useQuery({
    queryKey: ['followers', userId],
    queryFn: async () => {
      const response = await api.getFollowers(userId);
      return response.data || [];
    },
    enabled: !!userId,
  });
}

export function useFollowing(userId: string) {
  return useQuery({
    queryKey: ['following', userId],
    queryFn: async () => {
      const response = await api.getFollowing(userId);
      return response.data || [];
    },
    enabled: !!userId,
  });
}

export function useIsFollowing(targetUserId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['is-following', user?.id, targetUserId],
    queryFn: async () => {
      if (!user) return false;
      const response = await api.isFollowing(user.id, targetUserId);
      return response.data?.isFollowing || false;
    },
    enabled: !!user && !!targetUserId && user.id !== targetUserId,
  });
}

export function useToggleFollow() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ targetUserId, isFollowing }: { targetUserId: string; isFollowing: boolean }) => {
      if (!user) throw new Error('Must be logged in');
      
      if (isFollowing) {
        await api.unfollowUser(user.id, targetUserId);
      } else {
        await api.followUser(user.id, targetUserId);
      }
      
      return { targetUserId, isFollowing: !isFollowing };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['is-following'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user) throw new Error('Must be logged in');
      const response = await api.updateProfile(user.id, updates);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
