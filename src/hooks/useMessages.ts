/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { api } from '@/lib/api';
import { socketClient } from '@/lib/socket';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { deleteFromSpaces } from './useDeleteFromSpaces';

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  is_pinned: boolean;
  pinned_at: string | null;
  other_user: {
    user_id: string;
    username: string | null;
    display_name: string | null;
    display_name_ar: string | null;
    avatar_url: string | null;
    is_verified: boolean | null;
  };
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
    is_read: boolean;
  };
  unread_count: number;
}

export interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  media_url?: string | null;
  media_type?: string | null;
  is_deleted?: boolean | null;
  edited_at?: string | null;
  link_previews?: string | null;
  // Reply fields
  reply_to_id?: string | null;
  reply_content?: string | null;
  reply_sender_id?: string | null;
  reply_sender_username?: string | null;
  reply_sender_display_name?: string | null;
  // Sender profile information
  sender_username?: string | null;
  sender_display_name?: string | null;
  sender_avatar_url?: string | null;
}

export function useConversations() {
  const { user } = useAuth();
  const { playMessageSound } = useNotificationSound();
  const hasPlayedInitialRef = useRef(false);

  const query = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async (): Promise<Conversation[]> => {
      if (!user) return [];
      const response = await api.getConversations(user.id);
      return response.data || [];
    },
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
  });

  // Mark initial load complete after first successful fetch
  useEffect(() => {
    if (query.data && !hasPlayedInitialRef.current) {
      hasPlayedInitialRef.current = true;
      // Subscribe to all DM rooms on initial load
      const conversationIds = query.data.map(c => c.id);
      if (conversationIds.length > 0) {
        socketClient.subscribeToAllDMs(conversationIds);
      }
    }
  }, [query.data]);

  // Play sound for incoming messages (global listeners handle data updates)
  useEffect(() => {
    if (!user) return;

    const unsubMessage = socketClient.onDMMessage((event) => {
      if (event.type === 'insert' && event.message?.sender_id !== user.id && hasPlayedInitialRef.current) {
        playMessageSound();
      }
    });

    return () => {
      unsubMessage();
    };
  }, [user, playMessageSound]);

  return query;
}

