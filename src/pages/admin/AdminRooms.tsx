import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { api } from '@/lib/api';
import { getAvatarUrl } from '@/lib/default-images';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, Users, Trash2, Eye, Lock, Globe, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { exportToCSV, formatDateForCSV } from '@/lib/csv-export';

// Fetch all rooms
function useAdminRooms() {
  return useQuery({
    queryKey: ['admin-rooms'],
    queryFn: async () => {
      const response = await api.getAdminRooms();
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch rooms');
      }
      return response.data;
    },
  });
}

// Fetch members for a specific room
function useRoomMembers(roomId: string | null) {
  return useQuery({
    queryKey: ['admin-room-members', roomId],
    queryFn: async () => {
      if (!roomId) return [];
      
      const { data, error } = await supabase
        .from('room_members')
        .select(`
          *,
          profiles:user_id (
            username,
            display_name,
            avatar_url,
            user_id
          )
        `)
        .eq('room_id', roomId)
        .order('joined_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!roomId,
  });
}

// Toggle room active status
function useToggleRoomStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ roomId, isActive }: { roomId: string; isActive: boolean }) => {
      await api.updateRoomStatus(roomId, isActive);
      return { roomId, isActive };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rooms'] });
    },
  });
}

// Delete room
function useDeleteRoom() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (roomId: string) => {
      await api.deleteRoom(roomId);
      return roomId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rooms'] });
    },
  });
}

// Remove member from room
function useRemoveMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ roomId, memberId }: { roomId: string; memberId: string }) => {
      const { error } = await supabase
        .from('room_members')
        .delete()
        .eq('id', memberId);
      
      if (error) throw error;
      return { roomId, memberId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-room-members', variables.roomId] });
      queryClient.invalidateQueries({ queryKey: ['admin-rooms'] });
    },
  });
}

// Toggle member mute
function useToggleMemberMute() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ roomId, memberId, isMuted }: { roomId: string; memberId: string; isMuted: boolean }) => {
      const { error } = await supabase
        .from('room_members')
        .update({ 
          is_muted: isMuted,
          muted_until: isMuted ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null,
        })
        .eq('id', memberId);
      
      if (error) throw error;
      return { roomId, memberId, isMuted };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-room-members', variables.roomId] });
    },
  });
}

