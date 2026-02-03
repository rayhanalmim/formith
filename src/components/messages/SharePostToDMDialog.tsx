import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSendMessage, useStartConversation, useConversations, Conversation } from '@/hooks/useMessages';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Send, Loader2, Search, MessageSquare, BadgeCheck, ExternalLink } from 'lucide-react';
import { getAvatarUrl } from '@/lib/default-images';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface PostData {
  id: string;
  content: string;
  slug?: string;
  profile?: {
    username?: string;
    display_name?: string;
    display_name_ar?: string;
    avatar_url?: string;
    is_verified?: boolean;
  };
  category?: {
    slug: string;
  };
  media?: Array<{
    media_url: string;
    media_type: string;
  }>;
}

interface SharePostToDMDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: PostData;
}

export function SharePostToDMDialog({
  open,
  onOpenChange,
  post,
}: SharePostToDMDialogProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  
  const startConversation = useStartConversation();
  const sendMessage = useSendMessage();
  const { data: conversations } = useConversations();

  // Search for users
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['user-search-dm', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim() || searchQuery.length < 2) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, display_name_ar, avatar_url, is_verified')
        .neq('user_id', user?.id)
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: searchQuery.length >= 2,
  });

  const postUrl = post.category?.slug 
    ? `${window.location.origin}/category/${post.category.slug}/post/${post.slug || post.id}` 
    : `${window.location.origin}/post/${post.slug || post.id}`;

  const handleShareToUser = async (userId: string, displayName: string) => {
    setSendingTo(userId);
    
    try {
      // Get or create conversation
      const conversationId = await startConversation.mutateAsync(userId);
      
      // Create message with post share format
      const shareMessage = `📤 ${language === 'ar' ? 'تمت مشاركة منشور:' : 'Shared a post:'}\n\n"${post.content.slice(0, 150)}${post.content.length > 150 ? '...' : ''}"\n\n🔗 ${postUrl}`;
      
      await sendMessage.mutateAsync({
        conversationId,
        content: shareMessage,
      });
      
      toast({
        title: language === 'ar' ? 'تم المشاركة!' : 'Shared!',
        description: language === 'ar' 
          ? `تم مشاركة المنشور مع ${displayName}` 
          : `Post shared with ${displayName}`,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to share post:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' 
          ? 'فشل في مشاركة المنشور' 
          : 'Failed to share post',
        variant: 'destructive',
      });
    } finally {
      setSendingTo(null);
    }
  };

  const displayName = (profile: any) => {
    return language === 'ar' 
      ? (profile?.display_name_ar || profile?.display_name || profile?.username || 'User')
      : (profile?.display_name || profile?.username || 'User');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            {language === 'ar' ? 'مشاركة في رسالة خاصة' : 'Share to Private Message'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ar' ? 'اختر شخص لمشاركة المنشور معه' : 'Choose someone to share this post with'}
          </DialogDescription>
        </DialogHeader>

        {/* Post Preview */}
        <div className="border border-border rounded-lg p-3 bg-muted/30">
          <div className="flex items-start gap-2 mb-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={getAvatarUrl(post.profile?.avatar_url)} />
              <AvatarFallback>{displayName(post.profile)?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-medium text-sm truncate">{displayName(post.profile)}</span>
                {post.profile?.is_verified && (
                  <BadgeCheck className="h-3.5 w-3.5 text-[#1D9BF0] flex-shrink-0" />
                )}
              </div>
              <span className="text-xs text-muted-foreground">@{post.profile?.username}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-3">{post.content}</p>
          {post.media && post.media.length > 0 && (
            <div className="mt-2 flex gap-1">
              {post.media.slice(0, 3).map((m, i) => (
                <img 
                  key={i}
                  src={m.media_url} 
                  alt="" 
                  className="h-12 w-12 rounded object-cover"
                />
              ))}
              {post.media.length > 3 && (
                <div className="h-12 w-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                  +{post.media.length - 3}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'ar' ? 'ابحث عن مستخدم...' : 'Search for a user...'}
            className="ps-9"
          />
        </div>

        <ScrollArea className="h-[250px]">
          <div className="space-y-1">
            {/* Search Results */}
            {searchQuery.length >= 2 && (
              <>
                {isSearching && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}
                {searchResults && searchResults.length > 0 && (
                  <>
                    <p className="text-xs text-muted-foreground px-2 py-1">
                      {language === 'ar' ? 'نتائج البحث' : 'Search Results'}
                    </p>
                    {searchResults.map((profile) => (
                      <button
                        key={profile.user_id}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                        onClick={() => handleShareToUser(profile.user_id, displayName(profile))}
                        disabled={sendingTo === profile.user_id}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={getAvatarUrl(profile.avatar_url)} />
                          <AvatarFallback>{displayName(profile)?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 text-start">
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-sm truncate">{displayName(profile)}</span>
                            {profile.is_verified && (
                              <BadgeCheck className="h-3.5 w-3.5 text-[#1D9BF0] flex-shrink-0" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">@{profile.username}</span>
                        </div>
                        {sendingTo === profile.user_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    ))}
                  </>
                )}
                {searchResults && searchResults.length === 0 && !isSearching && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    {language === 'ar' ? 'لم يتم العثور على نتائج' : 'No results found'}
                  </p>
                )}
              </>
            )}

            {/* Recent Conversations */}
            {(!searchQuery || searchQuery.length < 2) && (
              <>
                <p className="text-xs text-muted-foreground px-2 py-1">
                  {language === 'ar' ? 'المحادثات الأخيرة' : 'Recent Conversations'}
                </p>
                {conversations && conversations.length > 0 ? (
                  conversations.slice(0, 8).map((conversation) => {
                    const profile = conversation.other_user;
                    if (!profile) return null;
                    
                    return (
                      <button
                        key={conversation.id}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                        onClick={() => handleShareToUser(profile.user_id, displayName(profile))}
                        disabled={sendingTo === profile.user_id}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={getAvatarUrl(profile?.avatar_url)} />
                          <AvatarFallback>{displayName(profile)?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 text-start">
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-sm truncate">{displayName(profile)}</span>
                            {profile?.is_verified && (
                              <BadgeCheck className="h-3.5 w-3.5 text-[#1D9BF0] flex-shrink-0" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">@{profile?.username}</span>
                        </div>
                        {sendingTo === profile.user_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    {language === 'ar' ? 'ابحث عن مستخدم للمشاركة معه' : 'Search for a user to share with'}
                  </p>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