export function useConversationMessages(conversationId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { playMessageSound } = useNotificationSound();
  const hasPlayedInitialRef = useRef(false);
  const [allMessages, setAllMessages] = useState<DirectMessage[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const query = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async (): Promise<DirectMessage[]> => {
      if (!conversationId || !user) return [];
      const response = await api.getConversationMessages(conversationId, user.id, 12);
      const messages = response.data || [];
      setHasMore(messages.length === 12);
      return messages;
    },
    enabled: !!conversationId && !!user,
  });

  // Sync allMessages with query data
  useEffect(() => {
    if (query.data) {
      setAllMessages(query.data);
    }
  }, [query.data]);

  const loadMore = async () => {
    if (!conversationId || !user || isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    try {
      const oldestMessage = allMessages[0];
      if (!oldestMessage) return;
      
      const response = await api.getConversationMessages(conversationId, user.id, 12, oldestMessage.id);
      const olderMessages = response.data || [];
      
      if (olderMessages.length < 12) {
        setHasMore(false);
      }
      
      const newMessages = [...olderMessages, ...allMessages];
      setAllMessages(newMessages);
      queryClient.setQueryData(['messages', conversationId], newMessages);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Reset sound flag when conversation changes
  useEffect(() => {
    hasPlayedInitialRef.current = false;
  }, [conversationId]);

  // Subscribe to Socket.io for this conversation
  useEffect(() => {
    if (!conversationId || !user) return;

    // Subscribe to this DM room (if not already subscribed)
    socketClient.subscribeToDM(conversationId);

    // Listen for DM events
    const unsubMessage = socketClient.onDMMessage((event) => {
      if (event.conversationId !== conversationId) return;

      if (event.type === 'insert' && event.message) {
        // Only add messages from other users - our own messages are added optimistically
        if (event.message.sender_id !== user.id) {
          queryClient.setQueryData<DirectMessage[]>(
            ['messages', conversationId],
            (old) => {
              if (old?.some(m => m.id === event.message.id)) return old;
              const updated = [...(old || []), event.message];
              setAllMessages(updated);
              return updated;
            }
          );
          
          if (hasPlayedInitialRef.current) {
            playMessageSound();
          }
          
          // Immediately mark as read since user is viewing this conversation
          // This triggers dm:read socket event back to the sender for real-time read receipts
          api.markMessagesAsRead(conversationId, user.id).then(() => {
            // Update conversation unread count to 0
            queryClient.setQueryData<Conversation[]>(['conversations', user.id], (old) => {
              if (!old) return old;
              return old.map(conv => 
                conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
              );
            });
            
            // Recalculate total unread count
            queryClient.invalidateQueries({ queryKey: ['unread-message-count', user.id] });
          }).catch(console.error);
        }
        hasPlayedInitialRef.current = true;
      } else if (event.type === 'update' && event.message) {
        queryClient.setQueryData<DirectMessage[]>(
          ['messages', conversationId],
          (old) => {
            if (!old) return [];
            let updated;
            if (event.message.is_deleted) {
              updated = old.filter(m => m.id !== event.message.id);
            } else {
              updated = old.map(m => m.id === event.message.id ? { ...m, ...event.message } : m);
            }
            setAllMessages(updated);
            return updated;
          }
        );
      } else if (event.type === 'delete' && event.messageId) {
        queryClient.setQueryData<DirectMessage[]>(
          ['messages', conversationId],
          (old) => {
            const updated = old?.filter(m => m.id !== event.messageId) || [];
            setAllMessages(updated);
            return updated;
          }
        );
      } else if (event.type === 'bulk-delete' && event.messageIds) {
        const idsToDelete = new Set(event.messageIds);
        queryClient.setQueryData<DirectMessage[]>(
          ['messages', conversationId],
          (old) => {
            const updated = old?.filter(m => !idsToDelete.has(m.id)) || [];
            setAllMessages(updated);
            return updated;
          }
        );
      }
    });

    // Listen for read status updates (from conversation room)
    const unsubRead = socketClient.onDMRead((event) => {
      if (event.conversationId !== conversationId) return;
      // Update all messages that were sent by the current user (not by the reader)
      queryClient.setQueryData<DirectMessage[]>(
        ['messages', conversationId],
        (old) => {
          const updated = old?.map(m => {
            if (m.sender_id !== event.userId) {
              return { ...m, is_read: true, read_at: event.readAt };
            }
            return m;
          }) || [];
          setAllMessages(updated);
          return updated;
        }
      );
    });

    hasPlayedInitialRef.current = true;

    return () => {
      // Don't unsubscribe from DM room - stay subscribed for conversation list updates
      // socketClient.unsubscribeFromDM(conversationId);
      unsubMessage();
      unsubRead();
    };
  }, [conversationId, user, queryClient, playMessageSound]);

  return { 
    ...query, 
    data: allMessages,
    loadMore, 
    hasMore, 
    isLoadingMore 
  };
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      conversationId, 
      content,
      mediaUrl,
      mediaType,
      replyToId,
      replyContent,
      replySenderId,
      replySenderUsername,
      replySenderDisplayName,
      isEncrypted,
      optimisticId,
      linkPreviews,
    }: { 
      conversationId: string; 
      content: string;
      mediaUrl?: string;
      mediaType?: string;
      replyToId?: string;
      replyContent?: string;
      replySenderId?: string;
      replySenderUsername?: string;
      replySenderDisplayName?: string;
      isEncrypted?: boolean;
      optimisticId?: string;
      linkPreviews?: any[];
    }) => {
      if (!user) throw new Error('Not authenticated');

      const response = await api.sendMessage({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
        media_url: mediaUrl,
        media_type: isEncrypted ? `encrypted_${mediaType || 'file'}` : mediaType,
        reply_to_id: replyToId,
        reply_content: replyContent,
        reply_sender_id: replySenderId,
        reply_sender_username: replySenderUsername,
        reply_sender_display_name: replySenderDisplayName,
        link_previews: linkPreviews,
      });

      return response.data;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['messages', variables.conversationId] });
      
      const previousMessages = queryClient.getQueryData<DirectMessage[]>(['messages', variables.conversationId]);
      
      const tempId = variables.optimisticId || `temp-${Date.now()}`;
      const optimisticMessage: DirectMessage = {
        id: tempId,
        conversation_id: variables.conversationId,
        sender_id: user!.id,
        content: variables.content,
        is_read: false,
        created_at: new Date().toISOString(),
        read_at: null,
        media_url: variables.mediaUrl || null,
        media_type: variables.mediaType || null,
        is_deleted: false,
        link_previews: variables.linkPreviews ? JSON.stringify(variables.linkPreviews) : null,
        reply_to_id: variables.replyToId || null,
        reply_content: variables.replyContent || null,
        reply_sender_id: variables.replySenderId || null,
        reply_sender_username: variables.replySenderUsername || null,
        reply_sender_display_name: variables.replySenderDisplayName || null,
        edited_at: null,
      };
      
      queryClient.setQueryData<DirectMessage[]>(
        ['messages', variables.conversationId],
        (old) => {
          const list = old || [];
          if (list.some(m => m.id === tempId)) return list;
          return [...list, optimisticMessage];
        }
      );
      
      return { previousMessages, optimisticId: tempId };
    },
    onSuccess: (data, variables, context) => {
      // Replace optimistic message with real message from server
      queryClient.setQueryData<DirectMessage[]>(
        ['messages', variables.conversationId],
        (old) => {
          if (!old) return [data];
          // Find the optimistic message to preserve link_previews if server didn't return it
          const optimisticMsg = old.find(msg => msg.id === context?.optimisticId);
          const mergedData = {
            ...data,
            // Preserve link_previews from optimistic message if server response doesn't have it
            link_previews: data.link_previews || optimisticMsg?.link_previews || null,
          };
          // Remove the optimistic message and add the real one
          return old.filter(msg => msg.id !== context?.optimisticId).concat(mergedData);
        }
      );
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error, variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', variables.conversationId], context.previousMessages);
      }
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
      if (!user) throw new Error('Not authenticated');

      await api.deleteMessage(messageId, user.id);
      return { messageId, conversationId };
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['messages', variables.conversationId] });
      const previousMessages = queryClient.getQueryData<DirectMessage[]>(['messages', variables.conversationId]);
      queryClient.setQueryData<DirectMessage[]>(
        ['messages', variables.conversationId],
        (old) => old?.filter(m => m.id !== variables.messageId) || []
      );
      return { previousMessages };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error, variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', variables.conversationId], context.previousMessages);
      }
    },
  });
}

