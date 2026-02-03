import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, UserPlus, Reply, ThumbsUp, Repeat2, AtSign, BarChart2, AlertTriangle, ShieldCheck, X, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMarkAsRead } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';
import type { GroupedNotification } from '@/hooks/useGroupedNotifications';

interface SwipeableNotificationItemProps {
  groupedNotification: GroupedNotification;
  onClose?: () => void;
  onDismiss?: (ids: string[]) => void;
  isNew?: boolean;
}

const iconMap = {
  like: Heart,
  comment: MessageCircle,
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

const SWIPE_THRESHOLD = 80;

export function SwipeableNotificationItem({ 
  groupedNotification, 
  onClose, 
  onDismiss,
  isNew = false 
}: SwipeableNotificationItemProps) {
  const { language } = useLanguage();
  const markAsRead = useMarkAsRead();
  const isMobile = useIsMobile();
  
  const [translateX, setTranslateX] = useState(0);
  const [isDismissing, setIsDismissing] = useState(false);
  const startXRef = useRef<number>(0);
  const startYRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const isVerticalScrollRef = useRef(false);
  
  const { latestNotification, count, notifications } = groupedNotification;
  
  const Icon = iconMap[latestNotification.type as keyof typeof iconMap] || Heart;
  const iconColor = iconColorMap[latestNotification.type as keyof typeof iconColorMap] || 'text-primary bg-primary/10';
  
  // Generate grouped title/message
  const getGroupedText = useCallback(() => {
    const baseTitle = language === 'ar' ? latestNotification.title_ar : latestNotification.title;
    const baseMessage = language === 'ar' ? latestNotification.message_ar : latestNotification.message;
    
    if (count === 1) {
      return { title: baseTitle, message: baseMessage };
    }
    
    // Create grouped message based on type
    const otherCount = count - 1;
    const typeMessages: Record<string, { en: string; ar: string }> = {
      like: { 
        en: `and ${otherCount} other${otherCount > 1 ? 's' : ''} liked your post`, 
        ar: `و ${otherCount} آخرين أعجبوا بمنشورك` 
      },
      comment_like: { 
        en: `and ${otherCount} other${otherCount > 1 ? 's' : ''} liked your comment`, 
        ar: `و ${otherCount} آخرين أعجبوا بتعليقك` 
      },
      repost: { 
        en: `and ${otherCount} other${otherCount > 1 ? 's' : ''} reposted your post`, 
        ar: `و ${otherCount} آخرين أعادوا نشر منشورك` 
      },
      poll_vote: { 
        en: `and ${otherCount} other${otherCount > 1 ? 's' : ''} voted on your poll`, 
        ar: `و ${otherCount} آخرين صوتوا في استطلاعك` 
      },
    };
    
    const typeMessage = typeMessages[latestNotification.type];
    const groupedMessage = typeMessage 
      ? (language === 'ar' ? typeMessage.ar : typeMessage.en)
      : baseMessage;
    
    return { 
      title: baseTitle, 
      message: groupedMessage 
    };
  }, [language, latestNotification, count]);
  
  const { title, message } = getGroupedText();
  
  const timeAgo = formatDistanceToNow(new Date(latestNotification.created_at), {
    addSuffix: true,
    locale: language === 'ar' ? ar : enUS,
  });

  const handleClick = () => {
    if (isDraggingRef.current) return;
    
    // Mark all notifications in the group as read
    notifications.forEach(n => {
      if (!n.is_read) {
        markAsRead.mutate(n.id);
      }
    });
    onClose?.();
  };

  const handleDismiss = useCallback(() => {
    setIsDismissing(true);
    // Mark all as read when dismissing
    const ids = notifications.map(n => n.id);
    notifications.forEach(n => {
      if (!n.is_read) {
        markAsRead.mutate(n.id);
      }
    });
    onDismiss?.(ids);
  }, [notifications, markAsRead, onDismiss]);

  // Touch handlers for swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    isDraggingRef.current = false;
    isVerticalScrollRef.current = false;
  }, [isMobile]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile || isVerticalScrollRef.current) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = startXRef.current - currentX;
    const diffY = Math.abs(currentY - startYRef.current);
    
    // Determine if this is a vertical scroll (ignore swipe)
    if (!isDraggingRef.current && diffY > 10 && diffY > Math.abs(diffX)) {
      isVerticalScrollRef.current = true;
      return;
    }
    
    // Only activate horizontal swipe if moved significantly
    if (Math.abs(diffX) > 10) {
      isDraggingRef.current = true;
    }
    
    if (isDraggingRef.current) {
      // Only allow swiping left (positive diffX)
      const newTranslate = Math.min(0, -diffX);
      setTranslateX(Math.max(-120, newTranslate));
    }
  }, [isMobile]);

  const handleTouchEnd = useCallback(() => {
    if (!isMobile) return;
    
    if (Math.abs(translateX) > SWIPE_THRESHOLD) {
      handleDismiss();
    } else {
      setTranslateX(0);
    }
    
    // Reset after a short delay to allow click to work
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 100);
  }, [isMobile, translateX, handleDismiss]);

  // Determine link destination based on notification type
  const getLink = () => {
    // First check if notification has a direct link field
    if (latestNotification.link) {
      return latestNotification.link;
    }

    let data: Record<string, string> | null = null;
    
    if (latestNotification.data) {
      if (typeof latestNotification.data === 'string') {
        try {
          data = JSON.parse(latestNotification.data);
        } catch {
          data = null;
        }
      } else {
        data = latestNotification.data as Record<string, string>;
      }
    }
    
    if (!data) return '/';
    
    switch (latestNotification.type) {
      case 'like':
      case 'comment':
      case 'comment_like':
      case 'reply':
      case 'mention_post':
      case 'mention_comment':
      case 'repost':
      case 'poll_vote':
        return data.post_slug ? `/post/${data.post_slug}` : (data.post_id ? `/post/${data.post_id}` : '/');
      case 'follow':
        return data.username ? `/profile/${data.username}` : (data.user_id ? `/profile/${data.user_id}` : '/');
      case 'report':
        return '/admin/reports';
      case 'room_moderator':
        return data.room_id ? `/rooms/${data.room_id}` : '/';
      default:
        return '/';
    }
  };

  if (isDismissing) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Dismiss background */}
      {isMobile && (
        <div 
          className={cn(
            "absolute inset-0 bg-destructive/90 flex items-center justify-end px-4 rounded-lg transition-opacity",
            Math.abs(translateX) > 20 ? "opacity-100" : "opacity-0"
          )}
        >
          <X className="h-5 w-5 text-destructive-foreground" />
        </div>
      )}
      
      <Link
        to={getLink()}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          'relative flex items-start gap-3 p-3 rounded-lg transition-all bg-background',
          'hover:bg-muted/50',
          !groupedNotification.isRead && 'bg-primary/5',
          isNew && 'animate-fade-in'
        )}
        style={{
          transform: isMobile ? `translateX(${translateX}px)` : undefined,
          transition: isDraggingRef.current ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        <div className="relative">
          <div className={cn(
            'p-2 rounded-full transition-transform duration-200 hover:scale-110',
            iconColor,
            isNew && 'animate-scale-in'
          )}>
            <Icon className="h-4 w-4" />
          </div>
          
          {/* Group indicator badge */}
          {count > 1 && (
            <div className="absolute -bottom-1 -right-1 flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {count > 9 ? '9+' : count}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-1.5">
            <p className="font-medium text-sm break-words">{title}</p>
            {count > 1 && (
              <Users className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-muted-foreground break-words line-clamp-2">{message}</p>
          <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
        </div>
        
        {!groupedNotification.isRead && (
          <div className={cn(
            "h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2",
            isNew && "animate-pulse"
          )} />
        )}
      </Link>
    </div>
  );
}
