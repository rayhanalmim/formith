/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '@/lib/api';
import { socketClient } from '@/lib/socket';
import { useAuth } from '@/contexts/AuthContext';

export interface DMReaction {
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

export interface DMReactionSummary {
  emoji: string;
  count: number;
  hasReacted: boolean;
  users: string[];
}

export function useDMReactions(messageId: string) {
  return useQuery({
    queryKey: ['dm-reactions', messageId],
    queryFn: async (): Promise<DMReaction[]> => {
      const response = await api.getDMReactions(messageId);
      return response.data || [];
    },
    enabled: !!messageId,
  });
}

export function useConversationReactions(conversationId: string | null) {
  const queryClient = useQueryClient();

  // Subscribe to socket events for DM reactions
  useEffect(() => {
    if (!conversationId) return;

    const unsubReaction = socketClient.onDMReaction((event) => {
      if (event.conversationId !== conversationId) return;

      if (!event.reaction) {
        queryClient.invalidateQueries({ queryKey: ['dm-reactions', event.messageId] });
        return;
      }

      queryClient.setQueryData<DMReaction[]>(['dm-reactions', event.messageId], (old) => {
        const prev = old || [];

        if (event.type === 'remove') {
          const removeId = typeof (event.reaction as { id?: unknown } | undefined)?.id === 'string'
            ? (event.reaction as { id: string }).id
            : undefined;
          if (!removeId) return prev;
          return prev.filter(r => r.id !== removeId);
        }

        if (event.type === 'add') {
          const reaction = event.reaction as DMReaction;
          const withoutSameUser = prev.filter(r => r.user_id !== reaction.user_id);
          const withoutTempSameUser = withoutSameUser.filter(r => !(r.user_id === reaction.user_id && r.id.startsWith('temp-')));
          const withoutSameId = withoutTempSameUser.filter(r => r.id !== reaction.id);
          return [...withoutSameId, reaction];
        }

        return prev;
      });
    });

    return () => {
      unsubReaction();
    };
  }, [conversationId, queryClient]);

  return { conversationId };
}

export function useAddDMReaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      if (!user) throw new Error('Must be logged in');
      await api.addDMReaction(messageId, user.id, emoji);
      return null;
    },
    onMutate: async ({ messageId, emoji }) => {
      if (!user) return;
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['dm-reactions', messageId] });
      
      // Snapshot previous value
      const previousReactions = queryClient.getQueryData<DMReaction[]>(['dm-reactions', messageId]);

      const existingUserReaction = previousReactions?.find(r => r.user_id === user.id);
      if (existingUserReaction?.emoji === emoji) {
        return { previousReactions };
      }
      
      // Optimistically add reaction
      const newReaction: DMReaction = {
        id: `temp-${Date.now()}`,
        message_id: messageId,
        user_id: user.id,
        emoji,
        created_at: new Date().toISOString(),
        profile: {
          username: null,
          display_name: null,
        },
      };
      
      queryClient.setQueryData<DMReaction[]>(
        ['dm-reactions', messageId],
        (old) => {
          const prev = old || [];
          const withoutCurrentUser = prev.filter(r => r.user_id !== user.id);
          return [...withoutCurrentUser, newReaction];
        }
      );
      
      return { previousReactions };
    },
    onError: (_, { messageId }, context) => {
      // Rollback on error
      if (context?.previousReactions) {
        queryClient.setQueryData(['dm-reactions', messageId], context.previousReactions);
      }
    },
    onSettled: (_, __, { messageId }) => {
      queryClient.invalidateQueries({ queryKey: ['dm-reactions', messageId] });
    },
  });
}

export function useRemoveDMReaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      if (!user) throw new Error('Must be logged in');
      await api.removeDMReaction(messageId, user.id, emoji);
    },
    onMutate: async ({ messageId, emoji }) => {
      if (!user) return;
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['dm-reactions', messageId] });
      
      // Snapshot previous value
      const previousReactions = queryClient.getQueryData<DMReaction[]>(['dm-reactions', messageId]);
      
      // Optimistically remove reaction
      queryClient.setQueryData<DMReaction[]>(
        ['dm-reactions', messageId],
        (old) => old?.filter(r => !(r.user_id === user.id && r.emoji === emoji)) || []
      );
      
      return { previousReactions };
    },
    onError: (_, { messageId }, context) => {
      // Rollback on error
      if (context?.previousReactions) {
        queryClient.setQueryData(['dm-reactions', messageId], context.previousReactions);
      }
    },
    onSettled: (_, __, { messageId }) => {
      queryClient.invalidateQueries({ queryKey: ['dm-reactions', messageId] });
    },
  });
}

export function useToggleDMReaction() {
  const addReaction = useAddDMReaction();
  const removeReaction = useRemoveDMReaction();

  return useMutation({
    mutationFn: async ({ messageId, emoji, hasReacted }: { 
      messageId: string; 
      emoji: string;
      hasReacted: boolean;
    }) => {
      if (hasReacted) {
        await removeReaction.mutateAsync({ messageId, emoji });
      } else {
        await addReaction.mutateAsync({ messageId, emoji });
      }
    },
  });
}

export function getDMReactionSummary(
  reactions: DMReaction[], 
  currentUserId?: string
): DMReactionSummary[] {
  const summary: Record<string, DMReactionSummary> = {};

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
