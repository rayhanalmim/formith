import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePinnedMessages, useUnpinMessage, useRealtimePinnedMessages } from '@/hooks/usePinnedMessages';
import { useIsAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Pin, X, ChevronDown, ChevronUp, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface PinnedMessagesProps {
  roomId: string;
}

export function PinnedMessages({ roomId }: PinnedMessagesProps) {
  const { language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(true);
  const { data: pinnedMessages, isLoading } = usePinnedMessages(roomId);
  const { data: isAdmin } = useIsAdmin();
  const unpinMessage = useUnpinMessage();

  // Subscribe to realtime updates
  useRealtimePinnedMessages(roomId);

  if (isLoading || !pinnedMessages || pinnedMessages.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-border/50 bg-gradient-to-r from-secondary/5 to-secondary/10">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-secondary/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Pin className="h-4 w-4 text-secondary" />
          <span className="text-sm font-medium">
            {language === 'ar' 
              ? `${pinnedMessages.length} رسالة مثبتة` 
              : `${pinnedMessages.length} Pinned Message${pinnedMessages.length > 1 ? 's' : ''}`}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-3 space-y-2 max-h-48 overflow-y-auto">
          {pinnedMessages.map((message) => {
            const profile = message.profile;
            const displayName = language === 'ar'
              ? (profile?.display_name_ar || profile?.display_name || profile?.username || 'مستخدم')
              : (profile?.display_name || profile?.username || 'User');

            const timeAgo = formatDistanceToNow(new Date(message.created_at), {
              addSuffix: true,
              locale: language === 'ar' ? ar : enUS,
            });

            return (
              <div 
                key={message.id} 
                className="flex items-start gap-3 p-3 bg-background/60 rounded-lg border border-border/30 group"
              >
                <Link to={`/profile/${profile?.username}`} className="shrink-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Link 
                      to={`/profile/${profile?.username}`}
                      className="text-sm font-semibold hover:text-primary transition-colors"
                    >
                      {displayName}
                    </Link>
                    {profile?.is_verified && (
                      <BadgeCheck className="h-3.5 w-3.5 verified-badge" />
                    )}
                    <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
                  </div>
                  <p className="text-sm text-foreground/90 line-clamp-2 whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                </div>

                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => unpinMessage.mutate({ messageId: message.id, roomId })}
                    disabled={unpinMessage.isPending}
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
