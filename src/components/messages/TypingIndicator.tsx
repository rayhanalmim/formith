import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  username?: string;
  className?: string;
}

export function TypingIndicator({ username, className }: TypingIndicatorProps) {
  const { language } = useLanguage();

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 animate-fade-in",
      className
    )}>
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
        </div>
      </div>
      <span className="text-sm text-muted-foreground">
        {language === 'ar' 
          ? `${username || 'المستخدم'} يكتب...`
          : `${username || 'User'} is typing...`}
      </span>
    </div>
  );
}