export default function AdminRooms() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { data: rooms, isLoading } = useAdminRooms();
  const toggleStatus = useToggleRoomStatus();
  const deleteRoom = useDeleteRoom();
  const removeMember = useRemoveMember();
  const toggleMute = useToggleMemberMute();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);
  
  const { data: members, isLoading: membersLoading } = useRoomMembers(
    membersDialogOpen ? selectedRoom?.id : null
  );
  
  const filteredRooms = rooms?.filter(room => 
    room.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.name_ar?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleViewMembers = (room: any) => {
    setSelectedRoom(room);
    setMembersDialogOpen(true);
  };

  const handleDeleteClick = (roomId: string) => {
    setDeletingRoomId(roomId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingRoomId) return;
    
    try {
      await deleteRoom.mutateAsync(deletingRoomId);
      toast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
        description: language === 'ar' ? 'تم حذف الغرفة' : 'Room deleted successfully',
      });
      setDeleteDialogOpen(false);
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (roomId: string, currentStatus: boolean) => {
    try {
      await toggleStatus.mutateAsync({ roomId, isActive: !currentStatus });
      toast({
        title: language === 'ar' ? 'تم التحديث' : 'Updated',
        description: language === 'ar' ? 'تم تحديث حالة الغرفة' : 'Room status updated',
      });
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedRoom) return;
    
    try {
      await removeMember.mutateAsync({ roomId: selectedRoom.id, memberId });
      toast({
        title: language === 'ar' ? 'تم الإزالة' : 'Removed',
        description: language === 'ar' ? 'تم إزالة العضو' : 'Member removed successfully',
      });
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleToggleMute = async (memberId: string, currentMuted: boolean) => {
    if (!selectedRoom) return;
    
    try {
      await toggleMute.mutateAsync({ 
        roomId: selectedRoom.id, 
        memberId, 
        isMuted: !currentMuted 
      });
      toast({
        title: language === 'ar' ? 'تم التحديث' : 'Updated',
        description: currentMuted 
          ? (language === 'ar' ? 'تم إلغاء كتم العضو' : 'Member unmuted')
          : (language === 'ar' ? 'تم كتم العضو' : 'Member muted'),
      });
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleExportRooms = () => {
    if (!rooms) return;
    
    exportToCSV(
      rooms.map(room => ({
        name: room.name,
        name_ar: room.name_ar || '',
        description: room.description || '',
        is_public: room.is_public ? 'Yes' : 'No',
        is_active: room.is_active ? 'Yes' : 'No',
        members_count: room.members_count || 0,
        created_at: formatDateForCSV(room.created_at),
      })),
      'rooms-export',
      [
        { key: 'name', header: 'Name' },
        { key: 'name_ar', header: 'Name (Arabic)' },
        { key: 'description', header: 'Description' },
        { key: 'is_public', header: 'Public' },
        { key: 'is_active', header: 'Active' },
        { key: 'members_count', header: 'Members' },
        { key: 'created_at', header: 'Created At' },
      ]
    );
    
    toast({
      title: language === 'ar' ? 'تم التصدير' : 'Exported',
      description: language === 'ar' ? 'تم تصدير بيانات الغرف' : 'Rooms data exported successfully',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {language === 'ar' ? 'إدارة غرف المحادثة' : 'Chat Rooms Management'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' 
              ? 'إدارة الغرف والأعضاء' 
              : 'Manage rooms and members'}
          </p>
        </div>
        <Button onClick={handleExportRooms} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          {language === 'ar' ? 'تصدير CSV' : 'Export CSV'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">
            {language === 'ar' ? 'إجمالي الغرف' : 'Total Rooms'}
          </p>
          <p className="text-2xl font-bold">{rooms?.length || 0}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">
            {language === 'ar' ? 'غرف عامة' : 'Public Rooms'}
          </p>
          <p className="text-2xl font-bold">{rooms?.filter(r => r.is_public).length || 0}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">
            {language === 'ar' ? 'غرف خاصة' : 'Private Rooms'}
          </p>
          <p className="text-2xl font-bold">{rooms?.filter(r => !r.is_public).length || 0}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">
            {language === 'ar' ? 'غرف نشطة' : 'Active Rooms'}
          </p>
          <p className="text-2xl font-bold">{rooms?.filter(r => r.is_active).length || 0}</p>
        </div>
      </div>
      
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={language === 'ar' ? 'البحث عن غرفة...' : 'Search rooms...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ps-10"
        />
      </div>
      
      {/* Rooms Table */}
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{language === 'ar' ? 'الغرفة' : 'Room'}</TableHead>
              <TableHead>{language === 'ar' ? 'النوع' : 'Type'}</TableHead>
              <TableHead>{language === 'ar' ? 'الأعضاء' : 'Members'}</TableHead>
              <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
              <TableHead>{language === 'ar' ? 'تاريخ الإنشاء' : 'Created'}</TableHead>
              <TableHead>{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                </TableCell>
              </TableRow>
            ) : filteredRooms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {language === 'ar' ? 'لا توجد غرف' : 'No rooms found'}
                </TableCell>
              </TableRow>
            ) : (
              filteredRooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {language === 'ar' ? (room.name_ar || room.name) : room.name}
                      </p>
                      {room.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {room.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {room.is_public ? (
                      <Badge variant="outline" className="gap-1">
                        <Globe className="h-3 w-3" />
                        {language === 'ar' ? 'عامة' : 'Public'}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <Lock className="h-3 w-3" />
                        {language === 'ar' ? 'خاصة' : 'Private'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{room.members_count || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={room.is_active}
                      onCheckedChange={() => handleToggleStatus(room.id, room.is_active)}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(room.created_at), 'MMM d, yyyy', {
                      locale: language === 'ar' ? ar : enUS
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewMembers(room)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick(room.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Members Dialog */}
      <Dialog open={membersDialogOpen} onOpenChange={setMembersDialogOpen}>
        <DialogContent className="glass-card max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'أعضاء الغرفة: ' : 'Room Members: '}
              {selectedRoom?.name}
            </DialogTitle>
          </DialogHeader>
          
          {membersLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </div>
          ) : members?.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {language === 'ar' ? 'لا يوجد أعضاء' : 'No members found'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'ar' ? 'العضو' : 'Member'}</TableHead>
                  <TableHead>{language === 'ar' ? 'الدور' : 'Role'}</TableHead>
                  <TableHead>{language === 'ar' ? 'كتم' : 'Muted'}</TableHead>
                  <TableHead>{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members?.map((member: any) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <img
                          src={getAvatarUrl(member.profiles?.avatar_url)}
                          alt=""
                          className="h-8 w-8 rounded-full bg-muted"
                        />
                        <div>
                          <p className="font-medium">{member.profiles?.display_name || '-'}</p>
                          <p className="text-xs text-muted-foreground">@{member.profiles?.username}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={member.is_muted}
                        onCheckedChange={() => handleToggleMute(member.id, member.is_muted)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setMembersDialogOpen(false)}>
              {language === 'ar' ? 'إغلاق' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ar' ? 'تأكيد الحذف' : 'Confirm Deletion'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar' 
                ? 'هل أنت متأكد من حذف هذه الغرفة؟ سيتم حذف جميع الرسائل والأعضاء.'
                : 'Are you sure you want to delete this room? All messages and members will be removed.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              {language === 'ar' ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
