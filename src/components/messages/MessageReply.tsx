import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { DirectMessage } from '@/hooks/useMessages';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Reply, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAvatarUrl } from '@/lib/default-images';

interface MessageReplyProps {
  replyTo: DirectMessage;
  onCancel: () => void;
}

export function MessageReply({ replyTo, onCancel }: MessageReplyProps) {
  const { language } = useLanguage();
  const { user } = useAuth();

  const isOwnReply = replyTo.sender_id === user?.id;
  const displayName = replyTo.sender_display_name || replyTo.sender_username || 'Unknown';

  return (
    <div className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg mb-2 border-l-2 border-primary">
      <div className="flex-shrink-0">
        <Avatar className="h-6 w-6">
          <AvatarImage
            src={getAvatarUrl(replyTo.sender_avatar_url)}
            alt={displayName}
          />
          <AvatarFallback className="text-xs">
            {displayName[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium">
            {isOwnReply 
              ? (language === 'ar' ? 'أنت' : 'You')
              : displayName
            }
          </span>
          <Reply className="h-3 w-3 text-muted-foreground" />
        </div>
        
        <div className="text-xs text-muted-foreground truncate">
          {replyTo.content}
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onCancel}
        className="h-6 w-6 p-0 flex-shrink-0"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

interface ReplyPreviewProps {
  replyTo: DirectMessage;
  isOwn: boolean;
}

export function ReplyPreview({ replyTo, isOwn }: ReplyPreviewProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  
  // Get display name properly - check if reply is from current user
  const isReplyFromSelf = replyTo.reply_sender_id === user?.id;
  const username = replyTo.reply_sender_username || replyTo.sender_username;
  const displayName = isReplyFromSelf 
    ? (language === 'ar' ? 'أنت' : 'You')
    : (username ? `@${username}` : (replyTo.reply_sender_display_name || replyTo.sender_display_name || '@unknown'));

  return (
    <div className={cn(
      "flex items-start gap-2 px-3 py-2 mb-1 rounded-lg border-s-2 border-primary/50",
      isOwn ? "bg-primary-foreground/10" : "bg-background/50"
    )}>
      <Reply className="h-3 w-3 flex-shrink-0 mt-0.5" style={{ color: isOwn ? 'inherit' : 'var(--muted-foreground)' }} />
      <div className="flex flex-col min-w-0 w-full">
        <span className={cn(
          "text-[10px] font-medium",
          isOwn ? "text-primary-foreground/80" : "text-foreground/80"
        )}>
          {displayName}
        </span>
        <span className={cn(
          "text-xs whitespace-pre-wrap break-words",
          isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
        )}>
          {replyTo.reply_content}
        </span>
      </div>
    </div>
  );
}
