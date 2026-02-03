import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useConversations, useDeleteConversation, usePinConversation, useStartConversation, Conversation } from '@/hooks/useMessages';
import { useUserStatus } from '@/hooks/useUserStatus';
import { useCurrentUserProfile, useFollowers, useFollowing } from '@/hooks/useProfile';
import { useConversationTypingIndicators } from '@/hooks/useConversationTypingIndicators';
import { useOnlinePresence } from '@/hooks/useOnlinePresence';
import { useMessages as useMessagesContext } from '@/contexts/MessagesContext';
import { isEncryptedMessage } from '@/lib/encryption';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusIndicator, UserStatus } from '@/components/ui/status-selector';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
import { BadgeCheck, Check, CheckCheck, Loader2, MessageCircle, MoreHorizontal, Pin, PinOff, Search, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAvatarUrl } from '@/lib/default-images';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { doClient } from '@/lib/do-client';

interface CircleUser {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_online: boolean;
}

interface ConversationListProps {
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
}

export function ConversationList({ selectedId, onSelect }: ConversationListProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { data: conversations, isLoading } = useConversations();
  const { data: currentUserProfile } = useCurrentUserProfile();
  const { openConversation } = useMessagesContext();
  const deleteConversation = useDeleteConversation();
  const pinConversation = usePinConversation();
  const startConversation = useStartConversation();
  const { onlineUsers, isUserOnline } = useOnlinePresence();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [startingChatWith, setStartingChatWith] = useState<string | null>(null);
  
  // Fetch followers and following
  const { data: followers } = useFollowers(user?.id || '');
  const { data: following } = useFollowing(user?.id || '');
  
  // Collect all user IDs for status fetching (conversation users + circle users)
  const allUserIds = useMemo(() => {
    const ids = new Set<string>();
    conversations?.forEach(c => {
      if (c.other_user.user_id) ids.add(c.other_user.user_id);
    });
    // Add circle user IDs from online/followers/following
    onlineUsers.forEach(u => {
      if (u.user_id !== user?.id) ids.add(u.user_id);
    });
    [...(followers || []), ...(following || [])].forEach((p: any) => {
      if (p.user_id && p.user_id !== user?.id) ids.add(p.user_id);
    });
    return Array.from(ids);
  }, [conversations, onlineUsers, followers, following, user?.id]);
  
  const { getStatus } = useUserStatus(allUserIds);

  // Fetch last_seen_at for all users
  const { data: lastSeenData } = useQuery({
    queryKey: ['last-seen', allUserIds.sort().join(',')],
    queryFn: async (): Promise<Record<string, string | null>> => {
      if (allUserIds.length === 0) return {};
      const profiles = await doClient.from('profiles')
        .in('user_id', allUserIds)
        .select('user_id, last_seen_at');
      
      const result: Record<string, string | null> = {};
      (profiles || []).forEach((p: any) => {
        result[p.user_id] = p.last_seen_at;
      });
      return result;
    },
    enabled: allUserIds.length > 0,
    staleTime: 60000, // 1 minute
  });

  const getLastSeen = (userId: string): string => {
    const status = getStatus(userId);
    if (status === 'online') {
      return language === 'ar' ? 'متصل الآن' : 'Online now';
    }
    if (status === 'busy') {
      return language === 'ar' ? 'مشغول' : 'Busy';
    }
    
    const lastSeen = lastSeenData?.[userId];
    if (!lastSeen) {
      return language === 'ar' ? 'غير متصل' : 'Offline';
    }
    
    const date = new Date(lastSeen);
    if (isNaN(date.getTime())) {
      return language === 'ar' ? 'غير متصل' : 'Offline';
    }
    
    const timeAgo = formatDistanceToNow(date, { 
      addSuffix: true, 
      locale: language === 'ar' ? ar : enUS 
    });
    return language === 'ar' ? `آخر ظهور ${timeAgo}` : `Last seen ${timeAgo}`;
  };

  const conversationIds = useMemo(() => 
    conversations?.map(c => c.id) || [], 
    [conversations]
  );
  const { isTypingInConversation } = useConversationTypingIndicators(conversationIds);

  // Combine online users, followers, and following into circle users
  const circleUsers = useMemo((): CircleUser[] => {
    const seen = new Set<string>();
    const result: CircleUser[] = [];
    
    // First add online users (priority)
    onlineUsers.forEach(u => {
      if (u.user_id !== user?.id && !seen.has(u.user_id)) {
        seen.add(u.user_id);
        result.push({
          user_id: u.user_id,
          username: u.username,
          display_name: u.display_name,
          avatar_url: u.avatar_url,
          is_online: true,
        });
      }
    });
    
    // Then add followers/following who are online
    const allConnections = [...(followers || []), ...(following || [])];
    allConnections.forEach((profile: any) => {
      if (profile.user_id !== user?.id && !seen.has(profile.user_id)) {
        seen.add(profile.user_id);
        result.push({
          user_id: profile.user_id,
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          is_online: isUserOnline(profile.user_id),
        });
      }
    });
    
    // Sort: online users first, then alphabetically
    return result.sort((a, b) => {
      if (a.is_online && !b.is_online) return -1;
      if (!a.is_online && b.is_online) return 1;
      const nameA = a.display_name || a.username || '';
      const nameB = b.display_name || b.username || '';
      return nameA.localeCompare(nameB);
    }).slice(0, 20); // Limit to 20 users
  }, [onlineUsers, followers, following, user?.id, isUserOnline]);

  // Handle clicking on a circle user to start/open a chat
  const handleCircleUserClick = async (circleUser: CircleUser) => {
    // Check if we already have a conversation with this user
    const existingConversation = conversations?.find(
      c => c.other_user.user_id === circleUser.user_id
    );

    if (existingConversation) {
      onSelect(existingConversation);
      return;
    }

    // Start a new conversation
    setStartingChatWith(circleUser.user_id);
    try {
      const conversationId = await startConversation.mutateAsync(circleUser.user_id);
      
      // Create a conversation object to select
      const newConversation: Conversation = {
        id: conversationId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_message_at: null,
        is_pinned: false,
        pinned_at: null,
        other_user: {
          user_id: circleUser.user_id,
          username: circleUser.username,
          display_name: circleUser.display_name,
          display_name_ar: null,
          avatar_url: circleUser.avatar_url,
          is_verified: null,
        },
        unread_count: 0,
      };
      
      onSelect(newConversation);
    } catch (error) {
      console.error('Failed to start conversation:', error);
    } finally {
      setStartingChatWith(null);
    }
  };

  // Filter conversations by search
  const filteredConversations = useMemo(() => {
    if (!conversations) return [];
    if (!searchQuery.trim()) return conversations;
    
    const query = searchQuery.toLowerCase();
    return conversations.filter(c => {
      const name = c.other_user.display_name?.toLowerCase() || '';
      const nameAr = c.other_user.display_name_ar?.toLowerCase() || '';
      const username = c.other_user.username?.toLowerCase() || '';
      return name.includes(query) || nameAr.includes(query) || username.includes(query);
    });
  }, [conversations, searchQuery]);

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await deleteConversation.mutateAsync(conversationId);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Instagram-style Header - No + button */}
      <div className="px-4 py-3 border-b border-border">
        <h1 className="text-xl font-bold">
          {language === 'ar' ? 'الرسائل' : 'Chats'}
        </h1>
      </div>

      {/* Online & Connections Row - Instagram Stories Style */}
      {circleUsers.length > 0 && (
        <div className="border-b border-border">
          <div className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-hide">
            <TooltipProvider delayDuration={300}>
              {circleUsers.map((circleUser) => {
                const displayName = circleUser.display_name || circleUser.username || '?';
                const isStarting = startingChatWith === circleUser.user_id;
                const status = getStatus(circleUser.user_id);
                
                // Determine ring color based on status
                const getRingClass = () => {
                  if (status === 'online') return "bg-gradient-to-tr from-success to-success/80";
                  if (status === 'busy') return "bg-gradient-to-tr from-warning to-warning/80";
                  return "bg-muted-foreground/30";
                };
                
                return (
                  <Tooltip key={circleUser.user_id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleCircleUserClick(circleUser)}
                        disabled={isStarting}
                        className="flex flex-col items-center gap-1 min-w-[64px] group flex-shrink-0"
                      >
                        <div className="relative">
                          {/* Ring - colored based on status */}
                          <div className={cn(
                            "absolute -inset-[3px] rounded-full",
                            getRingClass()
                          )} />
                          <Avatar className="h-14 w-14 border-[3px] border-background relative">
                            <AvatarImage
                              src={getAvatarUrl(circleUser.avatar_url)}
                              alt={displayName}
                            />
                            <AvatarFallback className="text-sm bg-muted">
                              {displayName[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {isStarting && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full">
                              <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            </div>
                          )}
                          {/* Status indicator */}
                          <StatusIndicator 
                            status={status} 
                            size="md" 
                            className="absolute -bottom-0.5 -right-0.5" 
                          />
                        </div>
                        <span className="text-[11px] text-muted-foreground truncate max-w-[64px] group-hover:text-foreground transition-colors">
                          {displayName.split(' ')[0]}
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      <p className="font-medium">{displayName}</p>
                      <p className="text-muted-foreground">{getLastSeen(circleUser.user_id)}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="px-4 py-2">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'ar' ? 'بحث' : 'Search'}
            className="ps-9 bg-muted/50 border-0 h-9 rounded-xl"
          />
        </div>
      </div>

      {/* Conversations List */}
      {!filteredConversations || filteredConversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center p-8">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <MessageCircle className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-1">
            {searchQuery 
              ? (language === 'ar' ? 'لا توجد نتائج' : 'No results')
              : (language === 'ar' ? 'لا توجد رسائل' : 'No Messages')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery 
              ? (language === 'ar' ? 'جرب البحث بكلمات أخرى' : 'Try searching for something else')
              : (language === 'ar' ? 'ابدأ محادثة من صفحة الملف الشخصي' : 'Start a conversation from a profile page')}
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <TooltipProvider delayDuration={500}>
            {filteredConversations.map((conversation) => {
            const displayName = language === 'ar'
              ? (conversation.other_user.display_name_ar || conversation.other_user.display_name)
              : conversation.other_user.display_name;
            const userStatus = getStatus(conversation.other_user.user_id);
            const isTyping = isTypingInConversation(conversation.id);

            // Get message preview
            let messagePreview = '';
            if (isTyping) {
              messagePreview = language === 'ar' ? 'يكتب...' : 'Typing...';
            } else if (conversation.last_message?.content) {
              if (isEncryptedMessage(conversation.last_message.content)) {
                messagePreview = language === 'ar' ? '🔒 رسالة' : '🔒 Message';
              } else {
                messagePreview = conversation.last_message.content;
              }
            }

            // Format time
            const timestamp = conversation.last_message?.created_at || conversation.updated_at;
            let timeStr = '';
            if (timestamp) {
              const date = new Date(timestamp);
              if (!isNaN(date.getTime())) {
                const now = new Date();
                const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays === 0) {
                  timeStr = date.toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true
                  });
                } else if (diffDays < 7) {
                  timeStr = date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short' });
                } else {
                  timeStr = date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  });
                }
              }
            }

            return (
              <div
                key={conversation.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer group",
                  selectedId === conversation.id && "bg-muted/50"
                )}
                onClick={() => onSelect(conversation)}
              >
                {/* Avatar with status and tooltip */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-14 w-14">
                        <AvatarImage
                          src={getAvatarUrl(conversation.other_user.avatar_url)}
                          alt={displayName || ''}
                        />
                        <AvatarFallback className="text-lg">
                          {(displayName || conversation.other_user.username || '?')[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <StatusIndicator status={userStatus} size="md" className="-bottom-0.5 -right-0.5" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    <p className="text-muted-foreground">{getLastSeen(conversation.other_user.user_id)}</p>
                  </TooltipContent>
                </Tooltip>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 min-w-0">
                      {conversation.is_pinned && (
                        <Pin className="h-3 w-3 text-primary flex-shrink-0" />
                      )}
                      <span className={cn(
                        "font-semibold truncate",
                        conversation.unread_count > 0 && "text-foreground"
                      )}>
                        {displayName || conversation.other_user.username}
                      </span>
                      {conversation.other_user.is_verified && (
                        <BadgeCheck className="h-4 w-4 verified-badge flex-shrink-0" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {timeStr}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <div className="flex items-center gap-1 min-w-0">
                      {/* Read receipt for sent messages */}
                      {conversation.last_message?.sender_id === user?.id && (
                        <span className="flex-shrink-0">
                          {conversation.last_message.is_read ? (
                            <CheckCheck className="h-4 w-4 text-primary" />
                          ) : (
                            <Check className="h-4 w-4 text-muted-foreground" />
                          )}
                        </span>
                      )}
                      <p className={cn(
                        "text-sm truncate",
                        isTyping && "text-primary font-medium",
                        conversation.unread_count > 0 && !isTyping
                          ? "text-foreground font-medium" 
                          : "text-muted-foreground"
                      )}>
                        {messagePreview || (language === 'ar' ? 'بدء محادثة' : 'Start chatting')}
                      </p>
                    </div>
                    
                    {/* Unread badge */}
                    {conversation.unread_count > 0 && (
                      <span className="flex-shrink-0 h-5 min-w-[20px] px-1.5 flex items-center justify-center text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                        {conversation.unread_count}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={language === 'ar' ? 'start' : 'end'} className="bg-popover">
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        pinConversation.mutate({
                          conversationId: conversation.id,
                          isPinned: !conversation.is_pinned,
                        });
                      }}
                    >
                      {conversation.is_pinned ? (
                        <>
                          <PinOff className="h-4 w-4 me-2" />
                          {language === 'ar' ? 'إلغاء التثبيت' : 'Unpin'}
                        </>
                      ) : (
                        <>
                          <Pin className="h-4 w-4 me-2" />
                          {language === 'ar' ? 'تثبيت' : 'Pin'}
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(conversation.id);
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 me-2" />
                      {language === 'ar' ? 'حذف' : 'Delete'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
          </TooltipProvider>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ar' ? 'حذف المحادثة' : 'Delete Conversation'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar'
                ? 'هل أنت متأكد أنك تريد حذف هذه المحادثة؟'
                : 'Are you sure you want to delete this conversation?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDeleteConversation(deleteConfirm)}
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
