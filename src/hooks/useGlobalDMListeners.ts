import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socketClient } from '@/lib/socket';
import { useAuth } from '@/contexts/AuthContext';
import { Conversation, DirectMessage } from './useMessages';

let listenersRegistered = false;

/**
 * Global singleton hook that registers DM socket listeners once per app
 * This prevents duplicate listener registrations when multiple components use useConversations
 */
export function useGlobalDMListeners() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user || listenersRegistered) return;

    console.log('[GlobalDMListeners] Registering global DM listeners');
    listenersRegistered = true;

    // Listen for new messages - updates conversation list and unread count
    const unsubMessage = socketClient.onDMMessage((event) => {
      if (event.type === 'insert' && event.message) {
        // Optimistically update the conversation list
        queryClient.setQueryData<Conversation[]>(['conversations', user.id], (old) => {
          if (!old) return old;
          
          const conversationId = event.conversationId;
          const updatedConversations = old.map(conv => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                last_message: {
                  content: event.message.content,
                  created_at: event.message.created_at,
                  sender_id: event.message.sender_id,
                  is_read: event.message.is_read,
                },
                last_message_at: event.message.created_at,
                updated_at: event.message.created_at,
                // Increment unread count if message is from another user
                unread_count: event.message.sender_id !== user.id 
                  ? conv.unread_count + 1 
                  : conv.unread_count,
              };
            }
            return conv;
          });
          
          // Sort conversations: pinned first, then by last message time
          return updatedConversations.sort((a, b) => {
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
        
        // Optimistically update unread count if message is from another user
        if (event.message.sender_id !== user.id) {
          queryClient.setQueryData<number>(['unread-message-count', user.id], (old) => {
            return (old || 0) + 1;
          });
        }
      }
    });

    // Listen for new conversations
    const unsubNewConv = socketClient.onNewConversation((event) => {
      socketClient.subscribeToDM(event.conversationId);
      queryClient.refetchQueries({ queryKey: ['conversations'] });
    });

    // Global listener for read receipts
    const unsubRead = socketClient.onDMRead((event) => {
      // Only process if the reader is NOT the current user (someone else read our messages)
      if (event.userId === user.id) return;
      
      // Update messages in the specific conversation cache
      queryClient.setQueryData<DirectMessage[]>(
        ['messages', event.conversationId],
        (old) => {
          if (!old) return old;
          return old.map(m => {
            // Mark messages as read if sent by current user
            if (m.sender_id === user.id) {
              return { ...m, is_read: true, read_at: event.readAt };
            }
            return m;
          });
        }
      );
      
      // Update conversation last message read status
      queryClient.setQueryData<Conversation[]>(['conversations', user.id], (old) => {
        if (!old) return old;
        return old.map(conv => {
          if (conv.id === event.conversationId && conv.last_message?.sender_id === user.id) {
            return {
              ...conv,
              last_message: {
                ...conv.last_message,
                is_read: true,
              },
            };
          }
          return conv;
        });
      });
    });

    return () => {
      console.log('[GlobalDMListeners] Cleaning up global DM listeners');
      listenersRegistered = false;
      unsubMessage();
      unsubNewConv();
      unsubRead();
    };
  }, [user, queryClient]);
}
