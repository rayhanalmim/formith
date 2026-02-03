import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '@/lib/api';
import { socketClient } from '@/lib/socket';

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
    getStatus: (userId: string): UserStatus => query.data?.[userId] || 'offline',
  };
}

export function useSingleUserStatus(userId: string | undefined) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['user-status', userId],
    queryFn: async (): Promise<UserStatus> => {
      if (!userId) return 'offline';
      
      const response = await api.getUserStatus(userId);
      return (response.data?.status as UserStatus) || 'offline';
    },
    enabled: !!userId,
    staleTime: 30000,
  });
  
  // Subscribe to socket for this specific user's status
  useEffect(() => {
    if (!userId) return;
    
    const unsubStatusChange = socketClient.onUserStatusChange((event) => {
      if (event.userId === userId) {
        queryClient.setQueryData(['user-status', userId], (event.status as UserStatus) || 'offline');
      }
    });
    
    const unsubOnline = socketClient.onUserOnline((event) => {
      if (event.userId === userId) {
        queryClient.setQueryData(['user-status', userId], 'online');
      }
    });
    
    const unsubOffline = socketClient.onUserOffline((event) => {
      if (event.userId === userId) {
        queryClient.setQueryData(['user-status', userId], 'offline');
      }
    });
    
    return () => {
      unsubStatusChange();
      unsubOnline();
      unsubOffline();
    };
  }, [userId, queryClient]);
  
  return query;
}
