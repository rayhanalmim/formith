/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useConversationMessages, 
  useSendMessage, 
  useMarkMessagesAsRead,
  useDeleteMessage,
  useBulkDeleteMessages,
  useDeleteConversation,
  useHideMessage,
  useEditMessage,
  canEditMessage,
  Conversation,
  DirectMessage
} from '@/hooks/useMessages';
import { useConversationReactions } from '@/hooks/useDMReactions';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useSingleUserStatus } from '@/hooks/useUserStatus';
import { useEncryptedSendMessage } from '@/hooks/useEncryptedSendMessage';
import { DecryptedMessageContent, clearDecryptionCache } from '@/components/messages/DecryptedMessageContent';
import { EncryptedMediaDisplay, clearMediaDecryptionCache } from '@/components/messages/EncryptedMediaDisplay';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { TypingIndicator } from './TypingIndicator';
import { DMMediaUpload } from './DMMediaUpload';
import { StickerPicker } from '@/components/stickers/StickerPicker';
import { ForwardMessageDialog } from './ForwardMessageDialog';
import { DMReactions } from './DMReactions';
import { MessageReply, ReplyPreview } from './MessageReply';
import { StatusIndicator } from '@/components/ui/status-selector';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BadgeCheck, Send, Loader2, ChevronLeft, Check, CheckCheck, FileText, Download, MoreVertical, Trash2, X, Forward, CheckSquare, Reply, Pencil, EyeOff, Video, Lock, Phone, VideoIcon, Info } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getAvatarUrl } from '@/lib/default-images';
import { toast } from '@/hooks/use-toast';
import { SharedPostPreview, isSharedPostMessage } from './SharedPostPreview';

interface ChatViewProps {
  conversation: Conversation | null;
  onBack?: () => void;
  onClose?: () => void; // Add close handler
}

