import { useQuery } from '@tanstack/react-query';
import { doClient } from '@/lib/do-client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { isEncryptedMessage } from '@/lib/encryption';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Image as ImageIcon, Video, Lock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getAvatarUrl } from '@/lib/default-images';

interface MessagePreviewTooltipProps {
  conversationId: string;
  children: React.ReactNode;
}

interface PreviewMessage {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  media_url: string | null;
  media_type: string | null;
  sender_profile: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export function MessagePreviewTooltip({ conversationId, children }: MessagePreviewTooltipProps) {
  const { language } = useLanguage();
  const { user } = useAuth();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['message-preview', conversationId],
    queryFn: async (): Promise<PreviewMessage[]> => {
      // Get messages from DO
      const messagesData = await doClient.from('direct_messages')
        .eq('conversation_id', conversationId)
        .select('id, content, sender_id, created_at, media_url, media_type, is_deleted');

      // Filter non-deleted messages, sort by created_at desc, and take last 5
      const filtered = (messagesData || [])
        .filter((m: any) => !m.is_deleted)
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      if (filtered.length === 0) return [];

      // Get sender profiles
      const senderIds = [...new Set(filtered.map((m: any) => m.sender_id))];
      const profiles = await doClient.from('profiles')
        .in('user_id', senderIds)
        .select('user_id, display_name, avatar_url');

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      // Map messages with profiles and reverse for chronological order
      return filtered.map((m: any) => ({
        id: m.id,
        content: m.content,
        sender_id: m.sender_id,
        created_at: m.created_at,
        media_url: m.media_url,
        media_type: m.media_type,
        sender_profile: profileMap.get(m.sender_id) || null,
      })).reverse();
    },
    staleTime: 30 * 1000, // 30 seconds cache
    enabled: !!conversationId,
  });

  const formatTime = (date: string) => {
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      return formatDistanceToNow(d, {
        addSuffix: false,
        locale: language === 'ar' ? ar : enUS,
      });
    } catch {
      return '';
    }
  };

  const getMessageContent = (message: PreviewMessage) => {
    // Check for shared post
    if (message.content.startsWith('📤')) {
      return language === 'ar' ? '📤 منشور مشترك' : '📤 Shared post';
    }

    // Check for encrypted message
    if (isEncryptedMessage(message.content)) {
      return (
        <span className="flex items-center gap-1 italic text-muted-foreground">
          <Lock className="h-3 w-3" />
          {language === 'ar' ? 'رسالة مشفرة' : 'Encrypted message'}
        </span>
      );
    }
    
    // Check for media
    if (message.media_url) {
      if (message.media_type === 'video') {
        return (
          <span className="flex items-center gap-1">
            <Video className="h-3 w-3" />
            {language === 'ar' ? 'فيديو' : 'Video'}
          </span>
        );
      }
      return (
        <span className="flex items-center gap-1">
          <ImageIcon className="h-3 w-3" />
          {language === 'ar' ? 'صورة' : 'Image'}
        </span>
      );
    }
    
    return message.content.length > 50 
      ? message.content.substring(0, 50) + '...' 
      : message.content;
  };

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent 
        side={language === 'ar' ? 'left' : 'right'} 
        align="start"
        className="w-80 p-0"
      >
        <div className="p-3 border-b border-border">
          <p className="text-sm font-medium text-muted-foreground">
            {language === 'ar' ? 'آخر الرسائل' : 'Recent messages'}
          </p>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {language === 'ar' ? 'لا توجد رسائل' : 'No messages'}
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {messages.map((message) => {
              const isOwn = message.sender_id === user?.id;
              const senderName = message.sender_profile?.display_name || 
                (language === 'ar' ? 'مستخدم' : 'User');
              
              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2 p-2 border-b border-border/50 last:border-b-0",
                    isOwn && "flex-row-reverse"
                  )}
                >
                  <Avatar className="h-6 w-6 flex-shrink-0">
                    <AvatarImage src={getAvatarUrl(message.sender_profile?.avatar_url)} />
                    <AvatarFallback className="text-[10px]">
                      {senderName[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className={cn("flex-1 min-w-0", isOwn && "text-end")}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={cn(
                        "text-xs font-medium truncate",
                        isOwn && "order-2"
                      )}>
                        {isOwn 
                          ? (language === 'ar' ? 'أنت' : 'You') 
                          : senderName}
                      </span>
                      <span className={cn(
                        "text-[10px] text-muted-foreground",
                        isOwn && "order-1"
                      )}>
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                    <p className={cn(
                      "text-xs text-muted-foreground line-clamp-2",
                      isOwn && "text-end"
                    )}>
                      {getMessageContent(message)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
