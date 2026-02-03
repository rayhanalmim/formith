import { useEffect, useRef } from 'react';
import { useUnreadMessageCount } from '@/hooks/useMessages';

const DEFAULT_TITLE = 'Tahweel - Money Transfer, eSIM, Top-up & More';

export function useDocumentTitle() {
  const { data: unreadCount = 0 } = useUnreadMessageCount();
  const originalTitleRef = useRef(DEFAULT_TITLE);

  useEffect(() => {
    // Store original title on mount
    originalTitleRef.current = document.title || DEFAULT_TITLE;
  }, []);

  useEffect(() => {
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) Messages - Tahweel`;
    } else {
      document.title = DEFAULT_TITLE;
    }

    // Cleanup on unmount
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [unreadCount]);

  return { unreadCount };
}
