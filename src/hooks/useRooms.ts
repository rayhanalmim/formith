import { useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { api, Room, RoomMember, RoomMessage } from '@/lib/api';
import { socketClient } from '@/lib/socket';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { deleteFromSpaces } from './useDeleteFromSpaces';

export type { Room, RoomMember, RoomMessage };

export function usePublicRooms() {
  return useQuery({
    queryKey: ['rooms', 'public'],
    queryFn: async (): Promise<Room[]> => {
      const response = await api.getPublicRooms();
      return response.data || [];
    },
  });
}

export function useRoom(roomId: string) {
  return useQuery({
    queryKey: ['room', roomId],
    queryFn: async (): Promise<Room | null> => {
      const response = await api.getRoomById(roomId);
      return response.data || null;
    },
    enabled: !!roomId,
  });
}

export function useRoomBySlug(slug: string) {
  return useQuery({
    queryKey: ['room', 'slug', slug],
    queryFn: async (): Promise<Room | null> => {
      const response = await api.getRoomBySlug(slug);
      return response.data || null;
    },
    enabled: !!slug,
  });
}

export function useRoomMembers(roomId: string) {
  return useQuery({
    queryKey: ['room-members', roomId],
    queryFn: async (): Promise<RoomMember[]> => {
      const response = await api.getRoomMembers(roomId);
      return response.data || [];
    },
    enabled: !!roomId,
  });
}

export function useRoomMessages(roomId: string) {
  const query = useInfiniteQuery({
    queryKey: ['room-messages', roomId],
    queryFn: async ({ pageParam }) => {
      const response = await api.getRoomMessages(roomId, 50, pageParam);
      return {
        messages: response.data || [],
        hasMore: response.hasMore || false,
      };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: () => undefined, // Not used - we load older messages
    getPreviousPageParam: (firstPage) => {
      if (!firstPage.hasMore || firstPage.messages.length === 0) return undefined;
      return firstPage.messages[0]?.created_at;
    },
    enabled: !!roomId,
  });

  // Flatten all pages into a single array of messages
  const messages = useMemo(() => {
    if (!query.data?.pages) return [];
    return query.data.pages.flatMap(page => page.messages);
  }, [query.data?.pages]);

  return {
    ...query,
    data: messages,
    hasMore: query.data?.pages?.[0]?.hasMore ?? false,
    fetchOlderMessages: query.fetchPreviousPage,
    isFetchingOlder: query.isFetchingPreviousPage,
  };
}

export function useUserRoomMembership(roomId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['room-membership', roomId, user?.id],
    queryFn: async (): Promise<RoomMember | null> => {
      if (!user) return null;
      const response = await api.getUserRoomMembership(roomId, user.id);
      return response.data || null;
    },
    enabled: !!roomId && !!user,
  });
}

export function useJoinRoom() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (roomId: string) => {
      if (!user) throw new Error('Not authenticated');
      await api.joinRoom(roomId, user.id);
    },
    onSuccess: (_, roomId) => {
      queryClient.invalidateQueries({ queryKey: ['room-membership', roomId] });
      queryClient.invalidateQueries({ queryKey: ['room-members', roomId] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success(language === 'ar' ? 'انضممت للغرفة بنجاح' : 'Joined room successfully');
    },
    onError: (error) => {
      console.error('Failed to join room:', error);
      toast.error(language === 'ar' ? 'فشل الانضمام للغرفة' : 'Failed to join room');
    },
  });
}

export function useLeaveRoom() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (roomId: string) => {
      if (!user) throw new Error('Not authenticated');
      await api.leaveRoom(roomId, user.id);
    },
    onSuccess: (_, roomId) => {
      queryClient.invalidateQueries({ queryKey: ['room-membership', roomId] });
      queryClient.invalidateQueries({ queryKey: ['room-members', roomId] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success(language === 'ar' ? 'غادرت الغرفة' : 'Left room');
    },
    onError: (error) => {
      console.error('Failed to leave room:', error);
      toast.error(language === 'ar' ? 'فشل مغادرة الغرفة' : 'Failed to leave room');
    },
  });
}

