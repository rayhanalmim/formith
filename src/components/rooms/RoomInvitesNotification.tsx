import { useLanguage } from '@/contexts/LanguageContext';
import { useMyRoomInvites, useRespondToInvite } from '@/hooks/useRoomInvites';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, Loader2, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function RoomInvitesNotification() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { data: invites = [], isLoading } = useMyRoomInvites();
  const respondToInvite = useRespondToInvite();

  const handleResponse = async (inviteId: string, accept: boolean) => {
    const result = await respondToInvite.mutateAsync({ inviteId, accept });
    if (accept && result?.roomId) {
      navigate(`/rooms/${result.roomId}`);
    }
  };

  if (isLoading || invites.length === 0) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          {language === 'ar' ? 'دعوات الغرف' : 'Room Invitations'}
        </CardTitle>
        <CardDescription>
          {language === 'ar' 
            ? `لديك ${invites.length} دعوة معلقة` 
            : `You have ${invites.length} pending invitation${invites.length > 1 ? 's' : ''}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {invites.map((invite) => (
          <div
            key={invite.id}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">
                  {language === 'ar' ? invite.room?.name_ar || invite.room?.name : invite.room?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === 'ar' ? 'بواسطة' : 'from'}{' '}
                  {invite.inviter?.display_name || invite.inviter?.username || 'Unknown'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => handleResponse(invite.id, false)}
                disabled={respondToInvite.isPending}
              >
                {respondToInvite.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="icon"
                className="h-8 w-8"
                onClick={() => handleResponse(invite.id, true)}
                disabled={respondToInvite.isPending}
              >
                {respondToInvite.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
