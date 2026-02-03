import { useLanguage } from '@/contexts/LanguageContext';
import { useMutualFollowersCount } from '@/hooks/useMutualFollowers';
import { Users } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MutualFollowersBadgeProps {
  targetUserId: string;
}

export function MutualFollowersBadge({ targetUserId }: MutualFollowersBadgeProps) {
  const { language } = useLanguage();
  const { data, isLoading } = useMutualFollowersCount(targetUserId);

  if (isLoading || !data || data.count === 0) {
    return null;
  }

  const { count, samples } = data;

  const getTooltipContent = () => {
    if (samples.length === 0) return '';
    
    const names = samples.map(s => s.display_name || s.username || '').filter(Boolean);
    
    if (count === 1) {
      return language === 'ar' 
        ? `يتابعه ${names[0]}`
        : `Followed by ${names[0]}`;
    }
    
    if (count === 2) {
      return language === 'ar'
        ? `يتابعه ${names.join(' و ')}`
        : `Followed by ${names.join(' and ')}`;
    }
    
    const othersCount = count - names.length;
    if (othersCount > 0) {
      return language === 'ar'
        ? `يتابعه ${names.slice(0, 2).join('، ')} و ${othersCount} آخرين`
        : `Followed by ${names.slice(0, 2).join(', ')} and ${othersCount} others`;
    }
    
    return language === 'ar'
      ? `يتابعه ${names.join('، ')}`
      : `Followed by ${names.join(', ')}`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5 cursor-help">
            <div className="flex -space-x-1.5">
              {samples.slice(0, 3).map((follower) => (
                <img
                  key={follower.user_id}
                  src={follower.avatar_url || '/images/default-avatar.png'}
                  alt=""
                  className="w-4 h-4 rounded-full border border-background object-cover"
                />
              ))}
            </div>
            <span className="flex items-center gap-0.5">
              <Users className="h-3 w-3" />
              {count}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[200px] text-center">
          <p className="text-xs">{getTooltipContent()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