export function usePinConversation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, isPinned }: { conversationId: string; isPinned: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      await api.pinConversation(conversationId, user.id, isPinned);
      return { conversationId, isPinned };
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['conversations'] });
      const previousConversations = queryClient.getQueryData<Conversation[]>(['conversations', user?.id]);
      queryClient.setQueryData<Conversation[]>(['conversations', user?.id], (old) => {
        if (!old) return old;
        const updated = old.map(conv =>
          conv.id === variables.conversationId
            ? { ...conv, is_pinned: variables.isPinned, pinned_at: variables.isPinned ? new Date().toISOString() : null }
            : conv
        );
        return updated.sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          if (a.is_pinned && b.is_pinned) {
            const aPinTime = a.pinned_at ? new Date(a.pinned_at).getTime() : 0;
            const bPinTime = b.pinned_at ? new Date(b.pinned_at).getTime() : 0;
            return bPinTime - aPinTime;
          }
          const aTime = a.last_message?.created_at || a.last_message_at || a.created_at;
          const bTime = b.last_message?.created_at || b.last_message_at || b.created_at;
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        });
      });
      return { previousConversations };
    },
    onError: (err, variables, context) => {
      if (context?.previousConversations) {
        queryClient.setQueryData(['conversations', user?.id], context.previousConversations);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useStartConversation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (otherUserId: string): Promise<string> => {
      if (!user) throw new Error('Not authenticated');

      const response = await api.startConversation(user.id, otherUserId);
      return response.data?.conversationId || '';
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMarkMessagesAsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (!user) throw new Error('Not authenticated');

      const response = await api.markMessagesAsRead(conversationId, user.id);
      return { count: response.data?.count || 0 };
    },
    onMutate: async (conversationId) => {
      console.log('[useMarkMessagesAsRead] onMutate called for conversation:', conversationId);
      // Cancel all related queries first
      await queryClient.cancelQueries({ queryKey: ['conversations'] });
      await queryClient.cancelQueries({ queryKey: ['unread-message-count'] });

      // Snapshot previous values for potential rollback
      const previousConversations = queryClient.getQueryData<Conversation[]>(['conversations']);
      const previousCount = queryClient.getQueryData<number>(['unread-message-count', user?.id]);

      // Get the conversation's unread count before we update
      const unreadToSubtract = previousConversations?.find(c => c.id === conversationId)?.unread_count || 0;
      
      // Optimistically set unread_count to 0 in ALL conversation query keys
      queryClient.setQueriesData<Conversation[]>({ queryKey: ['conversations'] }, (old) => {
        if (!old) return old;
        return old.map(conv => 
          conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
        );
      });
      
      // Optimistically update the specific unread-message-count query
      if (user?.id) {
        queryClient.setQueryData<number>(['unread-message-count', user.id], (old) => {
          return Math.max(0, (old || 0) - unreadToSubtract);
        });
      }
      
      return { previousConversations, previousCount, unreadToSubtract };
    },
    onError: (err, conversationId, context) => {
      console.error('[useMarkMessagesAsRead] onError called:', { err, conversationId });
      // Rollback on error
      if (context?.previousConversations) {
        queryClient.setQueriesData<Conversation[]>({ queryKey: ['conversations'] }, () => context.previousConversations);
      }
      // Restore unread count
      if (user?.id && context?.previousCount !== undefined) {
        queryClient.setQueryData<number>(['unread-message-count', user.id], context.previousCount);
      }
    },
    onSuccess: (data, conversationId) => {
      console.log('[useMarkMessagesAsRead] onSuccess called:', { data, conversationId });
      // Force refetch to ensure accuracy after success
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['unread-message-count'] });

      // Force immediate refetch of unread count
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['unread-message-count'] });
      }, 100);
    },
  });
}

