import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BadgeCheck } from 'lucide-react';

interface FollowerUser {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  display_name_ar: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
}

interface FollowersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab: 'followers' | 'following';
  followers: FollowerUser[];
  following: FollowerUser[];
}

export function FollowersDialog({ 
  open, 
  onOpenChange, 
  initialTab, 
  followers, 
  following 
}: FollowersDialogProps) {
  const { language } = useLanguage();
  
  const renderUserList = (users: FollowerUser[]) => {
    if (users.length === 0) {
      return (
        <div className="py-8 text-center text-muted-foreground">
          {language === 'ar' ? 'لا يوجد مستخدمين' : 'No users'}
        </div>
      );
    }
    
    return (
      <ScrollArea className="h-[300px]">
        <div className="space-y-2 p-1">
          {users.map((user) => {
            const displayName = language === 'ar' 
              ? (user.display_name_ar || user.display_name || user.username)
              : (user.display_name || user.username);
            
            return (
              <Link
                key={user.id}
                to={`/profile/${user.username}`}
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <img
                  src={user.avatar_url || '/images/default-avatar.png'}
                  alt={displayName || ''}
                  className="w-10 h-10 rounded-full bg-muted"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-medium truncate">{displayName}</span>
                    {user.is_verified && (
                      <BadgeCheck className="h-4 w-4 verified-badge flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    @{user.username}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </ScrollArea>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card max-w-sm">
        <DialogHeader>
          <DialogTitle className="sr-only">
            {language === 'ar' ? 'المتابعون والمتابعين' : 'Followers and Following'}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="followers" className="flex-1">
              {language === 'ar' ? 'المتابِعون' : 'Followers'}
              <span className="ms-1 text-muted-foreground">({followers.length})</span>
            </TabsTrigger>
            <TabsTrigger value="following" className="flex-1">
              {language === 'ar' ? 'المتابَعون' : 'Following'}
              <span className="ms-1 text-muted-foreground">({following.length})</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="followers" className="mt-4">
            {renderUserList(followers)}
          </TabsContent>
          
          <TabsContent value="following" className="mt-4">
            {renderUserList(following)}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
