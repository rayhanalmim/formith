import { useCallback, useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNewPostsCount } from '@/hooks/useRealtimePosts';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NewPostsButtonProps {
  onRefresh: () => Promise<void>;
  scrollToTop: () => void;
}

export function NewPostsButton({ onRefresh, scrollToTop }: NewPostsButtonProps) {
  const { language } = useLanguage();
  const { count, reset } = useNewPostsCount();
  const queryClient = useQueryClient();
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolledDown(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = useCallback(async () => {
    setIsRefreshing(true);
    
    // Invalidate queries to fetch latest posts
    await queryClient.invalidateQueries({ queryKey: ['infinite-posts'] });
    await onRefresh();
    
    // Reset counter and scroll to top
    reset();
    scrollToTop();
    setIsRefreshing(false);
  }, [onRefresh, reset, scrollToTop, queryClient]);

  // Only show if there are new posts AND user has scrolled down
  if (count === 0 || !isScrolledDown) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <Button
        onClick={handleClick}
        disabled={isRefreshing}
        className={cn(
          "rounded-full shadow-lg px-4 py-2 gap-2",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          "shadow-neon-primary hover:shadow-[0_0_20px_hsl(332_72%_44%/0.5)]",
          "transition-all duration-300"
        )}
        size="sm"
      >
        <ArrowUp className="h-4 w-4" />
        {language === 'ar' 
          ? `${count} منشور${count > 1 ? 'ات' : ''} جديد${count > 1 ? 'ة' : ''}`
          : `${count} new post${count > 1 ? 's' : ''}`
        }
      </Button>
    </div>
  );
}
