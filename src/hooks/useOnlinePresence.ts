import { useEffect, useState, useCallback, useMemo } from 'react';
import { socketClient } from '@/lib/socket';
import { useAuth } from '@/contexts/AuthContext';

export interface OnlineUser {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  online_at: string;
}

// Global state for online users (shared across components)
let globalOnlineUserIds: Set<string> = new Set();
let subscriberCount = 0;
let presenceSubscribed = false;
let presenceInitialized = false;

// Exported utility: check if a user is online based on socket presence (source of truth)
export function isUserOnlineGlobal(userId: string): boolean {
  return globalOnlineUserIds.has(userId);
}

// Whether we've received the initial presence list from the server
export function isPresenceReady(): boolean {
  return presenceInitialized;
}

export function useOnlinePresence() {
  const { user } = useAuth();
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(globalOnlineUserIds);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    subscriberCount++;

    // If already subscribed, just sync the state
    if (presenceSubscribed && subscriberCount > 1) {
      setOnlineUserIds(globalOnlineUserIds);
      return () => {
        subscriberCount--;
      };
    }

    // Subscribe to presence via Socket.io
    socketClient.subscribeToPresence();
    presenceSubscribed = true;

    // Listen for the initial full list of online users
    const unsubInitial = socketClient.onPresenceInitial((event) => {
      globalOnlineUserIds = new Set(event.onlineUserIds);
      presenceInitialized = true;
      setOnlineUserIds(new Set(globalOnlineUserIds));
    });

    // Listen for user online events
    const unsubOnline = socketClient.onUserOnline((event) => {
      globalOnlineUserIds.add(event.userId);
      setOnlineUserIds(new Set(globalOnlineUserIds));
    });

    // Listen for user offline events
    const unsubOffline = socketClient.onUserOffline((event) => {
      globalOnlineUserIds.delete(event.userId);
      setOnlineUserIds(new Set(globalOnlineUserIds));
    });

    // Mark current user as tracking
    if (user) {
      setIsTracking(true);
    }

    return () => {
      subscriberCount--;
      unsubInitial();
      unsubOnline();
      unsubOffline();
      if (subscriberCount === 0) {
        presenceSubscribed = false;
        presenceInitialized = false;
        globalOnlineUserIds = new Set();
      }
    };
  }, [user]);

  const isUserOnline = useCallback((userId: string) => {
    return globalOnlineUserIds.has(userId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlineUserIds]);

  // Convert Set to array for backward compatibility with consumers
  const onlineUsers = useMemo((): OnlineUser[] => {
    return Array.from(onlineUserIds).map(userId => ({
      user_id: userId,
      username: null,
      display_name: null,
      avatar_url: null,
      online_at: new Date().toISOString(),
    }));
  }, [onlineUserIds]);

  return { onlineUsers, onlineUserIds, isTracking, isUserOnline };
}
