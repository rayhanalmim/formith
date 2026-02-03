/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { socketClient } from '@/lib/socket';

interface TypingUser {
  user_id: string;
  username: string;
  typing_at: number;
}

export function useRoomTyping(roomId: string | null) {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [displayName, setDisplayName] = useState<string>('User');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingRef = useRef<number>(0);

  // Fetch user profile for display name from Node.js API
  useEffect(() => {
    if (!user) return;
    
    api.getProfile(user.id)
      .then((response) => {
        const profile = response.data;
        if (profile) {
          setDisplayName(profile.display_name || profile.username || user.email?.split('@')[0] || 'User');
        }
      })
      .catch(() => {
        setDisplayName(user.email?.split('@')[0] || 'User');
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
    if (!roomId || !user) return;

    // Use room typing channel via Socket.io
    const typingChannel = `room-typing:${roomId}`;
    socketClient.subscribeToTyping(typingChannel);

    // Listen for typing start events
    const unsubStart = socketClient.onTypingStart((event) => {
      if (event.conversationId === typingChannel && event.userId !== user.id) {
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
      if (event.conversationId === typingChannel) {
        setTypingUsers(prev => prev.filter(u => u.user_id !== event.userId));
      }
    });

    return () => {
      socketClient.unsubscribeFromTyping(typingChannel);
      unsubStart();
      unsubStop();
    };
  }, [roomId, user]);

  // Broadcast typing status via Socket.io
  const setTyping = useCallback((isTyping: boolean) => {
    if (!roomId || !user) return;

    // Throttle typing broadcasts (max once per 500ms)
    const now = Date.now();
    if (isTyping && now - lastTypingRef.current < 500) return;
    lastTypingRef.current = now;

    const typingChannel = `room-typing:${roomId}`;
    try {
      if (isTyping) {
        socketClient.emitTyping(typingChannel, displayName);
      } else {
        socketClient.emitStopTyping(typingChannel);
      }
    } catch (error) {
      console.error('Failed to broadcast typing status:', error);
    }
  }, [roomId, user, displayName]);

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
