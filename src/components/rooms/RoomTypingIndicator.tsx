import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface RoomTypingIndicatorProps {
  typingUsers: { user_id: string; username: string }[];
  className?: string;
}

export function RoomTypingIndicator({ typingUsers, className }: RoomTypingIndicatorProps) {
  const { language } = useLanguage();

  if (typingUsers.length === 0) return null;

  const names = typingUsers.map(u => u.username).slice(0, 3);
  let text = '';

  if (language === 'ar') {
    if (names.length === 1) {
      text = `${names[0]} يكتب...`;
    } else if (names.length === 2) {
      text = `${names[0]} و ${names[1]} يكتبان...`;
    } else {
      text = `${names[0]} و ${names.length - 1} آخرين يكتبون...`;
    }
  } else {
    if (names.length === 1) {
      text = `${names[0]} is typing...`;
    } else if (names.length === 2) {
      text = `${names[0]} and ${names[1]} are typing...`;
    } else {
      text = `${names[0]} and ${names.length - 1} others are typing...`;
    }
  }

  return (
    <div className={cn("flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground", className)}>
      <div className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" />
      </div>
      <span>{text}</span>
    </div>
  );
}