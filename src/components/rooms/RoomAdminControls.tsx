/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useAdmin';
import { useIsRoomModerator } from '@/hooks/useRoomModerator';
import { Room, RoomMember } from '@/hooks/useRooms';
import { useDeleteRoom, useMuteMember, useSetMemberRole } from '@/hooks/useRoomAdmin';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { 
  Settings, 
  Trash2, 
  VolumeX, 
  Volume2, 
  Shield, 
  ShieldOff,
  MoreVertical,
  Loader2,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoomAdminControlsProps {
  room: Room;
  members: RoomMember[];
  onRoomDeleted?: () => void;
}

// Hook to fetch app roles for all members
function useMemberAppRoles(memberUserIds: string[]) {
  return useQuery({
    queryKey: ['member-app-roles', memberUserIds],
    queryFn: async () => {
      if (memberUserIds.length === 0) return {};
      
      const response = await api.getUsersRoles(memberUserIds);
      
      if (!response.success) {
        console.error('Error fetching member app roles:', response.error);
        return {};
      }
      
      return response.data || {};
    },
    enabled: memberUserIds.length > 0,
  });
}

export function RoomAdminControls({ room, members, onRoomDeleted }: RoomAdminControlsProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const { data: isRoomModerator } = useIsRoomModerator(room.id);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  
  const deleteRoom = useDeleteRoom();
  const muteMember = useMuteMember();
  const setMemberRole = useSetMemberRole();

  // Fetch app roles for all members
  const memberUserIds = useMemo(() => members.map(m => m.user_id), [members]);
  const { data: memberAppRoles = {} } = useMemberAppRoles(memberUserIds);

  const isRoomCreator = room.created_by === user?.id;
  
  // Admin or room creator has full control
  const hasFullControl = isAdmin || isRoomCreator;
  
  // Room moderators can only manage members (mute non-admins)
  const canManageMembers = hasFullControl || isRoomModerator;

  // Don't show controls if user can't manage anything
  if (!canManageMembers) return null;

  const handleDeleteRoom = async () => {
    await deleteRoom.mutateAsync(room.id);
    setShowDeleteDialog(false);
    onRoomDeleted?.();
  };

  const handleMuteMember = async (memberId: string, mute: boolean, targetUserId: string) => {
    const duration = mute ? 60 * 60 * 1000 : 0; // 1 hour or unmute
    await muteMember.mutateAsync({ 
      memberId, 
      roomId: room.id, 
      mute, 
      duration,
      targetUserId
    });
  };

  const handleSetModerator = async (memberId: string, isModerator: boolean, targetUserId: string) => {
    await setMemberRole.mutateAsync({ 
      memberId, 
      roomId: room.id, 
      role: isModerator ? 'moderator' : 'member',
      targetUserId
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowMembersDialog(true)}>
            <Users className="h-4 w-4 me-2" />
            {language === 'ar' ? 'إدارة الأعضاء' : 'Manage Members'}
          </DropdownMenuItem>
          {/* Only admins can delete rooms, not room moderators */}
          {hasFullControl && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 me-2" />
                {language === 'ar' ? 'حذف الغرفة' : 'Delete Room'}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Room Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ar' ? 'حذف الغرفة' : 'Delete Room'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar' 
                ? 'هل أنت متأكد من حذف هذه الغرفة؟ سيتم حذف جميع الرسائل ولا يمكن التراجع.'
                : 'Are you sure you want to delete this room? All messages will be deleted and this cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRoom}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteRoom.isPending}
            >
              {deleteRoom.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                language === 'ar' ? 'حذف' : 'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Manage Members Dialog */}
      <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'إدارة الأعضاء' : 'Manage Members'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar' 
                ? 'كتم أو ترقية الأعضاء كمشرفين'
                : 'Mute or promote members as moderators'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {members.map((member) => {
              const memberAppRole = memberAppRoles[member.user_id];
              const isMemberAdmin = memberAppRole === 'admin' || memberAppRole === 'manager';
              
              return (
                <MemberRow
                  key={member.id}
                  member={member}
                  isCurrentUser={member.user_id === user?.id}
                  isMemberAdmin={isMemberAdmin}
                  hasFullControl={hasFullControl || false}
                  onMute={(mute) => handleMuteMember(member.id, mute, member.user_id)}
                  onSetModerator={(isMod) => handleSetModerator(member.id, isMod, member.user_id)}
                  isMuting={muteMember.isPending}
                  isSettingRole={setMemberRole.isPending}
                  language={language}
                />
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface MemberRowProps {
  member: RoomMember & { role?: string };
  isCurrentUser: boolean;
  isMemberAdmin: boolean;
  hasFullControl: boolean;
  onMute: (mute: boolean) => void;
  onSetModerator: (isModerator: boolean) => void;
  isMuting: boolean;
  isSettingRole: boolean;
  language: string;
}

function MemberRow({ 
  member, 
  isCurrentUser,
  isMemberAdmin,
  hasFullControl,
  onMute, 
  onSetModerator,
  isMuting,
  isSettingRole,
  language 
}: MemberRowProps) {
  const profile = member.profile;
  const displayName = profile?.display_name || profile?.username || 'User';
  const isModerator = (member as any).role === 'moderator';
  const isMuted = member.is_muted;

  // Room moderators can't mute/unmute admins or manage moderator roles
  // They can only mute regular members
  const canMuteThisMember = !isMemberAdmin;
  const canManageModeratorRole = hasFullControl; // Only admins/room creators can assign moderators

  // Don't show actions for current user or if no actions available
  const hasAnyAction = canMuteThisMember || canManageModeratorRole;

  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="text-xs">
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{displayName}</span>
            {isMemberAdmin && (
              <span className="text-xs bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded">
                {language === 'ar' ? 'مدير' : 'Admin'}
              </span>
            )}
            {isModerator && !isMemberAdmin && (
              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                {language === 'ar' ? 'مشرف' : 'Mod'}
              </span>
            )}
            {isMuted && (
              <span className="text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">
                {language === 'ar' ? 'مكتوم' : 'Muted'}
              </span>
            )}
          </div>
        </div>
      </div>

      {!isCurrentUser && hasAnyAction && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* Mute option - only for non-admin members */}
            {canMuteThisMember && (
              <DropdownMenuItem 
                onClick={() => onMute(!isMuted)}
                disabled={isMuting}
              >
                {isMuted ? (
                  <>
                    <Volume2 className="h-4 w-4 me-2" />
                    {language === 'ar' ? 'إلغاء الكتم' : 'Unmute'}
                  </>
                ) : (
                  <>
                    <VolumeX className="h-4 w-4 me-2" />
                    {language === 'ar' ? 'كتم (1 ساعة)' : 'Mute (1 hour)'}
                  </>
                )}
              </DropdownMenuItem>
            )}
            {/* Make Moderator option - only for full control users (admins) */}
            {canManageModeratorRole && !isMemberAdmin && (
              <DropdownMenuItem 
                onClick={() => onSetModerator(!isModerator)}
                disabled={isSettingRole}
              >
                {isModerator ? (
                  <>
                    <ShieldOff className="h-4 w-4 me-2" />
                    {language === 'ar' ? 'إزالة الإشراف' : 'Remove Moderator'}
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 me-2" />
                    {language === 'ar' ? 'ترقية لمشرف' : 'Make Moderator'}
                  </>
                )}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
