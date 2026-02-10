import { useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { socketClient } from '@/lib/socket';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationSound } from '@/hooks/useNotificationSound';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  title_ar?: string;
  message: string;
  message_ar?: string;
  link: string | null;
  data?: string | Record<string, string>;
  is_read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { playNotificationSound } = useNotificationSound();
  const hasLoadedRef = useRef(false);

  const query = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const response = await api.getNotifications(user.id, 50);
      hasLoadedRef.current = true;
      return (response.data || []) as Notification[];
    },
    enabled: !!user,
  });

  // Memoized handler for new notifications via Socket.io
  const handleNewNotification = useCallback((notification: Notification) => {
    // Add new notification to the cache immediately
    queryClient.setQueryData<Notification[]>(
      ['notifications', user?.id],
      (old) => {
        if (!old) return [notification];
        // Prevent duplicates
        if (old.some(n => n.id === notification.id)) {
          return old;
        }
        return [notification, ...old];
      }
    );
    
    // Play notification sound for new notifications
    if (hasLoadedRef.current) {
      playNotificationSound();
    }
    
    // Invalidate unread count to update badge
    queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user?.id] });
  }, [queryClient, playNotificationSound, user?.id]);

  // Handle notification updates via Socket.io
  const handleNotificationUpdate = useCallback((data: { id: string; is_read: boolean }) => {
    queryClient.setQueryData<Notification[]>(
      ['notifications', user?.id],
      (old) => {
        if (!old) return [];
        return old.map((n) =>
          n.id === data.id ? { ...n, is_read: data.is_read } : n
        );
      }
    );
    
    // Also update unread count when a notification is marked as read
    queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user?.id] });
  }, [queryClient, user?.id]);

  // Handle notification deletions via Socket.io (e.g., when a related post is deleted)
  const handleNotificationDelete = useCallback((data: { ids: string[] }) => {
    if (!data?.ids || data.ids.length === 0) return;

    queryClient.setQueryData<Notification[]>(
      ['notifications', user?.id],
      (old) => {
        if (!old) return [];
        const idsToDelete = new Set(data.ids);
        return old.filter((n) => !idsToDelete.has(n.id));
      }
    );

    // Unread count may have changed
    queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user?.id] });
  }, [queryClient, user?.id]);

  // Handle mark all as read via Socket.io
  const handleMarkAllRead = useCallback(() => {
    queryClient.setQueryData<Notification[]>(
      ['notifications', user?.id],
      (old) => {
        if (!old) return [];
        return old.map((n) => ({ ...n, is_read: true }));
      }
    );
    queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user?.id] });
  }, [queryClient, user?.id]);

  // Real-time subscription via Socket.io
  useEffect(() => {
    if (!user) return;

    // Listen for notification events
    socketClient.on('notification:new', handleNewNotification);
    socketClient.on('notification:update', handleNotificationUpdate);
    socketClient.on('notification:mark-all-read', handleMarkAllRead);
    socketClient.on('notification:delete', handleNotificationDelete);

    return () => {
      socketClient.off('notification:new', handleNewNotification);
      socketClient.off('notification:update', handleNotificationUpdate);
      socketClient.off('notification:mark-all-read', handleMarkAllRead);
      socketClient.off('notification:delete', handleNotificationDelete);
    };
  }, [user?.id, handleNewNotification, handleNotificationUpdate, handleMarkAllRead, handleNotificationDelete]);

  return query;
}

export function useUnreadCount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['notifications-unread-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      
      const response = await api.getUnreadNotificationsCount(user.id);
      return response.data?.count || 0;
    },
    enabled: !!user,
    staleTime: 30000,
    // No polling - using socket instead
  });

  // Subscribe to Socket.io for realtime unread count updates
  useEffect(() => {
    if (!user) return;

    const unsubNotificationCount = socketClient.onNotificationUnreadCount((event) => {
      if (event.userId === user.id) {
        queryClient.setQueryData(['notifications-unread-count', user.id], event.count);
      }
    });

    return () => {
      unsubNotificationCount();
    };
  }, [user, queryClient]);

  return query;
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      await api.markNotificationAsRead(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user?.id] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async () => {
      if (!user) return;
      await api.markAllNotificationsAsRead(user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user?.id] });
    },
  });
}
