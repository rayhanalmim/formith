import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useDeleteRoom() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: async (roomId: string) => {
      await api.deleteRoom(roomId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success(language === 'ar' ? 'تم حذف الغرفة' : 'Room deleted');
    },
    onError: (error) => {
      console.error('Failed to delete room:', error);
      toast.error(language === 'ar' ? 'فشل حذف الغرفة' : 'Failed to delete room');
    },
  });
}

export function useMuteMember() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      memberId, 
      roomId, 
      mute, 
      duration,
      targetUserId
    }: { 
      memberId: string; 
      roomId: string; 
      mute: boolean; 
      duration: number;
      targetUserId?: string;
    }) => {
      const response = await api.muteMember(memberId, mute, duration, user?.id || null, roomId, targetUserId);
      if (!response.success) throw new Error('Failed to mute member');
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['room-members', data?.roomId] });
      queryClient.invalidateQueries({ queryKey: ['room-activity-logs'] });
      toast.success(language === 'ar' ? 'تم تحديث حالة الكتم' : 'Mute status updated');
    },
    onError: (error) => {
      console.error('Failed to mute member:', error);
      toast.error(language === 'ar' ? 'فشل تحديث حالة الكتم' : 'Failed to update mute status');
    },
  });
}

export function useSetMemberRole() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      memberId, 
      roomId, 
      role,
      targetUserId
    }: { 
      memberId: string; 
      roomId: string; 
      role: string;
      targetUserId?: string;
    }) => {
      const response = await api.setMemberRole(memberId, role, roomId, user?.id || '', targetUserId);
      if (!response.success) throw new Error('Failed to set member role');
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['room-members', data?.roomId] });
      queryClient.invalidateQueries({ queryKey: ['room-activity-logs'] });
      toast.success(language === 'ar' ? 'تم تحديث الدور' : 'Role updated');
    },
    onError: (error) => {
      console.error('Failed to set member role:', error);
      toast.error(language === 'ar' ? 'فشل تحديث الدور' : 'Failed to update role');
    },
  });
}
