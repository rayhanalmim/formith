import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { api } from '@/lib/api';
import { socketClient } from '@/lib/socket';

export function useIsRoomModerator(roomId: string | undefined) {
  const { user, loading } = useAuth();

  return useQuery({
    queryKey: ['room-moderator', roomId, user?.id],
    queryFn: async () => {
      if (!user || !roomId) return false;

      const response = await api.isRoomModerator(roomId, user.id);
      return response.data || false;
    },
    enabled: !loading && !!user && !!roomId,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: false,
  });
}

// Fetch room member roles for displaying badges in chat
export function useRoomMemberRoles(roomId: string | undefined) {
  const { user, loading } = useAuth();

  return useQuery({
    queryKey: ['room-member-roles', roomId, user?.id],
    queryFn: async () => {
      if (!roomId) return {};

      const response = await api.getRoomMemberRoles(roomId);
      return response.data || {};
    },
    enabled: !loading && !!user && !!roomId,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: false,
  });
}

// Subscribe to realtime updates for room member role changes using Socket.io
export function useRealtimeRoomMemberRoles(roomId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!roomId) return;

    // Subscribe to the room to receive member updates
    socketClient.subscribeToRoom(roomId);

    // Listen for room member role changes via Socket.io
    const handleMemberChanged = (event: { roomId: string; memberId: string; role?: string }) => {
      if (event.roomId === roomId) {
        // Invalidate room member roles query on any change
        queryClient.invalidateQueries({ queryKey: ['room-member-roles', roomId] });
        queryClient.invalidateQueries({ queryKey: ['room-moderator'] });
      }
    };

    socketClient.on('room:member-changed', handleMemberChanged);

    return () => {
      socketClient.off('room:member-changed', handleMemberChanged);
    };
  }, [roomId, queryClient]);
}
