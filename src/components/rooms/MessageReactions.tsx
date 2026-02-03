import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  useMessageReactions, 
  useToggleReaction, 
  getReactionSummary,
  type ReactionSummary 
} from '@/hooks/useMessageReactions';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SmilePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Common emoji reactions
const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉'];
const ALL_EMOJIS = [
  '👍', '👎', '❤️', '💔', '😂', '😊', '😍', '🥰',
  '😮', '😢', '😡', '🤔', '🔥', '👏', '🎉', '✨',
  '💯', '🙏', '👀', '💪', '🤝', '👋', '🚀', '💡',
];

interface MessageReactionsProps {
  messageId: string;
  isOwn: boolean;
  roomId?: string;
}

export function MessageReactions({ messageId, isOwn, roomId }: MessageReactionsProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: reactions = [] } = useMessageReactions(messageId);
  const toggleReaction = useToggleReaction();
  
  const reactionSummary = getReactionSummary(reactions, user?.id);

  const handleReaction = async (emoji: string, hasReacted: boolean) => {
    if (!user) return;
    try {
      await toggleReaction.mutateAsync({ messageId, emoji, hasReacted, roomId });
      setIsOpen(false);
    } catch (error) {
      console.error('Reaction error:', error);
      toast.error(
        language === 'ar' 
          ? 'فشل في إضافة التفاعل. يرجى المحاولة مرة أخرى.' 
          : 'Failed to add reaction. Please try again.'
      );
    }
  };

  return (
    <div className={cn('flex items-center gap-1 mt-1', isOwn && 'flex-row-reverse')}>
      {/* Existing reactions */}
      <div className={cn('flex flex-wrap gap-1', isOwn && 'justify-end')}>
        {reactionSummary.map((reaction) => (
          <ReactionBadge
            key={reaction.emoji}
            reaction={reaction}
            onClick={() => handleReaction(reaction.emoji, reaction.hasReacted)}
            disabled={!user || toggleReaction.isPending}
          />
        ))}
      </div>

      {/* Add reaction button */}
      {user && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <SmilePlus className="h-4 w-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-2" 
            side={isOwn ? 'left' : 'right'}
            align="start"
          >
            <div className="space-y-2">
              {/* Quick reactions */}
              <div className="flex gap-1">
                {QUICK_EMOJIS.map((emoji) => {
                  const existing = reactionSummary.find(r => r.emoji === emoji);
                  return (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(emoji, existing?.hasReacted || false)}
                      className={cn(
                        'text-xl hover:scale-125 transition-transform p-1 rounded',
                        existing?.hasReacted && 'bg-primary/20'
                      )}
                      disabled={toggleReaction.isPending}
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>
              
              {/* All emojis */}
              <div className="border-t pt-2">
                <p className="text-xs text-muted-foreground mb-2">
                  {language === 'ar' ? 'المزيد' : 'More'}
                </p>
                <div className="grid grid-cols-8 gap-1">
                  {ALL_EMOJIS.filter(e => !QUICK_EMOJIS.includes(e)).map((emoji) => {
                    const existing = reactionSummary.find(r => r.emoji === emoji);
                    return (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(emoji, existing?.hasReacted || false)}
                        className={cn(
                          'text-lg hover:scale-125 transition-transform p-1 rounded',
                          existing?.hasReacted && 'bg-primary/20'
                        )}
                        disabled={toggleReaction.isPending}
                      >
                        {emoji}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

interface ReactionBadgeProps {
  reaction: ReactionSummary;
  onClick: () => void;
  disabled: boolean;
}

function ReactionBadge({ reaction, onClick, disabled }: ReactionBadgeProps) {
  const { language } = useLanguage();
  const userList = reaction.users.slice(0, 5).join(', ');
  const remaining = reaction.users.length - 5;
  const tooltipText = remaining > 0 
    ? `${userList} ${language === 'ar' ? `و ${remaining} آخرين` : `and ${remaining} more`}`
    : userList;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
              'bg-muted hover:bg-muted/80 transition-colors',
              reaction.hasReacted && 'bg-primary/20 ring-1 ring-primary/50'
            )}
          >
            <span>{reaction.emoji}</span>
            <span className="font-medium">{reaction.count}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
