/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Room, 
  RoomMessage, 
  useRoomMessages, 
  useSendRoomMessage,
  useRealtimeRoomMessages 
} from '@/hooks/useRooms';
import { LinkPreview } from '@/components/shared/LinkPreview';
import { useRoomTyping } from '@/hooks/useRoomTyping';
import { useRoomReactions } from '@/hooks/useMessageReactions';
import { useRoomReadReceipts, useMarkRoomMessagesAsRead } from '@/hooks/useRoomReadReceipts';
import { useUsersRoles } from '@/hooks/useUserRole';
 import { useRoomMemberRoles, useIsRoomModerator, useRealtimeRoomMemberRoles } from '@/hooks/useRoomModerator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BadgeCheck, Send, Loader2, FileText, Download, MessageSquare, Pin, X, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { RoomMediaUpload } from './RoomMediaUpload';
import { RoomTypingIndicator } from './RoomTypingIndicator';
import { MessageReactions } from './MessageReactions';
import { MessageActions } from './MessageActions';
import { MessageReadReceipts } from './MessageReadReceipts';
import { PinnedMessages } from './PinnedMessages';
import { UserRoleBadge } from './UserRoleBadge';
import { VideoPlayer } from '@/components/ui/video-player';
import { getAvatarUrl } from '@/lib/default-images';
import type { UserRole } from '@/hooks/useUserRole';

interface RoomChatProps {
  room: Room;
}

