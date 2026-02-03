import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications, useUnreadCount, useMarkAllAsRead } from '@/hooks/useNotifications';
import { useGroupedNotifications } from '@/hooks/useGroupedNotifications';
import { SwipeableNotificationItem } from './SwipeableNotificationItem';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [newNotificationIds, setNewNotificationIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const prevNotificationsRef = useRef<string[]>([]);
  
  const { data: notifications, isLoading } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadCount();
  const markAllAsRead = useMarkAllAsRead();
  
  // Use grouped notifications
  const groupedNotifications = useGroupedNotifications(notifications);
  
  // Filter out dismissed notifications
  const visibleGroups = groupedNotifications.filter(
    group => !group.notifications.every(n => dismissedIds.has(n.id))
  );

  // Handle dismiss
  const handleDismiss = useCallback((ids: string[]) => {
    setDismissedIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      return next;
    });
  }, []);

  // Track new notifications for animation
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const currentIds = notifications.map(n => n.id);
      const prevIds = prevNotificationsRef.current;
      
      // Find new notifications that weren't in the previous list
      const newIds = currentIds.filter(id => !prevIds.includes(id));
      
      if (newIds.length > 0 && prevIds.length > 0) {
        setNewNotificationIds(new Set(newIds));
        setHasNewNotification(true);
        
        // Clear the "new" status after animation completes
        const timer = setTimeout(() => {
          setNewNotificationIds(new Set());
          setHasNewNotification(false);
        }, 3000);
        
        return () => clearTimeout(timer);
      }
      
      prevNotificationsRef.current = currentIds;
    }
  }, [notifications]);

  // Track new notification state
  useEffect(() => {
    if (unreadCount > 0 && !hasNewNotification) {
      setHasNewNotification(true);
    } else if (unreadCount === 0) {
      setHasNewNotification(false);
    }
  }, [unreadCount, hasNewNotification]);

  // Reset dismissed when popover closes
  useEffect(() => {
    if (!open) {
      // Clear dismissed after popover closes so they show again next time (if not marked as read)
      const timer = setTimeout(() => {
        setDismissedIds(new Set());
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={language === 'ar' ? 'الإشعارات' : 'Notifications'}
        >
          <Bell className={cn(
            "h-5 w-5",
            hasNewNotification && "text-primary"
          )} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center animate-in zoom-in-50">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-[calc(100vw-2rem)] sm:w-96 max-w-[400px] p-0 glass-card animate-in fade-in-0 zoom-in-95" 
        align="end"
        alignOffset={-8}
        sideOffset={8}
        collisionPadding={16}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">
            {language === 'ar' ? 'الإشعارات' : 'Notifications'}
          </h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
            >
              {markAllAsRead.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
              {language === 'ar' ? 'قراءة الكل' : 'Mark all read'}
            </Button>
          )}
        </div>
        
        {/* Content */}
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : visibleGroups.length > 0 ? (
            <div className="p-2 space-y-1">
              {visibleGroups.map((groupedNotification) => (
                <SwipeableNotificationItem
                  key={groupedNotification.id}
                  groupedNotification={groupedNotification}
                  onClose={() => setOpen(false)}
                  onDismiss={handleDismiss}
                  isNew={groupedNotification.notifications.some(n => newNotificationIds.has(n.id))}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">
                {language === 'ar' ? 'لا توجد إشعارات' : 'No notifications yet'}
              </p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
