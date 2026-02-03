import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { socketClient } from '@/lib/socket';

export function useSocketConnection() {
  const { user } = useAuth();
  const connectedRef = useRef(false);

  useEffect(() => {
    // Get auth token from localStorage
    const token = localStorage.getItem('auth_token');

    // Connect to socket server
    if (!connectedRef.current) {
      socketClient.connect(token || undefined);
      connectedRef.current = true;
    }

    // Subscribe to relevant rooms based on auth state
    if (user) {
      socketClient.subscribeToPosts();
      socketClient.subscribeToFeed();
      socketClient.subscribeToStories();
    }

    return () => {
      // Don't disconnect on unmount - keep connection alive
      // Only disconnect when user explicitly logs out
    };
  }, [user]);

  // Disconnect when user logs out
  useEffect(() => {
    if (!user && connectedRef.current) {
      // User logged out, disconnect
      socketClient.disconnect();
      connectedRef.current = false;
    }
  }, [user]);

  return {
    isConnected: socketClient.isConnected(),
    socket: socketClient.getSocket(),
  };
}
