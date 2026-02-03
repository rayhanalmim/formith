import { useState, useEffect, useRef, useCallback } from 'react';
import { socketClient } from '@/lib/socket';
import { useAuth } from '@/contexts/AuthContext';

interface TypingInfo {
  username: string;
  typing_at: number;
}

// Track typing indicators across multiple conversations using Socket.io
export function useConversationTypingIndicators(conversationIds: string[]) {
  const { user } = useAuth();
  const [typingByConversation, setTypingByConversation] = useState<Record<string, TypingInfo | null>>({});
  const subscribedIdsRef = useRef<Set<string>>(new Set());

  // Clean up stale typing indicators (older than 3 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingByConversation(prev => {
        const updated = { ...prev };
        let changed = false;
        
        Object.entries(updated).forEach(([convId, info]) => {
          if (info && now - info.typing_at > 3000) {
            updated[convId] = null;
            changed = true;
          }
        });
        
        return changed ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Subscribe to typing events via Socket.io
  useEffect(() => {
    if (!user || conversationIds.length === 0) return;

    // Copy ref for cleanup
    const currentSubscribedIds = subscribedIdsRef.current;

    // Subscribe to new conversations
    conversationIds.forEach(conversationId => {
      if (!currentSubscribedIds.has(conversationId)) {
        socketClient.subscribeToTyping(conversationId);
        currentSubscribedIds.add(conversationId);
      }
    });

    // Listen for typing start events
    const unsubTypingStart = socketClient.onTypingStart((event) => {
      if (event.userId === user.id) return; // Ignore own typing
      
      setTypingByConversation(prev => ({
        ...prev,
        [event.conversationId]: {
          username: event.username,
          typing_at: Date.now(),
        },
      }));
    });

    // Listen for typing stop events
    const unsubTypingStop = socketClient.onTypingStop((event) => {
      if (event.userId === user.id) return;
      
      setTypingByConversation(prev => ({
        ...prev,
        [event.conversationId]: null,
      }));
    });

    return () => {
      unsubTypingStart();
      unsubTypingStop();
      // Don't unsubscribe from typing rooms - keep subscriptions active
      // This allows typing indicators to work when navigating back from conversation view
      // currentSubscribedIds.forEach(id => {
      //   socketClient.unsubscribeFromTyping(id);
      // });
      // currentSubscribedIds.clear();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, JSON.stringify(conversationIds)]);

  const isTypingInConversation = useCallback((conversationId: string): boolean => {
    const info = typingByConversation[conversationId];
    return !!info && Date.now() - info.typing_at < 3000;
  }, [typingByConversation]);

  const getTypingUsername = useCallback((conversationId: string): string | null => {
    const info = typingByConversation[conversationId];
    return info ? info.username : null;
  }, [typingByConversation]);

  return {
    typingByConversation,
    isTypingInConversation,
    getTypingUsername,
  };
}