export function ChatView({ conversation, onBack, onClose }: ChatViewProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'file' | 'video' | null>(null);
  const [forwardMessage, setForwardMessage] = useState<DirectMessage | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<DirectMessage | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteConversationConfirm, setShowDeleteConversationConfirm] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef(false);
  const isLoadingMoreRef = useRef(false);
  const prevClientHeightRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: messages, isLoading, loadMore, hasMore, isLoadingMore } = useConversationMessages(conversation?.id || null);
  const sendMessage = useSendMessage();
  const deleteMessage = useDeleteMessage();
  const bulkDeleteMessages = useBulkDeleteMessages();
  const deleteConversation = useDeleteConversation();
  const hideMessageForUser = useHideMessage();
  const editMessage = useEditMessage();
  const markAsRead = useMarkMessagesAsRead();
  const { typingUsers, handleTyping, stopTyping, isOtherUserTyping } = useTypingIndicator(conversation?.id || null);
  const { data: otherUserStatus = 'offline' } = useSingleUserStatus(conversation?.other_user.user_id);
  
  const { sendEncrypted, isPending: isEncryptingSend, encryptionProgress } = useEncryptedSendMessage({
    conversation,
    onSuccess: () => {
      setReplyToMessage(null);
      inputRef.current?.focus();
      window.setTimeout(() => scrollToBottom(), 100);
    },
  });
  
  useConversationReactions(conversation?.id || null);

  useEffect(() => {
    clearDecryptionCache();
    clearMediaDecryptionCache();
  }, [conversation?.id]);

  useEffect(() => {
    if (conversation?.id) {
      markAsRead.mutate(conversation.id);
    }
  }, [conversation?.id]);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  const initialLoadRef = useRef(true);
  const ensureBottomTimerRef = useRef<number | null>(null);
  const ensureBottomUntilRef = useRef<number>(0);

  useLayoutEffect(() => {
    if (!conversation?.id) return;
    initialLoadRef.current = true;
    userScrolledUpRef.current = false;

    // Stronger re-entry pin: run a short RAF loop to force bottom when conversation opens
    let count = 0;
    let raf: number | 0 = 0 as number | 0;
    const tick = () => {
      if (!userScrolledUpRef.current) scrollToBottom();
      count += 1;
      if (count < 4) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // Also run a short interval for up to 1s to fight late transitions/media
    if (ensureBottomTimerRef.current) {
      clearInterval(ensureBottomTimerRef.current);
      ensureBottomTimerRef.current = null;
    }
    ensureBottomUntilRef.current = Date.now() + 1000;
    ensureBottomTimerRef.current = window.setInterval(() => {
      if (Date.now() > ensureBottomUntilRef.current || userScrolledUpRef.current) {
        if (ensureBottomTimerRef.current) {
          clearInterval(ensureBottomTimerRef.current);
          ensureBottomTimerRef.current = null;
        }
        return;
      }
      scrollToBottom();
    }, 120);

    return () => {
      cancelAnimationFrame(raf);
      if (ensureBottomTimerRef.current) {
        clearInterval(ensureBottomTimerRef.current);
        ensureBottomTimerRef.current = null;
      }
    };
  }, [conversation?.id, scrollToBottom]);

  // Keep at bottom on initial load while layout stabilizes, unless user scrolls up
  useLayoutEffect(() => {
    if (!messages || messages.length === 0) return;
    if (!initialLoadRef.current) return;

    let frame = 0;
    let rafId = 0 as number | 0;
    const step = () => {
      if (!userScrolledUpRef.current) scrollToBottom();
      frame += 1;
      if (frame < 3) {
        rafId = requestAnimationFrame(step);
      } else {
        // One last safety after images/emoji layout
        setTimeout(() => {
          if (!userScrolledUpRef.current) scrollToBottom();
          initialLoadRef.current = false;
        }, 200);
      }
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [messages, scrollToBottom]);

  // Track if user scrolled away from bottom to avoid forcing scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const threshold = 24; // px tolerance for near-bottom
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
      userScrolledUpRef.current = !atBottom;
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Keep pinned to bottom on any container height change unless user scrolled up
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    prevClientHeightRef.current = el.clientHeight;
    const ro = new ResizeObserver(() => {
      const nowH = el.clientHeight;
      const wasZero = prevClientHeightRef.current <= 1;
      prevClientHeightRef.current = nowH;
      // If container just became visible (height from 0 -> >0), force initial bottom
      if (wasZero && nowH > 1) {
        userScrolledUpRef.current = false;
        initialLoadRef.current = true;
      }
      if (!userScrolledUpRef.current && !isLoadingMoreRef.current) {
        scrollToBottom();
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [scrollToBottom]);

  // Re-pin when container becomes visible in viewport (e.g., after back -> open)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      const isVis = entries[0]?.isIntersecting;
      if (isVis && initialLoadRef.current && !userScrolledUpRef.current) {
        // small delay to let layout settle
        setTimeout(() => scrollToBottom(), 60);
      }
    }, { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [scrollToBottom]);

  // Observe DOM mutations inside the scroll container (reactions, images, edits)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const mo = new MutationObserver(() => {
      if (!userScrolledUpRef.current && !isLoadingMoreRef.current && !initialLoadRef.current) {
        scrollToBottom();
      }
    });
    mo.observe(el, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [scrollToBottom]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && !mediaFile) || !conversation) return;

    const content = message.trim() || (
      mediaType === 'image' ? '📷 Image' : 
      mediaType === 'video' ? '🎬 Video' : 
      '📎 File'
    );
    const currentReplyTo = replyToMessage;
    const currentMediaFile = mediaFile;
    const currentMediaType = mediaType;
    
    setMessage('');
    setMediaUrl(null);
    setMediaFile(null);
    setMediaType(null);
    stopTyping();
    
    // Force pin to bottom immediately while optimistic message is inserted
    userScrolledUpRef.current = false;
    scrollToBottom();
    requestAnimationFrame(() => scrollToBottom());
    // Short ensure-bottom loop (up to 1s) to absorb layout shifts
    if (ensureBottomTimerRef.current) {
      clearInterval(ensureBottomTimerRef.current);
      ensureBottomTimerRef.current = null;
    }
    ensureBottomUntilRef.current = Date.now() + 1000;
    ensureBottomTimerRef.current = window.setInterval(() => {
      if (Date.now() > ensureBottomUntilRef.current || userScrolledUpRef.current) {
        if (ensureBottomTimerRef.current) {
          clearInterval(ensureBottomTimerRef.current);
          ensureBottomTimerRef.current = null;
        }
        return;
      }
      scrollToBottom();
    }, 100);

    try {
      await sendEncrypted({
        content,
        mediaFile: currentMediaFile,
        mediaType: currentMediaType,
        replyToId: currentReplyTo?.id,
        replyContent: currentReplyTo?.content,
        replySenderId: currentReplyTo?.sender_id,
        replySenderUsername: currentReplyTo?.sender_username,
        replySenderDisplayName: currentReplyTo?.sender_display_name,
      });
    } catch (error) {
      console.error('Failed to send encrypted message:', error);
      setMessage(content);
      if (currentMediaFile && currentMediaType) {
        setMediaFile(currentMediaFile);
        setMediaType(currentMediaType);
      }
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!conversation) return;
    try {
      await deleteMessage.mutateAsync({ messageId, conversationId: conversation.id });
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const handleHideForMe = async (messageId: string) => {
    if (!conversation) return;
    try {
      await hideMessageForUser.mutateAsync({ messageId, conversationId: conversation.id });
      toast({
        title: language === 'ar' ? 'تم إخفاء الرسالة' : 'Message hidden',
      });
    } catch (error) {
      console.error('Failed to hide message:', error);
    }
  };

  const handleEdit = async (messageId: string, newContent: string) => {
    if (!conversation) return;
    try {
      await editMessage.mutateAsync({ messageId, newContent, conversationId: conversation.id });
      toast({
        title: language === 'ar' ? 'تم تعديل الرسالة' : 'Message edited',
      });
    } catch (error: any) {
      console.error('Failed to edit message:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error?.message?.includes('15 minutes') 
          ? (language === 'ar' ? 'يمكن تعديل الرسالة خلال 15 دقيقة فقط' : 'Messages can only be edited within 15 minutes')
          : (language === 'ar' ? 'فشل تعديل الرسالة' : 'Failed to edit message'),
        variant: 'destructive',
      });
    }
  };

  const handleMediaUpload = (url: string, type: 'image' | 'file' | 'video', file: File) => {
    setMediaUrl(url);
    setMediaType(type);
    setMediaFile(file);
  };

  const handleReply = (message: DirectMessage) => {
    setReplyToMessage(message);
    inputRef.current?.focus();
  };

  const handleCancelReply = () => {
    setReplyToMessage(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (e.target.value.trim()) {
      handleTyping();
    } else {
      stopTyping();
    }
  };

  const toggleMessageSelection = (messageId: string) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedMessages(newSelected);
  };

  const handleBulkDelete = async () => {
    if (!conversation || selectedMessages.size === 0) return;
    try {
      await bulkDeleteMessages.mutateAsync({
        messageIds: Array.from(selectedMessages),
        conversationId: conversation.id,
      });
      setSelectedMessages(new Set());
      setIsSelectMode(false);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Failed to delete messages:', error);
    }
  };

  const handleDeleteConversation = async () => {
    if (!conversation) return;
    try {
      await deleteConversation.mutateAsync(conversation.id);
      toast({
        title: language === 'ar' ? 'تم حذف المحادثة' : 'Conversation deleted',
      });
      onBack?.();
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل حذف المحادثة' : 'Failed to delete conversation',
        variant: 'destructive',
      });
    }
    setShowDeleteConversationConfirm(false);
  };

  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedMessages(new Set());
  };

  const formatMessageTime = (date: string) => {
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      return format(d, 'HH:mm', { locale: language === 'ar' ? ar : enUS });
    } catch {
      return '';
    }
  };

  const formatDateHeader = (date: string) => {
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      if (isToday(d)) {
        return language === 'ar' ? 'اليوم' : 'Today';
      }
      if (isYesterday(d)) {
        return language === 'ar' ? 'أمس' : 'Yesterday';
      }
      return format(d, 'dd MMMM yyyy', { locale: language === 'ar' ? ar : enUS });
    } catch {
      return '';
    }
  };

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-background">
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
          <Send className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-xl mb-2">
          {language === 'ar' ? 'رسائلك' : 'Your Messages'}
        </h3>
        <p className="text-muted-foreground">
          {language === 'ar' 
            ? 'اختر محادثة للبدء'
            : 'Select a conversation to start'}
        </p>
      </div>
    );
  }

  const displayName = language === 'ar'
    ? (conversation.other_user.display_name_ar || conversation.other_user.display_name)
    : conversation.other_user.display_name;

  const typingDisplayName = language === 'ar'
    ? (conversation.other_user.display_name_ar || conversation.other_user.display_name || conversation.other_user.username)
    : (conversation.other_user.display_name || conversation.other_user.username);

  const visibleMessages = messages?.filter(msg => !msg.is_deleted) || [];
  
  const groupedMessages: { date: string; messages: DirectMessage[] }[] = [];
  visibleMessages.forEach((msg) => {
    try {
      const date = new Date(msg.created_at);
      if (isNaN(date.getTime())) return;
      const dateKey = format(date, 'yyyy-MM-dd');
      const lastGroup = groupedMessages[groupedMessages.length - 1];
      if (lastGroup && lastGroup.date === dateKey) {
        lastGroup.messages.push(msg);
      } else {
        groupedMessages.push({ date: dateKey, messages: [msg] });
      }
    } catch (error) {
      console.warn('[ChatView] Error parsing date:', msg.id, error);
    }
  });

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Instagram-style Header */}
      <div className="flex items-center gap-3 px-3 py-3 border-b border-border bg-background">
        {isSelectMode ? (
          <>
            <Button variant="ghost" size="icon" onClick={exitSelectMode} className="h-10 w-10">
              <X className="h-5 w-5" />
            </Button>
            <span className="flex-1 font-medium">
              {selectedMessages.size} {language === 'ar' ? 'محدد' : 'selected'}
            </span>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={selectedMessages.size === 0}
            >
              <Trash2 className="h-4 w-4 me-1" />
              {language === 'ar' ? 'حذف' : 'Delete'}
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              {onClose && (
                <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9">
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
            
            {/* User info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={getAvatarUrl(conversation.other_user.avatar_url)}
                    alt={displayName || ''}
                  />
                  <AvatarFallback>
                    {(displayName || conversation.other_user.username || '?')[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <StatusIndicator 
                  status={otherUserStatus} 
                  size="sm" 
                  className="-bottom-0.5 -right-0.5" 
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-sm truncate">
                    {displayName || conversation.other_user.username}
                  </span>
                  {conversation.other_user.is_verified && (
                    <BadgeCheck className="h-4 w-4 verified-badge flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {otherUserStatus === 'online' 
                    ? (language === 'ar' ? 'متصل' : 'Active now') 
                    : otherUserStatus === 'busy'
                      ? (language === 'ar' ? 'مشغول' : 'Busy')
                      : (language === 'ar' ? 'غير متصل' : 'Offline')
                  }
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              {/* Encryption badge */}
              <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full me-1">
                <Lock className="h-3 w-3 text-primary" />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Info className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={language === 'ar' ? 'start' : 'end'} className="bg-popover">
                  <DropdownMenuItem onClick={() => setIsSelectMode(true)}>
                    <CheckSquare className="h-4 w-4 me-2" />
                    {language === 'ar' ? 'تحديد الرسائل' : 'Select messages'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteConversationConfirm(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 me-2" />
                    {language === 'ar' ? 'حذف المحادثة' : 'Delete chat'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </div>

      {/* Messages - Instagram style with clean background */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 pt-4 pb-0"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Load More Button */}
            {hasMore && !isLoadingMore && messages && messages.length > 0 && (
              <div className="flex justify-center py-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const el = scrollRef.current;
                    if (!el) return;
                    // Preserve scroll position: capture before
                    const prevHeight = el.scrollHeight;
                    const prevTop = el.scrollTop;
                    isLoadingMoreRef.current = true;
                    await loadMore();
                    // After DOM updates, compensate height delta (double RAF for safety)
                    requestAnimationFrame(() => {
                      requestAnimationFrame(() => {
                        const nextHeight = el.scrollHeight;
                        const delta = nextHeight - prevHeight;
                        el.scrollTop = prevTop + delta;
                        // Allow ResizeObserver to resume pinning behavior
                        isLoadingMoreRef.current = false;
                      });
                    });
                  }}
                  className="text-xs"
                >
                  {language === 'ar' ? 'تحميل المزيد' : 'Load More'}
                </Button>
              </div>
            )}

            {/* Loading More Indicator */}
            {isLoadingMore && (
              <div className="flex justify-center py-2">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {groupedMessages.map((group) => (
              <div key={group.date}>
                {/* Date header */}
                <div className="flex items-center justify-center my-4">
                  <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                    {formatDateHeader(group.messages[0]?.created_at || '')}
                  </span>
                </div>

                {/* Messages */}
                <div className="space-y-1">
                  {group.messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      conversation={conversation}
                      isOwn={msg.sender_id === user?.id}
                      language={language}
                      onDelete={() => handleDelete(msg.id)}
                      onHideForMe={() => handleHideForMe(msg.id)}
                      onEdit={(newContent) => handleEdit(msg.id, newContent)}
                      onForward={() => setForwardMessage(msg)}
                      onReply={() => handleReply(msg)}
                      onCloseSidebar={onClose}
                      formatTime={formatMessageTime}
                      isSelectMode={isSelectMode}
                      isSelected={selectedMessages.has(msg.id)}
                      onToggleSelect={() => toggleMessageSelection(msg.id)}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isOtherUserTyping && (
              <TypingIndicator username={typingDisplayName} />
            )}
          </div>
        )}
        <div ref={bottomAnchorRef} className="h-0" />
      </div>

      {/* Input - Instagram style */}
      <form onSubmit={handleSend} className="p-3 border-t border-border bg-background">
        {/* Reply Preview */}
        {replyToMessage && (
          <MessageReply 
            replyTo={replyToMessage} 
            onCancel={handleCancelReply} 
          />
        )}
        
        {/* Media Preview */}
        {mediaUrl && (
          <div className="mb-2 p-2 bg-muted rounded-xl flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary flex-shrink-0" />
            {mediaType === 'image' ? (
              <img src={mediaUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
            ) : mediaType === 'video' ? (
              <div className="flex items-center gap-2 text-sm">
                <Video className="h-4 w-4" />
                <span>{language === 'ar' ? 'فيديو' : 'Video'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4" />
                <span>{language === 'ar' ? 'ملف' : 'File'}</span>
              </div>
            )}
            <Button 
              type="button" 
              variant="ghost" 
              size="icon"
              className="h-6 w-6 ms-auto"
              onClick={() => { setMediaUrl(null); setMediaFile(null); setMediaType(null); }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {/* Encryption progress */}
        {isEncryptingSend && encryptionProgress > 0 && mediaFile && (
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3 w-3 animate-pulse text-primary" />
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${encryptionProgress}%` }}
              />
            </div>
            <span>{encryptionProgress}%</span>
          </div>
        )}
        
        {/* Input row - Instagram style with rounded container */}
        <div className="flex items-center gap-2 bg-muted/50 rounded-full px-2 py-1">
          <DMMediaUpload 
            onUpload={handleMediaUpload} 
            disabled={false}
          />
          <StickerPicker
            onSelect={(sticker) => setMessage(prev => prev + sticker)}
            disabled={false}
          />
          <Input
            ref={inputRef}
            value={message}
            onChange={handleInputChange}
            placeholder={language === 'ar' ? 'رسالة...' : 'Message...'}
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-9"
            disabled={false}
          />
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            className={cn(
              "h-9 w-9 rounded-full transition-colors",
              (message.trim() || mediaUrl)
                ? "text-primary hover:text-primary hover:bg-primary/10"
                : "text-muted-foreground"
            )}
            disabled={!message.trim() && !mediaUrl}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </form>

      {/* Forward Message Dialog */}
      <ForwardMessageDialog
        message={forwardMessage}
        open={!!forwardMessage}
        onOpenChange={(open) => !open && setForwardMessage(null)}
      />

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ar' ? 'حذف الرسائل' : 'Delete Messages'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar'
                ? `هل أنت متأكد أنك تريد حذف ${selectedMessages.size} رسالة؟`
                : `Delete ${selectedMessages.size} message${selectedMessages.size > 1 ? 's' : ''}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'ar' ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleteMessages.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                language === 'ar' ? 'حذف' : 'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Conversation Confirmation */}
      <AlertDialog open={showDeleteConversationConfirm} onOpenChange={setShowDeleteConversationConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ar' ? 'حذف المحادثة' : 'Delete Chat'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar'
                ? 'سيتم حذف المحادثة من قائمتك فقط.'
                : 'This will delete the chat from your list.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'ar' ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConversation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteConversation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                language === 'ar' ? 'حذف' : 'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface MessageBubbleProps {
  message: DirectMessage;
  conversation: Conversation;
  isOwn: boolean;
  language: string;
  onDelete: () => void;
  onHideForMe: () => void;
  onEdit?: (content: string) => void;
  onForward?: () => void;
  onReply?: () => void;
  formatTime: (date: string) => string;
  isSelectMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onCloseSidebar?: () => void;
}

function MessageBubble({ 
  message, 
  conversation,
  isOwn, 
  language, 
  onDelete, 
  onHideForMe,
  onEdit,
  onForward, 
  onReply,
  formatTime,
  isSelectMode,
  isSelected,
  onToggleSelect,
  onCloseSidebar
}: MessageBubbleProps) {
  const [showImageModal, setShowImageModal] = useState(false);
  const [decryptedImageUrl, setDecryptedImageUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const editInputRef = useRef<HTMLInputElement>(null);
  
  // Memoized renderContent function with access to isOwn and onCloseSidebar
  const renderContent = useCallback((decryptedContent: string) => {
    if (!decryptedContent || decryptedContent.startsWith('📷') || decryptedContent.startsWith('📎') || decryptedContent.startsWith('🎬')) {
      return null;
    }
    const { isShared, postUrl, textContent } = isSharedPostMessage(decryptedContent);
    
    // Debug logging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('DM Message Debug:', {
        decryptedContent,
        isShared,
        postUrl,
        textContent
      });
    }
    
    if (isShared && postUrl) {
      return (
        <div>
          <p className={cn(
            "text-xs mb-2",
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
          )}>
            {textContent}
          </p>
          <SharedPostPreview postUrl={postUrl} isOwn={isOwn} onCloseChatSidebar={onCloseSidebar} />
        </div>
      );
    }
    return (
      <p className="text-sm whitespace-pre-wrap break-words">
        {decryptedContent}
      </p>
    );
  }, [isOwn, onCloseSidebar, language]);
  
  const hasMedia = !!message.media_url;
  const isImage = message.media_type === 'image';
  const isVideo = message.media_type === 'video' || (message.media_url && /\.(mp4|webm|mov)$/i.test(message.media_url));
  const isVoice = message.media_type === 'voice';
  const isDeleted = message.is_deleted;
  const isEdited = !!message.edited_at;
  const canEdit = isOwn && !hasMedia && canEditMessage(message.created_at);

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  const handleEditSubmit = () => {
    if (editContent.trim() && editContent.trim() !== message.content) {
      onEdit(editContent.trim());
    }
    setIsEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEditSubmit();
    } else if (e.key === 'Escape') {
      setEditContent(message.content);
      setIsEditing(false);
    }
  };

  // Handle image click with decrypted URL
  const handleImageClick = (decryptedUrl: string) => {
    setDecryptedImageUrl(decryptedUrl);
    setShowImageModal(true);
  };

  return (
    <>
      <div
        className={cn(
          "flex group",
          isOwn ? "justify-end" : "justify-start"
        )}
      >
        {/* Checkbox for select mode */}
        {isSelectMode && (
          <div className={cn("flex items-center px-2", isOwn && "order-last")}>
            <Checkbox 
              checked={isSelected} 
              onCheckedChange={onToggleSelect}
            />
          </div>
        )}
        
        <div className={cn("flex flex-col gap-0.5 max-w-[80%]", isOwn && "items-end")}>
          {/* Message bubble */}
          <div className={cn("flex items-end gap-1", isOwn && "flex-row-reverse")}>
            <div
              className={cn(
                "rounded-2xl px-3 py-2",
                isOwn
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              {/* Reply Preview */}
              {message.reply_to_id && message.reply_content && (
                <ReplyPreview replyTo={message} isOwn={isOwn} />
              )}
              
              {!isDeleted && (
                <>
                  {/* Media */}
                  {hasMedia && (
                    <div className="mb-1.5 -mx-1 -mt-0.5">
                      <EncryptedMediaDisplay
                        mediaUrl={message.media_url!}
                        mediaType={isVoice ? 'voice' : isVideo ? 'video' : isImage ? 'image' : 'file'}
                        content={message.content}
                        conversation={conversation}
                        onImageClick={handleImageClick}
                      />
                    </div>
                  )}
                  
                  {/* Text */}
                  {isEditing ? (
                    <Input
                      ref={editInputRef}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      onBlur={handleEditSubmit}
                      className={cn(
                        "text-sm h-8",
                        isOwn ? "bg-primary-foreground/10 text-primary-foreground border-primary-foreground/30" : ""
                      )}
                    />
                  ) : (
                    <DecryptedMessageContent
                      message={message}
                      conversation={conversation}
                      renderContent={renderContent}
                    />
                  )}
                </>
              )}
            </div>

            {/* Message actions */}
            {!isDeleted && !isSelectMode && !isEditing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={language === 'ar' ? 'start' : 'end'} className="bg-popover">
                  <DropdownMenuItem onClick={onReply}>
                    <Reply className="h-4 w-4 me-2" />
                    {language === 'ar' ? 'رد' : 'Reply'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onForward}>
                    <Forward className="h-4 w-4 me-2" />
                    {language === 'ar' ? 'إعادة توجيه' : 'Forward'}
                  </DropdownMenuItem>
                  {canEdit && (
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Pencil className="h-4 w-4 me-2" />
                      {language === 'ar' ? 'تعديل' : 'Edit'}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onHideForMe}>
                    <EyeOff className="h-4 w-4 me-2" />
                    {language === 'ar' ? 'إخفاء' : 'Hide'}
                  </DropdownMenuItem>
                  {isOwn && (
                    <DropdownMenuItem 
                      onClick={onDelete}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 me-2" />
                      {language === 'ar' ? 'حذف' : 'Delete'}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Time and status - below bubble */}
          <div className={cn(
            "flex items-center gap-1 px-1",
            isOwn ? "justify-end" : "justify-start"
          )}>
            {isEdited && !isDeleted && (
              <span className="text-[10px] text-muted-foreground">
                {language === 'ar' ? 'معدّل' : 'Edited'}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground">
              {formatTime(message.created_at)}
            </span>
            {isOwn && !isDeleted && (
              <span className="text-muted-foreground">
                {message.read_at || message.is_read ? (
                  <CheckCheck className="h-3 w-3 text-primary" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
              </span>
            )}
          </div>

          {/* Reactions */}
          {!isDeleted && !isSelectMode && (
            <DMReactions messageId={message.id} isOwn={isOwn} />
          )}
        </div>
      </div>

      {/* Image Lightbox - now uses decrypted URL */}
      {showImageModal && decryptedImageUrl && (
        <div 
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 end-4 text-foreground hover:text-muted-foreground z-50"
          >
            <X className="h-8 w-8" />
          </button>
          <img
            src={decryptedImageUrl}
            alt=""
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <a
            href={decryptedImageUrl}
            download
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-4 end-4 flex items-center gap-2 bg-muted hover:bg-muted/80 px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="h-4 w-4" />
            {language === 'ar' ? 'تحميل' : 'Download'}
          </a>
        </div>
      )}
    </>
  );
}
