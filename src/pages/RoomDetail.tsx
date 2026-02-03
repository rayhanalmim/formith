import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useAdmin';
import { 
  useRoomBySlug, 
  useRoomMembers, 
  useUserRoomMembership,
  useLeaveRoom,
  useJoinRoom
} from '@/hooks/useRooms';
import { RoomChat } from '@/components/rooms/RoomChat';
import { RoomAdminControls } from '@/components/rooms/RoomAdminControls';
import { RoomInviteDialog } from '@/components/rooms/RoomInviteDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  ArrowRight, 
  Users, 
  LogOut, 
  Loader2,
  Lock 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RoomDetailPage() {
  const { roomSlug } = useParams<{ roomSlug: string }>();
  const { language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const hasAutoJoined = useRef(false);
  
  const { data: room, isLoading: loadingRoom } = useRoomBySlug(roomSlug || '');
  const { data: members } = useRoomMembers(room?.id || '');
  const { data: membership, isLoading: membershipLoading } = useUserRoomMembership(room?.id || '');
  const leaveRoom = useLeaveRoom();
  const joinRoom = useJoinRoom();
  
  // Auto-join public rooms when visiting
  useEffect(() => {
    if (
      room?.is_public && 
      user && 
      !membership && 
      !membershipLoading && 
      !authLoading &&
      !hasAutoJoined.current &&
      !joinRoom.isPending
    ) {
      hasAutoJoined.current = true;
      joinRoom.mutate(room.id);
    }
  }, [room, user, membership, membershipLoading, authLoading, joinRoom]);
  
  // Reset ref when room changes
  useEffect(() => {
    hasAutoJoined.current = false;
  }, [room?.id]);
  
  const isRoomCreator = room?.created_by === user?.id;
  const canInvite = isAdmin || isRoomCreator;

  const BackArrow = language === 'ar' ? ArrowRight : ArrowLeft;

  if (loadingRoom) {
    return (
      <MainLayout>
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-[500px] w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!room) {
    return (
      <MainLayout>
        <div className="glass-card p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">
            {language === 'ar' ? 'الغرفة غير موجودة' : 'Room not found'}
          </h2>
          <Link to="/rooms" className="text-primary hover:underline">
            {language === 'ar' ? 'العودة للغرف' : 'Back to rooms'}
          </Link>
        </div>
      </MainLayout>
    );
  }

  const roomName = language === 'ar' ? (room.name_ar || room.name) : room.name;
  const roomDescription = language === 'ar' 
    ? (room.description_ar || room.description) 
    : room.description;

  const handleLeave = async () => {
    await leaveRoom.mutateAsync(room.id);
    navigate('/rooms');
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Room Header */}
        <div className="relative overflow-hidden glass-card p-4 mb-4 border-primary/20">
          {/* Decorative gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent" />
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/rooms">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10">
                  <BackArrow className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex items-center justify-center w-11 h-11 rounded-xl",
                  !room.is_public 
                    ? "bg-gradient-to-br from-amber-500/20 to-amber-600/10" 
                    : "bg-gradient-to-br from-primary/20 to-primary/10"
                )}>
                  {!room.is_public ? (
                    <Lock className="h-5 w-5 text-amber-500" />
                  ) : (
                    <Users className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold">{roomName}</h1>
                    {!room.is_public && (
                      <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-500 bg-amber-500/10">
                        <Lock className="h-2.5 w-2.5 me-1" />
                        {language === 'ar' ? 'خاصة' : 'Private'}
                      </Badge>
                    )}
                  </div>
                  {roomDescription && (
                    <p className="text-sm text-muted-foreground line-clamp-1">{roomDescription}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Members count */}
              <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground px-3 py-1.5 bg-muted/50 rounded-full">
                <Users className="h-4 w-4" />
                <span className="font-medium">{members?.length || room.members_count}</span>
                <span className="hidden md:inline text-xs">
                  {language === 'ar' ? 'عضو' : 'online'}
                </span>
              </div>

              {/* Invite Button for Private Rooms */}
              {!room.is_public && canInvite && (
                <RoomInviteDialog roomId={room.id} />
              )}

              {/* Admin Controls */}
              {members && (
                <RoomAdminControls 
                  room={room} 
                  members={members}
                  onRoomDeleted={() => navigate('/rooms')}
                />
              )}

              {membership && !isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLeave}
                  disabled={leaveRoom.isPending}
                  className="rounded-full border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                >
                  {leaveRoom.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <LogOut className="h-4 w-4 me-1.5" />
                      {language === 'ar' ? 'مغادرة' : 'Leave'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 glass-card overflow-hidden rounded-2xl border-primary/10">
          {authLoading || membershipLoading || isAdminLoading ? (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
              </p>
            </div>
          ) : membership || isAdmin ? (
            <RoomChat room={room} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gradient-to-b from-transparent to-muted/20">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6">
                <Users className="h-12 w-12 text-primary/60" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                {language === 'ar' ? 'انضم للغرفة للمشاركة' : 'Join to participate'}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                {language === 'ar' 
                  ? 'يجب أن تكون عضواً في الغرفة لرؤية الرسائل وإرسالها' 
                  : 'You need to be a member to view and send messages'}
              </p>
              <Link to="/rooms">
                <Button className="rounded-full px-6">
                  <BackArrow className="h-4 w-4 me-2" />
                  {language === 'ar' ? 'العودة للغرف' : 'Back to rooms'}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
