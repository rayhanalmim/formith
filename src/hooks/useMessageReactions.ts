import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { socketClient } from '@/lib/socket';
import { useAuth } from '@/contexts/AuthContext';

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  profile?: {
    username: string | null;
    display_name: string | null;
  };
}

export interface ReactionSummary {
  emoji: string;
  count: number;
  hasReacted: boolean;
  users: string[];
}

export function useMessageReactions(messageId: string) {
  return useQuery({
    queryKey: ['message-reactions', messageId],
    queryFn: async (): Promise<MessageReaction[]> => {
      const response = await api.getMessageReactions(messageId);
      return response.data || [];
    },
    enabled: !!messageId,
  });
}

export function useRoomReactions(roomId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!roomId) return;

    // Listen for reaction events via Socket.io (already subscribed to room via useRealtimeRoomMessages)
    const unsubscribe = socketClient.onRoomReaction((data) => {
      console.log('[Reactions] Received room:reaction event:', data);
      // The socket room filter ensures we only get events for this room
      if (data.messageId) {
        // Refetch reactions for the affected message
        queryClient.invalidateQueries({ queryKey: ['message-reactions', data.messageId] });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [roomId, queryClient]);
}

export function useAddReaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ messageId, emoji, roomId }: { messageId: string; emoji: string; roomId?: string }) => {
      if (!user) throw new Error('Must be logged in');
      console.log('[Reactions] Adding reaction:', { messageId, emoji, userId: user.id, roomId });
      const response = await api.addMessageReaction(messageId, user.id, emoji, roomId);
      console.log('[Reactions] Add response:', response);
      return response.data;
    },
    onSuccess: (_, { messageId }) => {
      queryClient.invalidateQueries({ queryKey: ['message-reactions', messageId] });
    },
    onError: (error) => {
      console.error('[Reactions] Failed to add reaction:', error);
    },
  });
}

export function useRemoveReaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ messageId, emoji, roomId }: { messageId: string; emoji: string; roomId?: string }) => {
      if (!user) throw new Error('Must be logged in');
      await api.removeMessageReaction(messageId, user.id, emoji, roomId);
    },
    onSuccess: (_, { messageId }) => {
      queryClient.invalidateQueries({ queryKey: ['message-reactions', messageId] });
    },
  });
}

export function useToggleReaction() {
  const addReaction = useAddReaction();
  const removeReaction = useRemoveReaction();

  return useMutation({
    mutationFn: async ({ messageId, emoji, hasReacted, roomId }: { 
      messageId: string; 
      emoji: string;
      hasReacted: boolean;
      roomId?: string;
    }) => {
      if (hasReacted) {
        await removeReaction.mutateAsync({ messageId, emoji, roomId });
      } else {
        await addReaction.mutateAsync({ messageId, emoji, roomId });
      }
    },
  });
}

export function getReactionSummary(
  reactions: MessageReaction[], 
  currentUserId?: string
): ReactionSummary[] {
  const summary: Record<string, ReactionSummary> = {};

  reactions.forEach((reaction) => {
    if (!summary[reaction.emoji]) {
      summary[reaction.emoji] = {
        emoji: reaction.emoji,
        count: 0,
        hasReacted: false,
        users: [],
      };
    }
    summary[reaction.emoji].count++;
    summary[reaction.emoji].users.push(
      reaction.profile?.display_name || reaction.profile?.username || 'User'
    );
    if (reaction.user_id === currentUserId) {
      summary[reaction.emoji].hasReacted = true;
    }
  });

  return Object.values(summary).sort((a, b) => b.count - a.count);
}