export function RoomChat({ room }: RoomChatProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { data: messages, isLoading, hasMore, fetchOlderMessages, isFetchingOlder } = useRoomMessages(room.id);
  const sendMessage = useSendRoomMessage();
  const markAsRead = useMarkRoomMessagesAsRead();
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'file' | 'video' | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxVideo, setLightboxVideo] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLoadingOlderRef = useRef<boolean>(false);
  const isInitialLoadRef = useRef<boolean>(true);
  
  // Typing indicator
  const { typingUsers, handleTyping, stopTyping } = useRoomTyping(room.id);

  // Subscribe to realtime messages, reactions, and read receipts
  useRealtimeRoomMessages(room.id);
  useRoomReactions(room.id);
  useRoomReadReceipts(room.id);
 useRealtimeRoomMemberRoles(room.id);

  // Get unique user IDs from messages for role fetching
  const userIds = useMemo(() => {
    if (!messages) return [];
    const ids = new Set(messages.map(m => m.user_id));
    return Array.from(ids);
  }, [messages]);

  // Fetch site-level roles for all users in the chat
  const { data: usersRoles = {} } = useUsersRoles(userIds);
  
  // Fetch room-level roles (room moderators)
  const { data: roomMemberRoles = {} } = useRoomMemberRoles(room.id);
  
  // Check if current user is a room moderator
  const { data: isCurrentUserRoomMod = false } = useIsRoomModerator(room.id);

  // Scroll to bottom when new messages arrive (but not when loading older messages)
  useEffect(() => {
    if (!messages) return;

    // Skip scroll if we just loaded older messages
    if (isLoadingOlderRef.current) {
      isLoadingOlderRef.current = false;
      return;
    }

    // Scroll to bottom on initial load or new messages
    if (isInitialLoadRef.current || messages.length > 0) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 50);
      });
      isInitialLoadRef.current = false;
    }
  }, [messages]);

  // Mark messages as read when viewing
  useEffect(() => {
    if (messages && messages.length > 0 && user) {
      const messageIds = messages.map(m => m.id);
      markAsRead.mutate({ roomId: room.id, messageIds });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, user, room.id]); // markAsRead is intentionally excluded to prevent infinite loop

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!content.trim() && !mediaUrl) || !user) return;

    stopTyping();
    await sendMessage.mutateAsync({ 
      roomId: room.id, 
      content: content.trim() || (mediaType === 'image' ? '📷 Image' : mediaType === 'video' ? '🎬 Video' : '📎 File'),
      mediaUrl: mediaUrl || undefined,
      mediaType: mediaType || undefined
    });
    setContent('');
    setMediaUrl(null);
    setMediaType(null);
  };

  const handleMediaUpload = (url: string, type: 'image' | 'file' | 'video') => {
    setMediaUrl(url);
    setMediaType(type);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);
    handleTyping();
  };

  return (
    <>
      {/* Image Lightbox */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
            onClick={() => setLightboxImage(null)}
          >
            <X className="h-6 w-6" />
          </Button>
          <img 
            src={lightboxImage} 
            alt="" 
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Video Lightbox */}
      {lightboxVideo && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightboxVideo(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
            onClick={() => setLightboxVideo(null)}
          >
            <X className="h-6 w-6" />
          </Button>
          <div className="w-full h-full max-w-6xl max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <VideoPlayer 
              src={lightboxVideo} 
              autoPlay={true}
              className="w-full h-full"
              maxHeight="85vh"
            />
          </div>
        </div>
      )}

      <div className="flex flex-col h-full bg-gradient-to-b from-transparent to-muted/20">
      {/* Pinned Messages */}
      <PinnedMessages roomId={room.id} />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">
              {language === 'ar' ? 'جاري تحميل الرسائل...' : 'Loading messages...'}
            </p>
          </div>
        ) : messages && messages.length > 0 ? (
          <>
            {/* Load More Button at top */}
            {hasMore && (
              <div className="flex justify-center py-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    isLoadingOlderRef.current = true;
                    fetchOlderMessages();
                  }}
                  disabled={isFetchingOlder}
                  className="text-xs"
                >
                  {isFetchingOlder ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                    </>
                  ) : (
                    language === 'ar' ? 'تحميل رسائل أقدم' : 'Load older messages'
                  )}
                </Button>
              </div>
            )}
            {messages.map((message, index) => (
              <MessageBubble 
                key={message.id} 
                message={message} 
                roomId={room.id}
                isOwn={message.user_id === user?.id}
                language={language}
                showAvatar={index === 0 || messages[index - 1]?.user_id !== message.user_id}
                userRole={usersRoles[message.user_id]}
                roomRole={roomMemberRoles[message.user_id]}
                isCurrentUserRoomMod={isCurrentUserRoomMod}
                onImageClick={setLightboxImage}
                onVideoClick={setLightboxVideo}
              />
            ))}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
              <MessageSquare className="h-10 w-10 text-primary/60" />
            </div>
            <h3 className="font-semibold text-lg mb-1">
              {language === 'ar' ? 'ابدأ المحادثة' : 'Start the conversation'}
            </h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              {language === 'ar' 
                ? 'لا توجد رسائل بعد. كن أول من يرسل رسالة!' 
                : 'No messages yet. Be the first to send a message!'}
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      <RoomTypingIndicator typingUsers={typingUsers} />

      {/* Message Input */}
      {user ? (
        <form onSubmit={handleSend} className="p-4 border-t border-border/50 bg-background/80 backdrop-blur-sm">
          {/* Media Preview */}
          {mediaUrl && (
            <div className="mb-3 p-3 bg-muted/50 rounded-xl border border-border/50 flex items-center gap-3 animate-scale-in">
              {mediaType === 'image' ? (
                <img src={mediaUrl} alt="" className="h-16 w-16 rounded-lg object-cover shadow-sm" />
              ) : mediaType === 'video' ? (
                <div className="flex items-center gap-2 text-sm bg-background px-3 py-2 rounded-lg">
                  <Video className="h-5 w-5 text-primary" />
                  <span>{language === 'ar' ? 'فيديو' : 'Video'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm bg-background px-3 py-2 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="truncate max-w-[200px] font-medium">File attached</span>
                </div>
              )}
              <Button 
                type="button" 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                onClick={() => { setMediaUrl(null); setMediaType(null); }}
              >
                ✕
              </Button>
            </div>
          )}
          <div className="flex items-center gap-3">
            <RoomMediaUpload 
              onUpload={handleMediaUpload} 
              disabled={sendMessage.isPending}
            />
            <div className="flex-1 relative">
              <Input
                value={content}
                onChange={handleInputChange}
                placeholder={language === 'ar' ? 'اكتب رسالتك هنا...' : 'Type your message here...'}
                className="rounded-full pe-12 py-6 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/50"
                disabled={sendMessage.isPending}
              />
            </div>
            <Button 
              type="submit" 
              size="icon"
              disabled={(!content.trim() && !mediaUrl) || sendMessage.isPending}
              className="h-12 w-12 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-105 transition-all"
            >
              {sendMessage.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </form>
      ) : (
        <div className="p-6 border-t border-border/50 text-center bg-muted/30">
          <Link 
            to="/auth" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors"
          >
            {language === 'ar' ? 'سجل دخولك للمشاركة' : 'Login to participate'}
          </Link>
        </div>
      )}
      </div>
    </>
  );
}

interface MessageBubbleProps {
  message: RoomMessage & { is_pinned?: boolean };
  roomId: string;
  isOwn: boolean;
  language: string;
  showAvatar?: boolean;
  userRole?: UserRole | null;
  roomRole?: string | null; // Room-level role (e.g., 'moderator')
  isCurrentUserRoomMod?: boolean; // Whether current user is a room moderator
  onImageClick?: (url: string) => void;
  onVideoClick?: (url: string) => void;
}

