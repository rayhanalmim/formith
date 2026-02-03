import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMessageReads } from '@/hooks/useRoomReadReceipts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CheckCheck, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageReadReceiptsProps {
  messageId: string;
  isOwn: boolean;
}

export function MessageReadReceipts({ messageId, isOwn }: MessageReadReceiptsProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { data: reads } = useMessageReads(messageId);

  // Filter out the current user's read
  const otherReads = reads?.filter(r => r.user_id !== user?.id) || [];

  if (otherReads.length === 0) {
    return null;
  }

  // Show max 3 avatars
  const displayReads = otherReads.slice(0, 3);
  const remainingCount = otherReads.length - 3;

  const allNames = otherReads
    .map(r => r.profile?.display_name || r.profile?.username || 'User')
    .join(', ');

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            'flex items-center gap-1 mt-1',
            isOwn ? 'justify-end' : 'justify-start'
          )}>
            <div className="flex -space-x-1.5">
              {displayReads.map((read) => (
                <Avatar key={read.id} className="h-4 w-4 border border-background">
                  <AvatarImage src={read.profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-[8px] bg-muted">
                    {(read.profile?.display_name || read.profile?.username || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {remainingCount > 0 && (
                <div className="h-4 w-4 rounded-full bg-muted border border-background flex items-center justify-center">
                  <span className="text-[8px] text-muted-foreground">+{remainingCount}</span>
                </div>
              )}
            </div>
            <Eye className="h-3 w-3 text-muted-foreground" />
          </div>
        </TooltipTrigger>
        <TooltipContent side={isOwn ? 'left' : 'right'} className="max-w-[200px]">
          <p className="text-xs">
            {language === 'ar' ? 'شوهد بواسطة: ' : 'Seen by: '}
            {allNames}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
