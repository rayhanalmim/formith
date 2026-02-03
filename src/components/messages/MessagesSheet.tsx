import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMessages as useMessagesContext } from '@/contexts/MessagesContext';
import { useMarkMessagesAsRead } from '@/hooks/useMessages';
import { useAuth } from '@/contexts/AuthContext';
import { ConversationList } from './ConversationList';
import { ChatView } from './ChatView';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { cn } from '@/lib/utils';

interface MessagesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MessagesSheet({ open, onOpenChange }: MessagesSheetProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { selectedConversation, selectConversation } = useMessagesContext();
  const markAsRead = useMarkMessagesAsRead();
  const queryClient = useQueryClient();

  const handleBack = () => {
    // Force refetch conversations to ensure unread counts are accurate
    queryClient.refetchQueries({ queryKey: ['conversations', user?.id] });
    queryClient.refetchQueries({ queryKey: ['unread-message-count', user?.id] });
    selectConversation(null);
  };

  const handleClose = () => {
    // Mark current conversation as read before closing
    if (selectedConversation?.id) {
      markAsRead.mutate(selectedConversation.id);
    }
    
    onOpenChange(false);
    // Reset selection after close animation
    setTimeout(() => selectConversation(null), 300);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent 
        side={language === 'ar' ? 'left' : 'right'} 
        className="w-full sm:max-w-md p-0 flex flex-col bg-background"
        hideClose={true}
      >
        {/* Accessibility: Hidden title for screen readers */}
        <VisuallyHidden>
          <SheetTitle>{language === 'ar' ? 'الرسائل' : 'Messages'}</SheetTitle>
          <SheetDescription>{language === 'ar' ? 'محادثاتك الخاصة' : 'Your private conversations'}</SheetDescription>
        </VisuallyHidden>
        
        {/* Instagram-style: Full-screen views that slide */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Conversation list - full width, slides out when chat opens */}
          <div
            className={cn(
              "absolute inset-0 transition-transform duration-300 ease-out",
              selectedConversation 
                ? (language === 'ar' ? "translate-x-full" : "-translate-x-full") 
                : "translate-x-0"
            )}
          >
            <ConversationList
              selectedId={selectedConversation?.id || null}
              onSelect={selectConversation}
            />
          </div>

          {/* Chat view - slides in from right */}
          <div
            className={cn(
              "absolute inset-0 transition-transform duration-300 ease-out",
              selectedConversation 
                ? "translate-x-0" 
                : (language === 'ar' ? "-translate-x-full" : "translate-x-full")
            )}
          >
            <ChatView
              conversation={selectedConversation}
              onBack={handleBack}
              onClose={handleClose}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
