import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { socketClient } from '@/lib/socket';
import { useAuth } from '@/contexts/AuthContext';

export interface MessageRead {
  id: string;
  message_id: string;
  user_id: string;
  read_at: string;
  profile?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function useMessageReads(messageId: string) {
  return useQuery({
    queryKey: ['message-reads', messageId],
    queryFn: async (): Promise<MessageRead[]> => {
      const response = await api.getMessageReads(messageId);
      return response.data || [];
    },
    enabled: !!messageId,
  });
}

export function useRoomReadReceipts(roomId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!roomId) return;

    // Listen for read receipt events via Socket.io (room subscription handled by useRealtimeRoomMessages)
    const unsubscribe = socketClient.onRoomReaction((data) => {
      // Invalidate read receipts when reactions change (piggyback on same channel)
      if (data.messageId) {
        queryClient.invalidateQueries({ queryKey: ['message-reads', data.messageId] });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [roomId, queryClient]);
}

export function useMarkMessageAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (messageId: string) => {
      if (!user) return;
      await api.markMessageAsRead(messageId, user.id);
    },
    onSuccess: (_, messageId) => {
      queryClient.invalidateQueries({ queryKey: ['message-reads', messageId] });
    },
  });
}

export function useMarkRoomMessagesAsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, messageIds }: { roomId: string; messageIds: string[] }) => {
      if (!user || messageIds.length === 0) return;
      await api.markRoomMessagesAsRead(roomId, user.id, messageIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-reads'] });
    },
  });
}
