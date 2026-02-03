import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { api } from '@/lib/api';

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

// Subscribe to realtime updates for room member role changes (keep Supabase for realtime)
export function useRealtimeRoomMemberRoles(roomId: string | undefined) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (!roomId) return;
    
    const channel = supabase
      .channel(`room-members-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_members',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          // Invalidate room member roles query on any change
          queryClient.invalidateQueries({ queryKey: ['room-member-roles', roomId] });
          queryClient.invalidateQueries({ queryKey: ['room-moderator'] });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, queryClient]);
}
