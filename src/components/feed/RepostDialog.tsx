import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateRepost, type Post } from '@/hooks/usePosts';
import { MentionInput } from '@/components/ui/mention-input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BadgeCheck, Repeat2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface RepostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post;
  onRepostSuccess?: () => void;
}

export function RepostDialog({ open, onOpenChange, post, onRepostSuccess }: RepostDialogProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const createRepost = useCreateRepost();
  
  const [quoteContent, setQuoteContent] = useState('');
  const [mode, setMode] = useState<'repost' | 'quote'>('repost');

  const profile = post.profile;
  const displayName = language === 'ar' 
    ? (profile?.display_name_ar || profile?.display_name || profile?.username || 'مستخدم')
    : (profile?.display_name || profile?.username || 'User');

  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: language === 'ar' ? ar : enUS
  });

  const handleRepost = async () => {
    if (!user) {
      toast({
        title: language === 'ar' ? 'يجب تسجيل الدخول' : 'Login required',
        description: language === 'ar' ? 'سجل دخولك لإعادة النشر' : 'Login to repost',
        variant: 'destructive'
      });
      navigate('/auth');
      return;
    }

    try {
      await createRepost.mutateAsync({
        originalPostId: post.id,
        quoteContent: mode === 'quote' ? quoteContent.trim() : undefined,
        categoryId: post.category_id || undefined,
      });

      toast({
        title: language === 'ar' ? 'تم إعادة النشر' : 'Reposted!',
        description: mode === 'quote' 
          ? (language === 'ar' ? 'تمت إضافة اقتباسك' : 'Your quote has been added')
          : (language === 'ar' ? 'تم إعادة نشر المنشور' : 'Post has been reposted'),
      });

      setQuoteContent('');
      setMode('repost');
      onOpenChange(false);
      onRepostSuccess?.();
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: String(error),
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat2 className="h-5 w-5 text-primary" />
            {language === 'ar' ? 'إعادة النشر' : 'Repost'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <Button
              variant={mode === 'repost' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setMode('repost')}
            >
              {language === 'ar' ? 'إعادة نشر' : 'Repost'}
            </Button>
            <Button
              variant={mode === 'quote' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setMode('quote')}
            >
              {language === 'ar' ? 'اقتباس' : 'Quote'}
            </Button>
          </div>

          {/* Quote Input */}
          {mode === 'quote' && (
            <MentionInput
              value={quoteContent}
              onChange={setQuoteContent}
              placeholder={language === 'ar' ? 'أضف تعليقك...' : 'Add your comment...'}
              className="min-h-[80px]"
            />
          )}

          {/* Original Post Preview */}
          <div className="border border-border rounded-lg p-3 bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <img
                src={profile?.avatar_url || '/images/default-avatar.png'}
                alt={displayName}
                className="w-8 h-8 rounded-full bg-muted"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-sm truncate">{displayName}</span>
                  {profile?.is_verified && (
                    <BadgeCheck className="h-3.5 w-3.5 verified-badge flex-shrink-0" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  @{profile?.username || 'user'} • {timeAgo}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {post.content}
            </p>
            {post.media && post.media.length > 0 && (
              <div className="mt-2 flex gap-1">
                {post.media.slice(0, 3).map((media, i) => (
                  <img
                    key={media.id}
                    src={media.media_url}
                    alt=""
                    className="w-16 h-16 rounded object-cover"
                  />
                ))}
                {post.media.length > 3 && (
                  <div className="w-16 h-16 rounded bg-muted flex items-center justify-center text-xs">
                    +{post.media.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            className="w-full gap-2 neon-glow"
            onClick={handleRepost}
            disabled={createRepost.isPending || (mode === 'quote' && !quoteContent.trim())}
          >
            {createRepost.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Repeat2 className="h-4 w-4" />
            )}
            {mode === 'quote' 
              ? (language === 'ar' ? 'نشر الاقتباس' : 'Post Quote')
              : (language === 'ar' ? 'إعادة النشر' : 'Repost')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
