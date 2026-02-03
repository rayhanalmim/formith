/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export interface RoomInvite {
  id: string;
  room_id: string;
  invited_user_id: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  responded_at: string | null;
  room?: {
    id: string;
    name: string;
    name_ar: string | null;
    description: string | null;
    is_public: boolean;
  };
  inviter?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function useMyRoomInvites() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['room-invites', 'my', user?.id],
    queryFn: async (): Promise<RoomInvite[]> => {
      if (!user) return [];

      const response = await api.getMyRoomInvites(user.id);
      return (response.data || []) as RoomInvite[];
    },
    enabled: !!user,
  });
}

export function useRoomInvites(roomId: string) {
  return useQuery({
    queryKey: ['room-invites', roomId],
    queryFn: async (): Promise<RoomInvite[]> => {
      const response = await api.getRoomInvites(roomId);
      return (response.data || []) as unknown as RoomInvite[];
    },
    enabled: !!roomId,
  });
}

export function useSendRoomInvite() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ roomId, userId }: { roomId: string; userId: string }) => {
      if (!user) throw new Error('Not authenticated');

      const response = await api.sendRoomInvite(roomId, userId, user.id);
      if (!response.success) {
        const error = response as any;
        if (error.code === '23505') {
          throw { code: '23505' };
        }
        throw new Error('Failed to send invitation');
      }
    },
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: ['room-invites', roomId] });
      toast.success(language === 'ar' ? 'تم إرسال الدعوة' : 'Invitation sent');
    },
    onError: (error: any) => {
      console.error('Failed to send invite:', error);
      if (error.code === '23505') {
        toast.error(language === 'ar' ? 'تم إرسال دعوة مسبقاً' : 'Invitation already sent');
      } else {
        toast.error(language === 'ar' ? 'فشل إرسال الدعوة' : 'Failed to send invitation');
      }
    },
  });
}

export function useRespondToInvite() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ inviteId, accept }: { inviteId: string; accept: boolean }) => {
      if (!user) throw new Error('Not authenticated');

      const response = await api.respondToRoomInvite(inviteId, user.id, accept);
      if (!response.success) {
        throw new Error('Failed to respond to invitation');
      }
      return response.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['room-invites'] });
      if (result?.roomId) {
        queryClient.invalidateQueries({ queryKey: ['room-members', result.roomId] });
        queryClient.invalidateQueries({ queryKey: ['room-membership', result.roomId] });
      }
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success(
        result?.accepted
          ? (language === 'ar' ? 'تم قبول الدعوة' : 'Invitation accepted')
          : (language === 'ar' ? 'تم رفض الدعوة' : 'Invitation declined')
      );
    },
    onError: (error) => {
      console.error('Failed to respond to invite:', error);
      toast.error(language === 'ar' ? 'فشل الرد على الدعوة' : 'Failed to respond to invitation');
    },
  });
}

export function useCancelInvite() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      const response = await api.cancelRoomInvite(inviteId);
      if (!response.success) {
        throw new Error('Failed to cancel invitation');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-invites'] });
      toast.success(language === 'ar' ? 'تم إلغاء الدعوة' : 'Invitation cancelled');
    },
    onError: (error) => {
      console.error('Failed to cancel invite:', error);
      toast.error(language === 'ar' ? 'فشل إلغاء الدعوة' : 'Failed to cancel invitation');
    },
  });
}
