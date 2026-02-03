/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { socketClient } from '@/lib/socket';
import type { RoomMessage } from './useRooms';

export function usePinnedMessages(roomId: string) {
  return useQuery({
    queryKey: ['pinned-messages', roomId],
    queryFn: async (): Promise<RoomMessage[]> => {
      const response = await api.getPinnedMessages(roomId);
      return (response.data || []) as RoomMessage[];
    },
    enabled: !!roomId,
  });
}

export function useRealtimePinnedMessages(roomId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!roomId) return;

    // Subscribe to room messages via Socket.io
    socketClient.subscribeToRoom(roomId);

    // Listen for room message events (which include pin/unpin updates)
    const unsubscribe = socketClient.onRoomMessage((message: any) => {
      // Refresh pinned messages when any message in the room is updated
      queryClient.invalidateQueries({ queryKey: ['pinned-messages', roomId] });
      queryClient.invalidateQueries({ queryKey: ['room-messages', roomId] });
    });

    return () => {
      unsubscribe();
    };
  }, [roomId, queryClient]);
}

export function usePinMessage() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ messageId, roomId, messageAuthorId }: { messageId: string; roomId: string; messageAuthorId?: string }) => {
      if (!user) throw new Error('Not authenticated');
      await api.pinMessage(messageId, user.id, roomId, messageAuthorId);
      return { roomId };
    },
    onSuccess: ({ roomId }) => {
      queryClient.invalidateQueries({ queryKey: ['pinned-messages', roomId] });
      queryClient.invalidateQueries({ queryKey: ['room-messages', roomId] });
      queryClient.invalidateQueries({ queryKey: ['room-activity-logs'] });
      toast.success(language === 'ar' ? 'تم تثبيت الرسالة' : 'Message pinned');
    },
    onError: (error) => {
      console.error('Failed to pin message:', error);
      toast.error(language === 'ar' ? 'فشل تثبيت الرسالة' : 'Failed to pin message');
    },
  });
}

export function useUnpinMessage() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ messageId, roomId, messageAuthorId }: { messageId: string; roomId: string; messageAuthorId?: string }) => {
      if (!user) throw new Error('Not authenticated');
      await api.unpinMessage(messageId, user.id, roomId, messageAuthorId);
      return { roomId };
    },
    onSuccess: ({ roomId }) => {
      queryClient.invalidateQueries({ queryKey: ['pinned-messages', roomId] });
      queryClient.invalidateQueries({ queryKey: ['room-messages', roomId] });
      queryClient.invalidateQueries({ queryKey: ['room-activity-logs'] });
      toast.success(language === 'ar' ? 'تم إلغاء تثبيت الرسالة' : 'Message unpinned');
    },
    onError: (error) => {
      console.error('Failed to unpin message:', error);
      toast.error(language === 'ar' ? 'فشل إلغاء تثبيت الرسالة' : 'Failed to unpin message');
    },
  });
}
