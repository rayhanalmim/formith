/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMessages as useMessagesContext } from '@/contexts/MessagesContext';
import { useSendMessage, useStartConversation, Conversation } from '@/hooks/useMessages';
import { useCanMessageUser } from '@/hooks/useSettings';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Send, Loader2, Lock } from 'lucide-react';
import { getAvatarUrl } from '@/lib/default-images';

interface SendMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientUserId: string;
  recipientUsername: string | null;
  recipientDisplayName: string | null;
  recipientAvatarUrl: string | null;
}

export function SendMessageDialog({
  open,
  onOpenChange,
  recipientUserId,
  recipientUsername,
  recipientDisplayName,
  recipientAvatarUrl,
}: SendMessageDialogProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { openConversation } = useMessagesContext();
  const [message, setMessage] = useState('');
  
  const startConversation = useStartConversation();
  const sendMessage = useSendMessage();
  const { data: canMessageData, isLoading: checkingPermission } = useCanMessageUser(recipientUserId);
  
  const isSending = startConversation.isPending || sendMessage.isPending;
  const canMessage = canMessageData?.canMessage ?? true;
  const blockReason = canMessageData?.reason;
  
  const displayName = recipientDisplayName || recipientUsername || 'User';

  const getBlockMessage = () => {
    if (blockReason === 'nobody') {
      return language === 'ar' 
        ? 'هذا المستخدم لا يقبل الرسائل من أي شخص' 
        : 'This user does not accept messages from anyone';
    }
    if (blockReason === 'followers') {
      return language === 'ar' 
        ? 'هذا المستخدم يقبل الرسائل فقط من الأشخاص الذين يتابعهم' 
        : 'This user only accepts messages from people they follow';
    }
    return language === 'ar' ? 'لا يمكنك مراسلة هذا المستخدم' : 'You cannot message this user';
  };

  const handleSend = async () => {
    if (!message.trim() || !canMessage) return;
    
    try {
      console.log('[SendMessageDialog] Starting to send message to:', recipientUserId);
      
      // First, get or create conversation
      const conversationId = await startConversation.mutateAsync(recipientUserId);
      console.log('[SendMessageDialog] Got conversation ID:', conversationId);
      
      // Then send the message
      await sendMessage.mutateAsync({
        conversationId,
        content: message.trim(),
      });
      console.log('[SendMessageDialog] Message sent successfully');
      
      // Force immediate refetch of conversations for instant update
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
      await queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      await queryClient.invalidateQueries({ queryKey: ['unread-message-count'] });
      
      toast({
        title: language === 'ar' ? 'تم الإرسال' : 'Message Sent',
        description: language === 'ar' 
          ? `تم إرسال رسالتك إلى ${displayName}` 
          : `Your message was sent to ${displayName}`,
      });
      
      setMessage('');
      onOpenChange(false);
      
      // Create a conversation object to open in the messages sheet
      const newConversation: Conversation = {
        id: conversationId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
        is_pinned: false,
        pinned_at: null,
        other_user: {
          user_id: recipientUserId,
          username: recipientUsername,
          display_name: recipientDisplayName,
          display_name_ar: null,
          avatar_url: recipientAvatarUrl,
          is_verified: null,
        },
        last_message: {
          content: message.trim(),
          created_at: new Date().toISOString(),
          sender_id: '', // Will be current user
          is_read: false,
        },
        unread_count: 0,
      };
      
      // Open the conversation in the messages sheet
      openConversation(newConversation);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      
      // Parse error message for privacy-related errors
      let errorMessage = language === 'ar' ? 'فشل في إرسال الرسالة' : 'Failed to send message';
      
      if (error?.message?.includes('does not accept messages')) {
        errorMessage = language === 'ar' 
          ? 'هذا المستخدم لا يقبل الرسائل' 
          : 'This user does not accept messages';
      } else if (error?.message?.includes('only accepts messages from')) {
        errorMessage = language === 'ar' 
          ? 'هذا المستخدم يقبل الرسائل فقط من متابعيه' 
          : 'This user only accepts messages from their followers';
      }
      
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {language === 'ar' ? 'إرسال رسالة' : 'Send Message'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ar' ? 'أرسل رسالة خاصة إلى' : 'Send a private message to'}
          </DialogDescription>
        </DialogHeader>
        
        {/* Recipient Info */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <Avatar className="h-10 w-10">
            <AvatarImage src={getAvatarUrl(recipientAvatarUrl)} alt={displayName} />
            <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{displayName}</p>
            {recipientUsername && (
              <p className="text-sm text-muted-foreground truncate">@{recipientUsername}</p>
            )}
          </div>
        </div>
        
        {/* Privacy restriction message */}
        {!checkingPermission && !canMessage && (
          <Alert variant="destructive">
            <Lock className="h-4 w-4" />
            <AlertDescription>{getBlockMessage()}</AlertDescription>
          </Alert>
        )}
        
        {/* Message Input */}
        {canMessage && (
          <div className="space-y-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={language === 'ar' ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
              className="min-h-[120px] resize-none"
              disabled={isSending || checkingPermission}
            />
            <p className="text-xs text-muted-foreground">
              {language === 'ar' ? 'اضغط Enter للإرسال' : 'Press Enter to send'}
            </p>
          </div>
        )}
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          {canMessage && (
            <Button 
              onClick={handleSend} 
              disabled={!message.trim() || isSending || checkingPermission}
              className="gap-2"
            >
              {isSending || checkingPermission ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {language === 'ar' ? 'إرسال' : 'Send'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