export function useUnreadMessageCount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['unread-message-count', user?.id],
    queryFn: async (): Promise<number> => {
      if (!user) return 0;
      const response = await api.getUnreadMessageCount(user.id);
      return response.data?.count || 0;
    },
    enabled: !!user,
    staleTime: 30000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    // No polling - using socket instead
  });

  // Subscribe to Socket.io for realtime unread count updates
  useEffect(() => {
    if (!user) return;

    // Listen for direct unread count updates from server
    const unsubUnreadCount = socketClient.onUnreadCountUpdate((event) => {
      if (event.userId === user.id) {
        queryClient.setQueryData(['unread-message-count', user.id], event.count);
      }
    });

    return () => {
      unsubUnreadCount();
    };
  }, [user, queryClient]);

  return query;
}


export function useDeleteConversation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (!user) throw new Error('Not authenticated');

      await api.deleteConversation(conversationId, user.id);
      return conversationId;
    },
    // Optimistic update - immediately remove conversation from list
    onMutate: async (conversationId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['conversations'] });
      await queryClient.cancelQueries({ queryKey: ['messages', conversationId] });
      
      // Snapshot previous values
      const previousConversations = queryClient.getQueryData<Conversation[]>(['conversations', user?.id]);
      const previousMessages = queryClient.getQueryData<DirectMessage[]>(['messages', conversationId]);
      
      // Optimistically remove the conversation from the list
      queryClient.setQueryData<Conversation[]>(
        ['conversations', user?.id],
        (old) => old?.filter(c => c.id !== conversationId) || []
      );
      
      // Clear messages for this conversation
      queryClient.setQueryData<DirectMessage[]>(
        ['messages', conversationId],
        []
      );
      
      return { previousConversations, previousMessages, conversationId };
    },
    onError: (error, conversationId, context) => {
      console.error('[useDeleteConversation] Deletion failed:', { error, conversationId });
      // Rollback on error
      if (context?.previousConversations) {
        queryClient.setQueryData(['conversations', user?.id], context.previousConversations);
      }
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', conversationId], context.previousMessages);
      }
    },
    onSuccess: (conversationId) => {
      console.log('[useDeleteConversation] Successfully hidden conversation:', conversationId);
      // Force refetch to ensure accuracy
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['unread-message-count'] });
      // Remove the messages query entirely
      queryClient.removeQueries({ queryKey: ['messages', conversationId] });
    },
  });
}

export function useBulkDeleteMessages() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ messageIds, conversationId }: { messageIds: string[]; conversationId: string }) => {
      if (!user) throw new Error('Not authenticated');

      const response = await api.bulkDeleteMessages(messageIds, conversationId, user.id);
      
      // Delete media from DigitalOcean Spaces (fire and forget)
      if (response.data?.mediaUrls && response.data.mediaUrls.length > 0) {
        deleteFromSpaces(response.data.mediaUrls).catch(err => {
          console.error('[useBulkDeleteMessages] Storage cleanup failed:', err);
        });
      }

      return { messageIds, conversationId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// Hide message for current user only (delete for me)
export function useHideMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
      if (!user) throw new Error('Not authenticated');

      await api.hideMessageForUser(messageId, user.id);
      return { messageId, conversationId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
    },
  });
}

// Edit a message (within 15 minutes)
export function useEditMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      messageId, 
      newContent, 
      conversationId 
    }: { 
      messageId: string; 
      newContent: string; 
      conversationId: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      await api.editMessage(messageId, user.id, newContent);
      return { messageId, conversationId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
    },
  });
}

// Check if a message can still be edited (within 15 minutes)
export function canEditMessage(createdAt: string): boolean {
  const messageTime = new Date(createdAt).getTime();
  const now = Date.now();
  const fifteenMinutes = 15 * 60 * 1000; // 15 minutes in milliseconds
  return (now - messageTime) < fifteenMinutes;
}
