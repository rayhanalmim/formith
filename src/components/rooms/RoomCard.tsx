import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Room, useUserRoomMembership, useJoinRoom } from '@/hooks/useRooms';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Users, LogIn, Lock, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoomCardProps {
  room: Room;
}

export function RoomCard({ room }: RoomCardProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { data: membership } = useUserRoomMembership(room.id);
  const joinRoom = useJoinRoom();

  const name = language === 'ar' ? (room.name_ar || room.name) : room.name;
  const description = language === 'ar' 
    ? (room.description_ar || room.description) 
    : room.description;

  const isMember = !!membership;
  const isPrivate = !room.is_public;

  const handleJoin = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    joinRoom.mutate(room.id);
  };

  return (
    <div className={cn(
      "group relative overflow-hidden rounded-2xl border transition-all duration-300",
      "hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1",
      isMember 
        ? "bg-gradient-to-br from-primary/10 via-background to-background border-primary/30" 
        : "glass-card"
    )}>
      {/* Decorative gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {/* Member indicator */}
      {isMember && (
        <div className="absolute top-2 end-2">
          <Badge className="bg-emerald-500/90 text-white border-0 text-[10px] px-2">
            <Sparkles className="h-3 w-3 me-1" />
            {language === 'ar' ? 'عضو' : 'Member'}
          </Badge>
        </div>
      )}

      <div className="relative p-5">
        {/* Room Icon */}
        <div className="flex items-start gap-4">
          <div className={cn(
            "flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300",
            "group-hover:scale-110 group-hover:shadow-lg",
            isPrivate 
              ? "bg-gradient-to-br from-amber-500/20 to-amber-600/10 group-hover:shadow-amber-500/20" 
              : "bg-gradient-to-br from-primary/20 to-primary/10 group-hover:shadow-primary/20"
          )}>
            {isPrivate ? (
              <Lock className="h-6 w-6 text-amber-500" />
            ) : (
              <MessageSquare className="h-6 w-6 text-primary" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-lg truncate">{name}</h3>
              {isPrivate && (
                <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-500 bg-amber-500/10">
                  <Lock className="h-2.5 w-2.5 me-1" />
                  {language === 'ar' ? 'خاصة' : 'Private'}
                </Badge>
              )}
            </div>
            {description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-muted/50 rounded-full">
              <Users className="h-3.5 w-3.5" />
              <span className="font-medium">{room.members_count}</span>
              <span className="hidden sm:inline">
                {language === 'ar' ? 'عضو' : 'members'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isMember ? (
              <Link to={`/rooms/${room.slug || room.id}`}>
                <Button size="sm" className="rounded-full gap-1.5 shadow-md shadow-primary/20">
                  <MessageSquare className="h-4 w-4" />
                  {language === 'ar' ? 'دخول' : 'Enter'}
                  <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                </Button>
              </Link>
            ) : user ? (
              isPrivate ? (
                <Button size="sm" variant="outline" disabled className="rounded-full opacity-60">
                  <Lock className="h-4 w-4 me-1.5" />
                  {language === 'ar' ? 'بدعوة فقط' : 'Invite only'}
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleJoin}
                  disabled={joinRoom.isPending}
                  className="rounded-full gap-1.5 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                >
                  {joinRoom.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      {language === 'ar' ? 'انضمام' : 'Join'}
                    </>
                  )}
                </Button>
              )
            ) : (
              <Link to="/auth">
                <Button size="sm" variant="outline" className="rounded-full">
                  {language === 'ar' ? 'سجل للانضمام' : 'Login to join'}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
