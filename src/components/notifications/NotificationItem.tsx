import { Link } from 'react-router-dom';
import { Heart, MessageCircle, UserPlus, Reply, ThumbsUp, Repeat2, AtSign, BarChart2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMarkAsRead, type Notification } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface NotificationItemProps {
  notification: Notification;
  onClose?: () => void;
  isNew?: boolean;
}

const iconMap = {
  like: Heart,
  comment: MessageCircle,
  comment_reply: Reply,
  comment_like: ThumbsUp,
  reply: Reply,
  follow: UserPlus,
  mention_post: AtSign,
  mention_comment: AtSign,
  repost: Repeat2,
  poll_vote: BarChart2,
  report: AlertTriangle,
  room_moderator: ShieldCheck,
};

const iconColorMap = {
  like: 'text-destructive bg-destructive/10',
  comment: 'text-info bg-info/10',
  comment_reply: 'text-emerald-500 bg-emerald-500/10',
  comment_like: 'text-amber-500 bg-amber-500/10',
  reply: 'text-emerald-500 bg-emerald-500/10',
  follow: 'text-primary bg-primary/10',
  mention_post: 'text-violet-500 bg-violet-500/10',
  mention_comment: 'text-violet-500 bg-violet-500/10',
  repost: 'text-green-500 bg-green-500/10',
  poll_vote: 'text-cyan-500 bg-cyan-500/10',
  report: 'text-orange-500 bg-orange-500/10',
  room_moderator: 'text-cyan-500 bg-cyan-500/10',
};

export function NotificationItem({ notification, onClose, isNew = false }: NotificationItemProps) {
  const { language } = useLanguage();
  const markAsRead = useMarkAsRead();
  
  const Icon = iconMap[notification.type as keyof typeof iconMap] || Heart;
  const iconColor = iconColorMap[notification.type as keyof typeof iconColorMap] || 'text-primary bg-primary/10';
  
  const title = language === 'ar' ? notification.title_ar : notification.title;
  const message = language === 'ar' ? notification.message_ar : notification.message;
  
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: language === 'ar' ? ar : enUS,
  });

  const handleClick = () => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }
    onClose?.();
  };

  // Determine link destination based on notification type
  const getLink = () => {
    // First check if notification has a direct link field
    if (notification.link) {
      return notification.link;
    }

    // Handle both parsed JSON object and raw JSON string (mobile compatibility)
    let data: Record<string, string> | null = null;
    
    if (notification.data) {
      if (typeof notification.data === 'string') {
        try {
          data = JSON.parse(notification.data);
        } catch {
          data = null;
        }
      } else {
        data = notification.data as Record<string, string>;
      }
    }
    
    if (!data) return '/';
    
    switch (notification.type) {
      case 'like':
      case 'comment':
      case 'comment_reply':
      case 'comment_like':
      case 'reply':
      case 'mention_post':
      case 'mention_comment':
      case 'repost':
      case 'poll_vote':
        // Use post_slug for proper routing, fallback to post_id for older notifications
        return data.post_slug ? `/post/${data.post_slug}` : (data.post_id ? `/post/${data.post_id}` : '/');
      case 'follow':
        // Use username for profile routing, fallback to user_id for older notifications
        return data.username ? `/profile/${data.username}` : (data.user_id ? `/profile/${data.user_id}` : '/');
      case 'report':
        // Link to admin reports page
        return '/admin/reports';
      case 'room_moderator':
        // Link to the room
        return data.room_id ? `/rooms/${data.room_id}` : '/';
      default:
        return '/';
    }
  };

  return (
    <Link
      to={getLink()}
      onClick={handleClick}
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg transition-all duration-300 hover:bg-muted/50',
        !notification.is_read && 'bg-primary/5',
        isNew && 'animate-fade-in'
      )}
    >
      <div className={cn(
        'p-2 rounded-full transition-transform duration-200 hover:scale-110',
        iconColor,
        isNew && 'animate-scale-in'
      )}>
        <Icon className="h-4 w-4" />
      </div>
      
      <div className="flex-1 min-w-0 overflow-hidden">
        <p className="font-medium text-sm break-words">{title}</p>
        <p className="text-sm text-muted-foreground break-words line-clamp-2">{message}</p>
        <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
      </div>
      
      {!notification.is_read && (
        <div className={cn(
          "h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2",
          isNew && "animate-pulse"
        )} />
      )}
    </Link>
  );
}
