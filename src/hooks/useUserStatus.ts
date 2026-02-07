import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '@/lib/api';
import { socketClient } from '@/lib/socket';
import { isUserOnlineGlobal, isPresenceReady } from '@/hooks/useOnlinePresence';

export type UserStatus = 'online' | 'offline' | 'busy';

export function useUserStatus(userIds: string[]) {
  const queryClient = useQueryClient();
  const sortedKey = userIds.sort().join(',');
  
  const query = useQuery({
    queryKey: ['user-statuses', sortedKey],
    queryFn: async (): Promise<Record<string, UserStatus>> => {
      if (userIds.length === 0) return {};
      
      const response = await api.getUserStatuses(userIds);
      const statusMap: Record<string, UserStatus> = {};
      
      if (response.data) {
        Object.entries(response.data).forEach(([id, status]) => {
          statusMap[id] = (status as UserStatus) || 'offline';
        });
      }
      
      return statusMap;
    },
    enabled: userIds.length > 0,
    staleTime: 30000,
  });
  
  // Subscribe to socket for realtime status changes
  useEffect(() => {
    if (userIds.length === 0) return;
    
    const unsubStatusChange = socketClient.onUserStatusChange((event) => {
      if (userIds.includes(event.userId)) {
        queryClient.setQueryData<Record<string, UserStatus>>(
          ['user-statuses', sortedKey],
          (old) => ({
            ...old,
            [event.userId]: (event.status as UserStatus) || 'offline',
          })
        );
      }
    });
    
    const unsubOnline = socketClient.onUserOnline((event) => {
      if (userIds.includes(event.userId)) {
        queryClient.setQueryData<Record<string, UserStatus>>(
          ['user-statuses', sortedKey],
          (old) => ({ ...old, [event.userId]: 'online' })
        );
      }
    });
    
    const unsubOffline = socketClient.onUserOffline((event) => {
      if (userIds.includes(event.userId)) {
        queryClient.setQueryData<Record<string, UserStatus>>(
          ['user-statuses', sortedKey],
          (old) => ({ ...old, [event.userId]: 'offline' })
        );
        // Update last-seen cache with the timestamp from the server
        if (event.lastSeenAt) {
          queryClient.setQueryData<Record<string, string | null>>(
            ['last-seen', sortedKey],
            (old) => ({ ...old, [event.userId]: event.lastSeenAt! })
          );
        }
      }
    });
    
    return () => {
      unsubStatusChange();
      unsubOnline();
      unsubOffline();
    };
  }, [userIds, sortedKey, queryClient]);
  
  return {
    ...query,
    getStatus: (userId: string): UserStatus => {
      const dbStatus = query.data?.[userId] || 'offline';
      // If socket presence is ready, use it as source of truth for online/offline
      if (isPresenceReady()) {
        if (isUserOnlineGlobal(userId)) return 'online';
        // Trust DB only for 'busy' status; otherwise the user is offline
        if (dbStatus === 'busy') return 'busy';
        return 'offline';
      }
      return dbStatus;
    },
  };
}

interface SingleUserStatusData {
  status: UserStatus;
  lastSeenAt: string | null;
}

export function useSingleUserStatus(userId: string | undefined) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['user-status', userId],
    queryFn: async (): Promise<SingleUserStatusData> => {
      if (!userId) return { status: 'offline', lastSeenAt: null };
      
      const response = await api.getUserStatus(userId);
      return {
        status: (response.data?.status as UserStatus) || 'offline',
        lastSeenAt: response.data?.last_seen_at || null,
      };
    },
    enabled: !!userId,
    staleTime: 30000,
  });
  
  // Subscribe to socket for this specific user's status
  useEffect(() => {
    if (!userId) return;
    
    const unsubStatusChange = socketClient.onUserStatusChange((event) => {
      if (event.userId === userId) {
        queryClient.setQueryData<SingleUserStatusData>(['user-status', userId], (old) => ({
          status: (event.status as UserStatus) || 'offline',
          lastSeenAt: old?.lastSeenAt || null,
        }));
      }
    });
    
    const unsubOnline = socketClient.onUserOnline((event) => {
      if (event.userId === userId) {
        queryClient.setQueryData<SingleUserStatusData>(['user-status', userId], (old) => ({
          status: 'online',
          lastSeenAt: old?.lastSeenAt || null,
        }));
      }
    });
    
    const unsubOffline = socketClient.onUserOffline((event) => {
      if (event.userId === userId) {
        queryClient.setQueryData<SingleUserStatusData>(['user-status', userId], () => ({
          status: 'offline',
          lastSeenAt: event.lastSeenAt || new Date().toISOString(),
        }));
      }
    });
    
    return () => {
      unsubStatusChange();
      unsubOnline();
      unsubOffline();
    };
  }, [userId, queryClient]);
  
  // Compute status preferring socket presence over stale DB
  const computedStatus: UserStatus = (() => {
    const dbStatus = query.data?.status || 'offline';
    if (!userId) return 'offline';
    if (isPresenceReady()) {
      if (isUserOnlineGlobal(userId)) return 'online';
      if (dbStatus === 'busy') return 'busy';
      return 'offline';
    }
    return dbStatus;
  })();

  return {
    ...query,
    data: computedStatus,
    lastSeenAt: query.data?.lastSeenAt || null,
  };
}
