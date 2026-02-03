import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { socketClient } from '@/lib/socket';
import { getAvatarUrl } from '@/lib/default-images';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  onClick?: () => void;
}

export function useDesktopNotifications() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const hasPermissionRef = useRef(false);
  const initialLoadRef = useRef(false);

  // Check and request permission
  useEffect(() => {
    if (!('Notification' in window)) {
      console.log('[DesktopNotifications] Not supported');
      return;
    }

    if (Notification.permission === 'granted') {
      hasPermissionRef.current = true;
      console.log('[DesktopNotifications] Permission already granted');
    } else if (Notification.permission !== 'denied') {
      // Request permission on first user interaction
      const requestPermission = async () => {
        try {
          const permission = await Notification.requestPermission();
          hasPermissionRef.current = permission === 'granted';
          console.log('[DesktopNotifications] Permission result:', permission);
        } catch (error) {
          console.error('[DesktopNotifications] Permission request failed:', error);
        }
      };

      // Request on click anywhere
      const handleClick = () => {
        requestPermission();
        document.removeEventListener('click', handleClick);
      };
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, []);

  // Show notification helper
  const showNotification = useCallback(({ title, body, icon, tag, onClick }: NotificationOptions) => {
    if (!hasPermissionRef.current) {
      console.log('[DesktopNotifications] No permission, skipping notification');
      return;
    }
    
    // Only show if tab is not focused
    if (document.hasFocus()) {
      console.log('[DesktopNotifications] Tab focused, skipping notification');
      return;
    }

    console.log('[DesktopNotifications] Showing notification:', title);

    try {
      const notification = new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        tag: tag || 'tahweel-message',
        silent: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        onClick?.();
      };

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    } catch (error) {
      console.error('[DesktopNotifications] Failed to show notification:', error);
    }
  }, []);

  // Subscribe to new messages via Socket.io
  useEffect(() => {
    if (!user) return;

    console.log('[DesktopNotifications] Setting up socket subscription for user:', user.id);

    // Wait for initial load to prevent notifications for existing messages
    const timeout = setTimeout(() => {
      initialLoadRef.current = true;
      console.log('[DesktopNotifications] Initial load complete, notifications enabled');
    }, 2000);

    const unsubMessage = socketClient.onDMMessage((event) => {
      if (event.type !== 'insert' || !event.message) return;

      const newMessage = event.message as {
        id: string;
        sender_id: string;
        content: string;
        conversation_id: string;
        sender_username?: string;
        sender_display_name?: string;
        sender_avatar_url?: string;
      };

      console.log('[DesktopNotifications] New message received:', newMessage.id);

      // Don't notify for own messages or during initial load
      if (newMessage.sender_id === user.id) {
        console.log('[DesktopNotifications] Skipping own message');
        return;
      }
      
      if (!initialLoadRef.current) {
        console.log('[DesktopNotifications] Skipping during initial load');
        return;
      }

      // Use sender info from the message (already included by backend)
      const senderName = language === 'ar'
        ? (newMessage.sender_display_name || newMessage.sender_username || 'شخص ما')
        : (newMessage.sender_display_name || newMessage.sender_username || 'Someone');
      
      // Truncate message content
      const messagePreview = newMessage.content.length > 50 
        ? newMessage.content.substring(0, 50) + '...'
        : newMessage.content;

      // Localized notification title
      const title = language === 'ar'
        ? `رسالة جديدة من ${senderName}`
        : `New message from ${senderName}`;

      showNotification({
        title,
        body: messagePreview,
        icon: getAvatarUrl(newMessage.sender_avatar_url),
        tag: `message-${newMessage.conversation_id}`,
      });
    });

    return () => {
      clearTimeout(timeout);
      unsubMessage();
    };
  }, [user, language, showNotification]);

  return {
    isSupported: 'Notification' in window,
    permission: typeof Notification !== 'undefined' ? Notification.permission : 'denied',
    requestPermission: async () => {
      if (!('Notification' in window)) return 'denied';
      const permission = await Notification.requestPermission();
      hasPermissionRef.current = permission === 'granted';
      return permission;
    },
    showNotification,
  };
}
