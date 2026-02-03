import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { api } from '@/lib/api';

export interface RoomActivityLog {
  id: string;
  room_id: string;
  user_id: string;
  target_user_id: string | null;
  action_type: string;
  details: Record<string, unknown>;
  created_at: string;
  room?: {
    name: string;
    name_ar: string | null;
  };
  actor?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  target?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function useRoomActivityLogs(limit = 50) {
  return useQuery({
    queryKey: ['room-activity-logs', limit],
    queryFn: async (): Promise<RoomActivityLog[]> => {
      const response = await api.getRoomActivityLogs(limit);
      return (response.data || []) as RoomActivityLog[];
    },
  });
}

export function useLogRoomActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roomId,
      actionType,
      targetUserId,
      details = {},
    }: {
      roomId: string;
      actionType: string;
      targetUserId?: string;
      details?: Record<string, unknown>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const response = await api.logRoomActivity(roomId, user.id, actionType, targetUserId, details);
      if (!response.success) {
        throw new Error('Failed to log activity');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-activity-logs'] });
    },
  });
}
