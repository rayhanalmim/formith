import { useMemo } from 'react';
import type { Notification } from '@/hooks/useNotifications';

export interface GroupedNotification {
  id: string;
  type: string;
  notifications: Notification[];
  latestNotification: Notification;
  count: number;
  groupKey: string;
  isRead: boolean;
}

// Types that can be grouped together
const GROUPABLE_TYPES = ['like', 'comment_like', 'repost', 'poll_vote'];

// Time window for grouping (5 minutes)
const GROUP_TIME_WINDOW_MS = 5 * 60 * 1000;

function getGroupKey(notification: Notification): string | null {
  if (!GROUPABLE_TYPES.includes(notification.type)) {
    return null;
  }

  // Parse notification data
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

  if (!data) return null;

  // Group by type + target (post_id, comment_id, etc.)
  const postId = data.post_id || data.post_slug || '';
  const commentId = data.comment_id || '';
  
  return `${notification.type}:${postId}:${commentId}`;
}

function canGroupTogether(a: Notification, b: Notification): boolean {
  const aKey = getGroupKey(a);
  const bKey = getGroupKey(b);
  
  if (!aKey || !bKey || aKey !== bKey) return false;
  
  // Check if notifications are within the time window
  const aTime = new Date(a.created_at).getTime();
  const bTime = new Date(b.created_at).getTime();
  
  return Math.abs(aTime - bTime) <= GROUP_TIME_WINDOW_MS;
}

export function groupNotifications(notifications: Notification[]): GroupedNotification[] {
  if (!notifications || notifications.length === 0) return [];

  const grouped: GroupedNotification[] = [];
  const processed = new Set<string>();

  // Sort by created_at desc to ensure latest first
  const sorted = [...notifications].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  for (const notification of sorted) {
    if (processed.has(notification.id)) continue;

    const groupKey = getGroupKey(notification);
    
    if (!groupKey) {
      // Non-groupable notification - add as single item
      grouped.push({
        id: notification.id,
        type: notification.type,
        notifications: [notification],
        latestNotification: notification,
        count: 1,
        groupKey: notification.id,
        isRead: notification.is_read ?? true,
      });
      processed.add(notification.id);
      continue;
    }

    // Find all related notifications that can be grouped
    const relatedNotifications: Notification[] = [notification];
    processed.add(notification.id);

    for (const other of sorted) {
      if (processed.has(other.id)) continue;
      if (canGroupTogether(notification, other)) {
        relatedNotifications.push(other);
        processed.add(other.id);
      }
    }

    // Sort by created_at desc within group
    relatedNotifications.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    grouped.push({
      id: relatedNotifications[0].id,
      type: notification.type,
      notifications: relatedNotifications,
      latestNotification: relatedNotifications[0],
      count: relatedNotifications.length,
      groupKey,
      isRead: relatedNotifications.every(n => n.is_read),
    });
  }

  return grouped;
}

export function useGroupedNotifications(notifications: Notification[] | undefined) {
  return useMemo(() => {
    if (!notifications) return [];
    return groupNotifications(notifications);
  }, [notifications]);
}
