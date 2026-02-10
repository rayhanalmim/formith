import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function usePushNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Register service worker
  const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers not supported');
    }

    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    return registration;
  };

  // Request notification permission
  const requestPermission = async (): Promise<NotificationPermission> => {
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  };

  // Subscribe to push notifications
  const subscribe = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      if (!isSupported) throw new Error('Push notifications not supported');

      // Request permission if not granted
      let currentPermission = permission;
      if (currentPermission === 'default') {
        currentPermission = await requestPermission();
      }

      if (currentPermission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Fetch VAPID public key from server
      const vapidResponse = await api.getVapidPublicKey();
      if (!vapidResponse.data?.publicKey) {
        throw new Error('VAPID public key not configured on server');
      }

      // Register service worker
      const registration = await registerServiceWorker();

      // Get push subscription
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        const vapidKey = urlBase64ToUint8Array(vapidResponse.data.publicKey);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey as BufferSource,
        });
      }

      const subscriptionData = subscription.toJSON();

      // Save to Node.js backend
      const result = await api.createPushSubscription(
        user.id,
        subscriptionData.endpoint!,
        subscriptionData.keys?.p256dh || '',
        subscriptionData.keys?.auth || ''
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to create subscription');
      }

      // Update user settings to enable push notifications
      await api.updateUserSettings(user.id, { push_notifications: true });

      return subscription;
    },
    onSuccess: () => {
      toast({
        title: 'Push notifications enabled',
        description: 'You will receive notifications for mentions, likes, and comments.',
      });
      queryClient.invalidateQueries({ queryKey: ['push-subscription', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
    },
    onError: (error: Error) => {
      console.error('Push subscription error:', error);
      toast({
        title: 'Failed to enable notifications',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Unsubscribe from push notifications
  const unsubscribe = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Get current subscription
      if ('serviceWorker' in navigator) {
        let registration: ServiceWorkerRegistration | null = null;

        try {
          // Prefer an existing registration if one is available
          registration = await navigator.serviceWorker.getRegistration();

          // If there is no existing registration, try registering one
          if (!registration) {
            registration = await registerServiceWorker();
          }
        } catch (error) {
          console.warn('Service worker not available during unsubscribe:', error);
        }

        if (registration) {
          const subscription = await registration.pushManager.getSubscription();

          if (subscription) {
            await subscription.unsubscribe();
          }
        }
      }

      // Remove from Node.js backend
      const result = await api.deletePushSubscription(user.id);

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete subscription');
      }

      // Update user settings to disable push notifications
      await api.updateUserSettings(user.id, { push_notifications: false });
    },
    onSuccess: () => {
      toast({
        title: 'Push notifications disabled',
      });
      queryClient.invalidateQueries({ queryKey: ['push-subscription', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
    },
    onError: (error: Error) => {
      console.error('Push unsubscribe error:', error);
      toast({
        title: 'Failed to disable notifications',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Check if user is subscribed
  const { data: isSubscribed, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['push-subscription', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const response = await api.hasPushSubscription(user.id);
      return response.data?.hasSubscription || false;
    },
    enabled: !!user && isSupported,
    retry: false,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  return {
    isSupported,
    permission,
    isSubscribed: isSubscribed || false,
    isLoading: isLoadingSubscription,
    subscribe,
    unsubscribe,
    requestPermission,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
