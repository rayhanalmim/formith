/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { socketClient } from '@/lib/socket';

interface TypingUser {
  user_id: string;
  username: string;
  typing_at: number;
}

export function useTypingIndicator(conversationId: string | null) {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [displayName, setDisplayName] = useState<string>('User');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingRef = useRef<number>(0);

  // Fetch user profile for display name from API
  useEffect(() => {
    if (!user) return;
    
    api.getProfile(user.id).then((response) => {
      if (response.data) {
        setDisplayName(response.data.display_name || response.data.username || user.email?.split('@')[0] || 'User');
      }
    });
  }, [user]);

  // Clean up stale typing indicators (older than 3 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => 
        prev.filter(u => now - u.typing_at < 3000)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Subscribe to typing events using Socket.io
  useEffect(() => {
    if (!conversationId || !user) return;

    console.log('[useTypingIndicator] Subscribing to typing channel:', conversationId);

    // Subscribe to typing events via Socket.io
    socketClient.subscribeToTyping(conversationId);

    // Listen for typing start events
    const unsubStart = socketClient.onTypingStart((event) => {
      if (event.conversationId === conversationId && event.userId !== user.id) {
        setTypingUsers(prev => {
          const existing = prev.find(u => u.user_id === event.userId);
          if (existing) {
            return prev.map(u => u.user_id === event.userId 
              ? { ...u, typing_at: Date.now() } 
              : u
            );
          }
          return [...prev, {
            user_id: event.userId,
            username: event.username,
            typing_at: Date.now(),
          }];
        });
      }
    });

    // Listen for typing stop events
    const unsubStop = socketClient.onTypingStop((event) => {
      if (event.conversationId === conversationId) {
        setTypingUsers(prev => prev.filter(u => u.user_id !== event.userId));
      }
    });

    return () => {
      console.log('[useTypingIndicator] Unsubscribing from typing channel');
      socketClient.unsubscribeFromTyping(conversationId);
      unsubStart();
      unsubStop();
    };
  }, [conversationId, user]);

  // Broadcast typing status via Socket.io
  const setTyping = useCallback((isTyping: boolean) => {
    if (!conversationId || !user) return;

    // Throttle typing broadcasts (max once per 500ms)
    const now = Date.now();
    if (isTyping && now - lastTypingRef.current < 500) return;
    lastTypingRef.current = now;

    try {
      if (isTyping) {
        socketClient.emitTyping(conversationId, displayName);
      } else {
        socketClient.emitStopTyping(conversationId);
      }
    } catch (error) {
      console.error('[useTypingIndicator] Failed to broadcast typing status:', error);
    }
  }, [conversationId, user, displayName]);

  // Handle input change - set typing and auto-clear after 2s of inactivity
  const handleTyping = useCallback(() => {
    setTyping(true);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 2000);
  }, [setTyping]);

  // Stop typing indicator
  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setTyping(false);
  }, [setTyping]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    typingUsers,
    handleTyping,
    stopTyping,
    isOtherUserTyping: typingUsers.length > 0,
  };
}
