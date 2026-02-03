/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';

export interface UserSettings {
  id: string;
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  notify_likes: boolean;
  notify_comments: boolean;
  notify_follows: boolean;
  notify_messages: boolean;
  profile_visibility: 'public' | 'followers' | 'private';
  show_online_status: boolean;
  allow_messages_from: 'everyone' | 'followers' | 'nobody';
  created_at: string;
  updated_at: string;
}

export function useUserSettings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-settings', user?.id],
    queryFn: async (): Promise<UserSettings | null> => {
      if (!user) return null;

      const response = await api.getUserSettings(user.id);
      return response.data as UserSettings || null;
    },
    enabled: !!user,
  });
}

// Fetch another user's settings (for profile visibility checks)
export function useProfileVisibility(userId: string) {
  return useQuery({
    queryKey: ['user-settings-visibility', userId],
    queryFn: async (): Promise<{ profile_visibility: string } | null> => {
      if (!userId) return null;

      const response = await api.getProfileVisibility(userId);
      return response.data || null;
    },
    enabled: !!userId,
  });
}

// Fetch another user's messaging privacy settings
export function useCanMessageUser(recipientUserId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['can-message-user', user?.id, recipientUserId],
    queryFn: async (): Promise<{ canMessage: boolean; reason: string | null }> => {
      if (!user || !recipientUserId || user.id === recipientUserId) {
        return { canMessage: true, reason: null };
      }

      const response = await api.canMessageUser(user.id, recipientUserId);
      return response.data || { canMessage: true, reason: null };
    },
    enabled: !!user && !!recipientUserId && user.id !== recipientUserId,
  });
}

export function useUpdateSettings() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<UserSettings>) => {
      if (!user) throw new Error('Not authenticated');

      const response = await api.updateUserSettings(user.id, updates);
      if (!response.success) {
        throw new Error('Failed to update settings');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      toast.success(
        language === 'ar' ? 'تم حفظ الإعدادات' : 'Settings saved'
      );
    },
    onError: (error) => {
      console.error('Failed to update settings:', error);
      toast.error(
        language === 'ar' ? 'فشل حفظ الإعدادات' : 'Failed to save settings'
      );
    },
  });
}

export function useChangePassword() {
  const { language } = useLanguage();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (newPassword: string) => {
      if (!user) throw new Error('Not authenticated');
      const response = await api.updatePassword(user.id, newPassword);
      if (!response.success) throw new Error(response.error || 'Failed to update password');
    },
    onSuccess: () => {
      toast.success(
        language === 'ar' ? 'تم تغيير كلمة المرور' : 'Password changed successfully'
      );
    },
    onError: (error: any) => {
      console.error('Failed to change password:', error);
      toast.error(
        error.message || (language === 'ar' ? 'فشل تغيير كلمة المرور' : 'Failed to change password')
      );
    },
  });
}
