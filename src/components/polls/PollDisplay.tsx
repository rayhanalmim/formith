import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePoll, useVotePoll, useVotePollSingle } from '@/hooks/usePolls';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart2, Check, Users, Target, Clock, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { socketClient } from '@/lib/socket';
import { usePollCountdown } from '@/hooks/usePollCountdown';

import { PollAnalytics } from './PollAnalytics';

interface PollDisplayProps {
  postId: string;
  postOwnerId?: string;
}

export function PollDisplay({ postId, postOwnerId }: PollDisplayProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { data: poll, isLoading, refetch } = usePoll(postId);
  const votePoll = useVotePoll();
  const voteSingle = useVotePollSingle();
  
  // Local state for optimistic updates
  const [localVotes, setLocalVotes] = useState<string[]>([]);
  const [localCounts, setLocalCounts] = useState<Record<string, number>>({});

  // Live countdown timer - must be called before any conditional returns
  const countdown = usePollCountdown(poll?.ends_at ?? null);
  const isExpired = countdown?.isExpired ?? false;
  const hasExpiration = !!poll?.ends_at;

  useEffect(() => {
    if (poll) {
      setLocalVotes(poll.user_votes);
      const counts: Record<string, number> = {};
      poll.options.forEach(opt => {
        counts[opt.id] = opt.votes_count;
      });
      setLocalCounts(counts);
    }
  }, [poll]);

  // Subscribe to realtime updates via Socket.io
  useEffect(() => {
    if (!poll) return;
    
    // Subscribe to posts room which includes poll updates
    socketClient.subscribeToPosts();
    
    // Listen for post changes that might affect this poll
    const unsubscribe = socketClient.onPostChange((event) => {
      if (event.post?.id === postId || event.post?.poll_id === poll.id) {
        refetch();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [poll, postId, refetch]);

  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="mt-3 p-4 rounded-xl bg-muted/50 border border-border/50 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    );
  }

  // If no poll exists, don't render anything
  if (!poll) return null;

  const handleVote = async (optionId: string) => {
    if (!user || isExpired) return;
    
    const isVoted = localVotes.includes(optionId);
    
    if (poll.poll_type === 'single') {
      // Optimistic update for single choice
      const prevVotes = [...localVotes];
      setLocalVotes([optionId]);
      
      // Update counts optimistically
      const newCounts = { ...localCounts };
      prevVotes.forEach(v => {
        newCounts[v] = Math.max(0, (newCounts[v] || 0) - 1);
      });
      if (!prevVotes.includes(optionId)) {
        newCounts[optionId] = (newCounts[optionId] || 0) + 1;
      }
      setLocalCounts(newCounts);
      
      try {
        await voteSingle.mutateAsync({
          pollId: poll.id,
          optionId,
          previousVotes: prevVotes,
        });
      } catch (error) {
        // Revert on error
        setLocalVotes(prevVotes);
        refetch();
      }
    } else {
      // Optimistic update for multiple choice
      if (isVoted) {
        setLocalVotes(localVotes.filter(v => v !== optionId));
        setLocalCounts({
          ...localCounts,
          [optionId]: Math.max(0, (localCounts[optionId] || 0) - 1),
        });
      } else {
        setLocalVotes([...localVotes, optionId]);
        setLocalCounts({
          ...localCounts,
          [optionId]: (localCounts[optionId] || 0) + 1,
        });
      }
      
      try {
        await votePoll.mutateAsync({
          pollId: poll.id,
          optionId,
          isVoted,
        });
      } catch (error) {
        // Revert on error
        refetch();
      }
    }
  };

  const totalVotes = Object.values(localCounts).reduce((a, b) => a + b, 0);
  const hasVoted = localVotes.length > 0;

  return (
    <div className="mt-3 p-4 rounded-xl bg-muted/50 border border-border/50">
      {/* Poll Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">{poll.question}</span>
        </div>
        <Badge variant="secondary" className="text-[10px]">
          {poll.poll_type === 'single' 
            ? (language === 'ar' ? 'اختيار واحد' : 'Single') 
            : (language === 'ar' ? 'متعدد' : 'Multiple')}
        </Badge>
      </div>

      {/* Live Countdown Timer */}
      {hasExpiration && countdown && (
        <div className={cn(
          "flex items-center gap-2 text-xs px-3 py-2 rounded-lg mb-2",
          isExpired 
            ? "bg-destructive/10 text-destructive" 
            : countdown.timeRemaining < 3600000 // Less than 1 hour
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              : "bg-primary/10 text-primary"
        )}>
          <Timer className={cn(
            "h-4 w-4",
            !isExpired && countdown.timeRemaining < 60000 && "animate-pulse"
          )} />
          <span className="font-medium">
            {isExpired 
              ? (language === 'ar' ? countdown.formattedAr : countdown.formatted)
              : (language === 'ar' 
                  ? `⏳ متبقي: ${countdown.formattedAr}` 
                  : `⏳ Time left: ${countdown.formatted}`)
            }
          </span>
        </div>
      )}

      {/* Goal */}
      {poll.goal && (
        <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
          <Target className="h-3 w-3" />
          <span>{poll.goal}</span>
        </div>
      )}

      {/* Options */}
      <div className="space-y-2">
        {poll.options.map((option) => {
          const count = localCounts[option.id] || 0;
          const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const isSelected = localVotes.includes(option.id);

          return (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={!user || isExpired}
              className={cn(
                "w-full relative rounded-lg border p-3 text-left transition-all",
                "hover:border-primary/50 hover:bg-primary/5",
                isSelected && "border-primary bg-primary/10",
                (!user || isExpired) && "opacity-50 cursor-not-allowed"
              )}
            >
              {/* Background Progress */}
              {hasVoted && (
                <div 
                  className="absolute inset-0 rounded-lg bg-primary/10 transition-all"
                  style={{ width: `${percentage}%` }}
                />
              )}
              
              <div className="relative flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {option.emoji && <span className="text-lg">{option.emoji}</span>}
                  <span className="text-sm truncate">{option.text}</span>
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </div>
                {hasVoted && (
                  <span className="text-xs font-medium text-muted-foreground shrink-0">
                    {percentage}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3 w-3" />
          <span>
            {totalVotes} {language === 'ar' ? 'صوت' : totalVotes === 1 ? 'vote' : 'votes'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Analytics button - only for poll creator */}
          {user && postOwnerId === user.id && (
            <PollAnalytics pollId={poll.id} question={poll.question} />
          )}
          {!user && !isExpired && (
            <span className="text-xs text-muted-foreground">
              {language === 'ar' ? 'سجل دخولك للتصويت' : 'Login to vote'}
            </span>
          )}
          {isExpired && (
            <span className="text-xs text-destructive font-medium">
              {language === 'ar' ? 'انتهى' : 'Ended'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