export function useSendRoomMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      roomId, 
      content, 
      mediaUrl, 
      mediaType 
    }: { 
      roomId: string; 
      content: string; 
      mediaUrl?: string; 
      mediaType?: 'image' | 'file' | 'video';
    }) => {
      if (!user) throw new Error('Not authenticated');
      await api.sendRoomMessage(roomId, user.id, content, mediaUrl, mediaType);
    },
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: ['room-messages', roomId] });
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    },
  });
}

export function useEditRoomMessage() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      if (!user) throw new Error('Not authenticated');
      if (!content.trim()) throw new Error('Message cannot be empty');
      await api.editRoomMessage(messageId, user.id, content.trim());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-messages'] });
      toast.success(language === 'ar' ? 'تم تعديل الرسالة' : 'Message edited');
    },
    onError: (error) => {
      console.error('Failed to edit message:', error);
      toast.error(language === 'ar' ? 'فشل تعديل الرسالة' : 'Failed to edit message');
    },
  });
}

export function useDeleteRoomMessage() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      messageId, 
      isAdmin = false,
      roomId,
      messageAuthorId
    }: { 
      messageId: string; 
      isAdmin?: boolean;
      roomId?: string;
      messageAuthorId?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const response = await api.deleteRoomMessage(messageId, user.id, isAdmin, roomId, messageAuthorId);

      // Delete media from DigitalOcean Spaces (fire and forget)
      const mediaUrl = (response as { mediaUrl?: string }).mediaUrl;
      if (mediaUrl) {
        console.log('[useDeleteRoomMessage] Deleting media from storage:', mediaUrl);
        deleteFromSpaces([mediaUrl]).then(result => {
          console.log('[useDeleteRoomMessage] Storage cleanup result:', result);
        }).catch(err => {
          console.error('[useDeleteRoomMessage] Storage cleanup failed:', err);
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-messages'] });
      queryClient.invalidateQueries({ queryKey: ['pinned-messages'] });
      queryClient.invalidateQueries({ queryKey: ['room-activity-logs'] });
      toast.success(language === 'ar' ? 'تم حذف الرسالة للجميع' : 'Message deleted for everyone');
    },
    onError: (error) => {
      console.error('Failed to delete message:', error);
      toast.error(language === 'ar' ? 'فشل حذف الرسالة' : 'Failed to delete message');
    },
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (room: { name: string; name_ar?: string; description?: string; description_ar?: string; is_public?: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      const response = await api.createRoom(user.id, room);
      if (!response.success || !response.data) {
        throw new Error('Failed to create room');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success(language === 'ar' ? 'تم إنشاء الغرفة بنجاح' : 'Room created successfully');
    },
    onError: (error) => {
      console.error('Failed to create room:', error);
      toast.error(language === 'ar' ? 'فشل إنشاء الغرفة' : 'Failed to create room');
    },
  });
}

export function useRealtimeRoomMessages(roomId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!roomId) return;

    // Subscribe to room socket channel
    socketClient.subscribeToRoom(roomId);

    // Listen for new messages via Socket.io
    const unsubscribe = socketClient.onRoomMessage((message: RoomMessage) => {
      console.log('[Room] Received room:message event:', message);
      if (message.room_id === roomId) {
        // Skip if this is our own message (we already have it from optimistic update/query invalidation)
        if (message.user_id === user?.id) {
          console.log('[Room] Skipping own message from socket');
          return;
        }
        
        console.log('[Room] Adding message to cache for room:', roomId);
        // Add the new message to the infinite query cache
        queryClient.setQueryData(['room-messages', roomId], (oldData: any) => {
          if (!oldData?.pages) return oldData;
          
          // Add message to the last page (most recent)
          const lastPageIndex = oldData.pages.length - 1;
          const lastPage = oldData.pages[lastPageIndex];
          
          // Avoid duplicates
          if (lastPage.messages.some((m: RoomMessage) => m.id === message.id)) {
            return oldData;
          }
          
          const updatedPages = [...oldData.pages];
          updatedPages[lastPageIndex] = {
            ...lastPage,
            messages: [...lastPage.messages, message],
          };
          
          return { ...oldData, pages: updatedPages };
        });
        queryClient.invalidateQueries({ queryKey: ['pinned-messages', roomId] });
      }
    });

    return () => {
      socketClient.unsubscribeFromRoom(roomId);
      unsubscribe();
    };
  }, [roomId, queryClient, user?.id]);
}
