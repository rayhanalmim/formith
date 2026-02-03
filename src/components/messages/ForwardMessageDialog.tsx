import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useConversations, useSendMessage, useStartConversation, DirectMessage } from '@/hooks/useMessages';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { BadgeCheck, Loader2, Search, Forward, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAvatarUrl } from '@/lib/default-images';
import { toast } from 'sonner';

interface ForwardMessageDialogProps {
  message: DirectMessage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForwardMessageDialog({ message, open, onOpenChange }: ForwardMessageDialogProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isForwarding, setIsForwarding] = useState(false);

  const { data: conversations, isLoading } = useConversations();
  const sendMessage = useSendMessage();

  const filteredConversations = conversations?.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const name = conv.other_user.display_name || conv.other_user.username || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleForward = async () => {
    if (!message || !selectedConversationId || !user) return;

    setIsForwarding(true);
    try {
      // Forward the message content and media
      await sendMessage.mutateAsync({
        conversationId: selectedConversationId,
        content: message.content || '',
        mediaUrl: message.media_url || undefined,
        mediaType: message.media_type || undefined,
      });

      toast.success(language === 'ar' ? 'تم إعادة توجيه الرسالة' : 'Message forwarded');
      onOpenChange(false);
      setSelectedConversationId(null);
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to forward message:', error);
      toast.error(language === 'ar' ? 'فشل إعادة توجيه الرسالة' : 'Failed to forward message');
    } finally {
      setIsForwarding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Forward className="h-5 w-5" />
            {language === 'ar' ? 'إعادة توجيه الرسالة' : 'Forward Message'}
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={language === 'ar' ? 'البحث عن محادثة...' : 'Search conversations...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9"
          />
        </div>

        {/* Conversation List */}
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredConversations?.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {language === 'ar' ? 'لا توجد محادثات' : 'No conversations found'}
            </div>
          ) : (
            <div className="space-y-1 p-1">
              {filteredConversations?.map((conv) => {
                const displayName = language === 'ar'
                  ? (conv.other_user.display_name_ar || conv.other_user.display_name)
                  : conv.other_user.display_name;

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversationId(conv.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-start",
                      selectedConversationId === conv.id 
                        ? "bg-primary/10 border border-primary" 
                        : "hover:bg-muted/50"
                    )}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={getAvatarUrl(conv.other_user.avatar_url)}
                        alt={displayName || ''}
                      />
                      <AvatarFallback>
                        {(displayName || conv.other_user.username || '?')[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-medium truncate">
                          {displayName || conv.other_user.username}
                        </span>
                        {conv.other_user.is_verified && (
                          <BadgeCheck className="h-3.5 w-3.5 verified-badge flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        @{conv.other_user.username}
                      </p>
                    </div>
                    {selectedConversationId === conv.id && (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Message Preview */}
        {message && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">
              {language === 'ar' ? 'الرسالة:' : 'Message:'}
            </p>
            <p className="text-sm truncate">
              {message.media_url && !message.content 
                ? (message.media_type === 'image' ? '📷 Image' : '📎 File')
                : message.content
              }
            </p>
          </div>
        )}

        {/* Forward Button */}
        <Button
          onClick={handleForward}
          disabled={!selectedConversationId || isForwarding}
          className="w-full"
        >
          {isForwarding ? (
            <Loader2 className="h-4 w-4 animate-spin me-2" />
          ) : (
            <Forward className="h-4 w-4 me-2" />
          )}
          {language === 'ar' ? 'إعادة توجيه' : 'Forward'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
