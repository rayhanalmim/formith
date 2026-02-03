import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { doClient } from '@/lib/do-client';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { SmilePlus } from 'lucide-react';
import { cn } from '@/lib/utils';

const QUICK_EMOJIS = ['👍', '❤️', '😂'];

interface SharedPostReactionsProps {
  messageId: string;
  isOwn: boolean;
}

interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

interface ReactionSummary {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

export function SharedPostReactions({ messageId, isOwn }: SharedPostReactionsProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch reactions for this message from DO
  const { data: reactions = [] } = useQuery({
    queryKey: ['dm-reactions', messageId],
    queryFn: async (): Promise<Reaction[]> => {
      const data = await doClient.from('dm_reactions')
        .eq('message_id', messageId)
        .select('id, message_id, user_id, emoji, created_at');
      
      return data || [];
    },
    enabled: !!messageId,
  });

  // Toggle reaction mutation
  const toggleReaction = useMutation({
    mutationFn: async ({ emoji, hasReacted }: { emoji: string; hasReacted: boolean }) => {
      if (!user) throw new Error('Not authenticated');

      if (hasReacted) {
        // Remove reaction - find and delete
        const existing = await doClient.from('dm_reactions')
          .eq('message_id', messageId)
          .eq('user_id', user.id)
          .eq('emoji', emoji)
          .select('id');

        if (existing && existing.length > 0) {
          await doClient.from('dm_reactions')
            .eq('id', existing[0].id)
            .delete();
        }
      } else {
        // Add reaction - check if exists first
        const existing = await doClient.from('dm_reactions')
          .eq('message_id', messageId)
          .eq('user_id', user.id)
          .eq('emoji', emoji)
          .select('id');

        if (!existing || existing.length === 0) {
          await doClient.from('dm_reactions').insert({
            message_id: messageId,
            user_id: user.id,
            emoji,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dm-reactions', messageId] });
    },
  });

  // Calculate reaction summary
  const reactionSummary: ReactionSummary[] = QUICK_EMOJIS.map(emoji => {
    const emojiReactions = reactions.filter(r => r.emoji === emoji);
    return {
      emoji,
      count: emojiReactions.length,
      hasReacted: emojiReactions.some(r => r.user_id === user?.id),
    };
  }).filter(r => r.count > 0);

  const handleReaction = async (emoji: string, hasReacted: boolean) => {
    if (!user) return;
    await toggleReaction.mutateAsync({ emoji, hasReacted });
    setIsOpen(false);
  };

  return (
    <div 
      className={cn(
        'flex items-center gap-1.5 mt-2 pt-2 border-t',
        isOwn ? 'border-primary-foreground/20 justify-end' : 'border-border/30'
      )}
      onClick={(e) => e.preventDefault()}
    >
      {/* Display existing reactions */}
      {reactionSummary.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleReaction(reaction.emoji, reaction.hasReacted);
          }}
          disabled={!user || toggleReaction.isPending}
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors',
            isOwn 
              ? 'bg-primary-foreground/20 hover:bg-primary-foreground/30' 
              : 'bg-muted hover:bg-muted/80',
            reaction.hasReacted && 'ring-1 ring-primary/50'
          )}
        >
          <span>{reaction.emoji}</span>
          <span className="font-medium">{reaction.count}</span>
        </button>
      ))}

      {/* Quick reaction buttons */}
      {user && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-6 px-2 text-xs gap-1',
                isOwn ? 'text-primary-foreground/70 hover:text-primary-foreground' : 'text-muted-foreground'
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <SmilePlus className="h-3.5 w-3.5" />
              {language === 'ar' ? 'تفاعل' : 'React'}
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-2 bg-popover" 
            side={isOwn ? 'left' : 'right'}
            align="center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex gap-1">
              {QUICK_EMOJIS.map((emoji) => {
                const existing = reactionSummary.find(r => r.emoji === emoji);
                return (
                  <button
                    key={emoji}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleReaction(emoji, existing?.hasReacted || false);
                    }}
                    className={cn(
                      'text-xl hover:scale-125 transition-transform p-1.5 rounded',
                      existing?.hasReacted && 'bg-primary/20'
                    )}
                    disabled={toggleReaction.isPending}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
