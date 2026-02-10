import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSendRoomInvite, useRoomInvites, useCancelInvite } from '@/hooks/useRoomInvites';
import { api } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Search, Loader2, X, Clock, Check, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoomInviteDialogProps {
  roomId: string;
  trigger?: React.ReactNode;
}

interface SearchUser {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export function RoomInviteDialog({ roomId, trigger }: RoomInviteDialogProps) {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);

  const { data: invites = [] } = useRoomInvites(roomId);
  const sendInvite = useSendRoomInvite();
  const cancelInvite = useCancelInvite();

  useEffect(() => {
    const searchUsers = async () => {
      if (search.length < 2) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      try {
        // Search users via Node.js API
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:9000/api'}/users/search?q=${encodeURIComponent(search)}&limit=10`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${api.getToken()}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Search failed');
        }

        const data = await response.json();
        const users = (data.data || data || []).map((u: any) => ({
          user_id: u.user_id || u.id,
          username: u.username,
          display_name: u.display_name,
          avatar_url: u.avatar_url,
        }));

        setSearchResults(users);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const handleInvite = async (userId: string) => {
    await sendInvite.mutateAsync({ roomId, userId });
    setSearch('');
    setSearchResults([]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-300">
            <Clock className="h-3 w-3 me-1" />
            {language === 'ar' ? 'معلقة' : 'Pending'}
          </Badge>
        );
      case 'accepted':
        return (
          <Badge variant="outline" className="text-green-600 border-green-300">
            <Check className="h-3 w-3 me-1" />
            {language === 'ar' ? 'مقبولة' : 'Accepted'}
          </Badge>
        );
      case 'declined':
        return (
          <Badge variant="outline" className="text-red-600 border-red-300">
            <XCircle className="h-3 w-3 me-1" />
            {language === 'ar' ? 'مرفوضة' : 'Declined'}
          </Badge>
        );
      default:
        return null;
    }
  };

  const isUserInvited = (userId: string) => {
    return invites.some(inv => inv.invited_user_id === userId && inv.status === 'pending');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <UserPlus className="h-4 w-4 me-2" />
            {language === 'ar' ? 'دعوة أعضاء' : 'Invite Members'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {language === 'ar' ? 'دعوة أعضاء للغرفة' : 'Invite Members to Room'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={language === 'ar' ? 'ابحث عن مستخدم...' : 'Search for a user...'}
              className="ps-9"
            />
            {searching && (
              <Loader2 className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
              {searchResults.map((user) => (
                <div
                  key={user.user_id}
                  className="flex items-center justify-between p-3 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {(user.display_name || user.username || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.display_name || user.username}</p>
                      {user.username && user.display_name && (
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={isUserInvited(user.user_id) ? 'outline' : 'default'}
                    onClick={() => handleInvite(user.user_id)}
                    disabled={sendInvite.isPending || isUserInvited(user.user_id)}
                  >
                    {sendInvite.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isUserInvited(user.user_id) ? (
                      language === 'ar' ? 'تمت الدعوة' : 'Invited'
                    ) : (
                      language === 'ar' ? 'دعوة' : 'Invite'
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Pending Invites */}
          {invites.filter(i => i.status === 'pending').length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                {language === 'ar' ? 'الدعوات المعلقة' : 'Pending Invitations'}
              </h4>
              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {invites
                  .filter(invite => invite.status === 'pending')
                  .map((invite) => {
                    const invitedUser = (invite as any).invited_user;
                    return (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between p-3"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={invitedUser?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {(invitedUser?.display_name || invitedUser?.username || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {invitedUser?.display_name || invitedUser?.username || 'Unknown'}
                            </p>
                            {getStatusBadge(invite.status)}
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => cancelInvite.mutate(invite.id)}
                          disabled={cancelInvite.isPending}
                        >
                          {cancelInvite.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