function MessageBubble({ 
  message, 
  roomId, 
  isOwn, 
  language, 
  showAvatar = true, 
  userRole, 
  roomRole,
  isCurrentUserRoomMod = false,
  onImageClick,
  onVideoClick
}: MessageBubbleProps) {
  const profile = message.profile;
  const displayName = language === 'ar'
    ? (profile?.display_name_ar || profile?.display_name || profile?.username || 'مستخدم')
    : (profile?.display_name || profile?.username || 'User');

  // Safely parse date - if null/undefined/invalid, use current time
  const messageDate = message.created_at ? new Date(message.created_at) : null;
  const isValidDate = messageDate && !isNaN(messageDate.getTime()) && messageDate.getFullYear() > 2020;
  
  const timeAgo = isValidDate
    ? formatDistanceToNow(messageDate, {
        addSuffix: true,
        locale: language === 'ar' ? ar : enUS,
      })
    : language === 'ar' ? 'الآن' : 'just now';

  const hasMedia = !!(message as any).media_url;
  const mediaUrl = (message as any).media_url as string | undefined;
  const mediaType = (message as any).media_type;
  
  // Detect media type from URL extension if not set correctly (handles legacy data)
  const getActualMediaType = () => {
    if (mediaType === 'image') return 'image';
    if (mediaType === 'video') return 'video';
    if (mediaUrl) {
      const ext = mediaUrl.split('.').pop()?.toLowerCase();
      if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext || '')) return 'video';
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return 'image';
    }
    return mediaType || 'file';
  };
  
  const actualMediaType = getActualMediaType();
  const isImage = actualMediaType === 'image';
  const isVideo = actualMediaType === 'video';
  const isPinned = (message as any).is_pinned || false;

  return (
    <div className={cn(
      'flex gap-3 group animate-fade-in',
      isOwn ? 'flex-row-reverse' : 'flex-row'
    )}>
      {showAvatar ? (
        <Link to={`/profile/${profile?.username}`} className="shrink-0 self-start">
          <Avatar className="h-9 w-9 ring-2 ring-background shadow-sm hover:ring-primary/50 transition-all">
            <AvatarImage src={getAvatarUrl(profile?.avatar_url)} />
            <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-primary/10 font-medium">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
      ) : (
        <div className="w-9 shrink-0" />
      )}

      <div className={cn('flex flex-col max-w-[75%] sm:max-w-[65%]', isOwn && 'items-end')}>
        {showAvatar && (
          <div className={cn('flex items-center gap-1.5 mb-1 px-1', isOwn && 'flex-row-reverse')}>
            <Link 
              to={`/profile/${profile?.username}`}
              className="text-sm font-semibold hover:text-primary transition-colors"
            >
              {displayName}
            </Link>
            {profile?.is_verified && (
              <BadgeCheck className="h-4 w-4 verified-badge" />
            )}
            {/* Role Badge - Admin/Manager/Moderator/Room Mod */}
            <UserRoleBadge role={userRole} roomRole={roomRole} />
            {isPinned && (
              <Pin className="h-3.5 w-3.5 text-secondary" />
            )}
            <span className="text-[11px] text-muted-foreground">{timeAgo}</span>
            
            {/* Message Actions (Edit/Delete/Pin) */}
            <MessageActions
              messageId={message.id}
              roomId={roomId}
              currentContent={message.content}
              isOwn={isOwn}
              hasMedia={hasMedia}
              isPinned={isPinned}
              isRoomModerator={isCurrentUserRoomMod}
              messageAuthorId={message.user_id}
            />
          </div>
        )}

        <div className={cn(
          'px-4 py-2.5 rounded-2xl text-sm shadow-sm',
          isOwn 
            ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-tr-md' 
            : 'bg-muted/80 rounded-tl-md border border-border/30',
          isPinned && 'ring-1 ring-secondary/50'
        )}>
          {/* Media Content */}
          {hasMedia && (
            <div className="mb-2">
              {isImage ? (
                <img 
                  src={(message as any).media_url} 
                  alt="" 
                  className="max-w-full rounded-xl max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity shadow-md" 
                  onClick={() => onImageClick?.((message as any).media_url)}
                />
              ) : isVideo ? (
                <div 
                  className="relative cursor-pointer group/video"
                  onClick={() => onVideoClick?.((message as any).media_url)}
                >
                  <video 
                    src={(message as any).media_url} 
                    className="max-w-full rounded-xl max-h-64 shadow-md"
                    preload="metadata"
                  />
                  <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center opacity-80 group-hover/video:opacity-100 transition-opacity">
                    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                      <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-primary border-b-[10px] border-b-transparent ml-1" />
                    </div>
                  </div>
                </div>
              ) : (
                <a 
                  href={(message as any).media_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl transition-colors",
                    isOwn ? "bg-primary-foreground/15 hover:bg-primary-foreground/20" : "bg-background hover:bg-background/80"
                  )}
                >
                  <FileText className="h-5 w-5" />
                  <span className="text-sm font-medium underline">
                    {language === 'ar' ? 'تحميل الملف' : 'Download File'}
                  </span>
                  <Download className="h-4 w-4" />
                </a>
              )}
            </div>
          )}
          {/* Text Content */}
          {message.content && !message.content.startsWith('📷') && !message.content.startsWith('📎') && (
            <span className="whitespace-pre-wrap break-words">{message.content}</span>
          )}
          
          {/* Link Previews */}
          {message.link_previews && (
            <div className="mt-2">
              <LinkPreview previews={typeof message.link_previews === 'string' ? JSON.parse(message.link_previews) : message.link_previews} />
            </div>
          )}
        </div>

        {/* Message Reactions */}
        <MessageReactions messageId={message.id} isOwn={isOwn} roomId={roomId} />
        
        {/* Read Receipts - Only show for own messages */}
        {isOwn && <MessageReadReceipts messageId={message.id} isOwn={isOwn} />}
      </div>
    </div>
  );
}
