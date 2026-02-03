import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BadgeCheck, Users, UserPlus } from 'lucide-react';
import { MutualFollowersBadge } from './MutualFollowersBadge';

interface UserCardProps {
  user: {
    user_id: string;
    username: string | null;
    display_name: string | null;
    display_name_ar: string | null;
    avatar_url: string | null;
    is_verified: boolean | null;
    followers_count: number | null;
  };
  isFollowing: boolean;
  onFollow: (userId: string) => void;
  isFollowPending?: boolean;
}

export function UserCard({ user, isFollowing, onFollow, isFollowPending }: UserCardProps) {
  const { t, language } = useLanguage();

  const displayName = language === 'ar'
    ? user.display_name_ar || user.display_name || user.username
    : user.display_name || user.username;

  return (
    <div className="glass-card p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-3">
        <Link to={`/profile/${user.username}`}>
          <img
            src={user.avatar_url || '/images/default-avatar.png'}
            alt={displayName || ''}
            className="w-14 h-14 rounded-full bg-muted hover:ring-2 hover:ring-primary transition-all object-cover"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Link 
              to={`/profile/${user.username}`}
              className="font-semibold text-sm truncate hover:text-primary transition-colors"
            >
              {displayName}
            </Link>
            {user.is_verified && (
              <BadgeCheck className="h-4 w-4 verified-badge flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            @{user.username}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              <Users className="h-3 w-3 me-1" />
              {user.followers_count || 0}
            </Badge>
            <MutualFollowersBadge targetUserId={user.user_id} />
          </div>
        </div>
      </div>
      
      <Button 
        size="sm" 
        variant={isFollowing ? 'outline' : 'default'}
        className="w-full mt-3 gap-2"
        onClick={() => onFollow(user.user_id)}
        disabled={isFollowPending}
      >
        <UserPlus className="h-4 w-4" />
        {isFollowing 
          ? (language === 'ar' ? 'متابَع' : 'Following') 
          : t('action.follow')
        }
      </Button>
    </div>
  );
}
