import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePostBySlug } from '@/hooks/usePostBySlug';
import { useToggleLike, useToggleBookmark } from '@/hooks/usePosts';
import { usePostViews } from '@/hooks/usePostViews';
import { subscribeToCounterUpdates, useRealtimePostCounters } from '@/hooks/useRealtimePostCounters';
import { CommentSection } from '@/components/comments/CommentSection';
import { MainLayout } from '@/components/layout/MainLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ReportPostDialog } from '@/components/feed/ReportPostDialog';
import { MentionText } from '@/components/feed/MentionText';
import { LinkPreview } from '@/components/shared/LinkPreview';
import { 
  ArrowLeft, 
  BadgeCheck, 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreHorizontal,
  Loader2,
  Lock,
  Pin,
  Flag
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { getAvatarUrl } from '@/lib/default-images';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

export default function PostDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { data: post, isLoading, error } = usePostBySlug(slug || '');
  const toggleLike = useToggleLike();
  const toggleBookmark = useToggleBookmark();
  
  // Track views
  const { trackView } = usePostViews(post?.id);
  
  // Subscribe to realtime counter updates (comments_count, likes_count, etc.)
  useRealtimePostCounters();
  
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState(0);
  const [shares, setShares] = useState(0);
  const [views, setViews] = useState(0);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  // Update state when post loads and track view
  useEffect(() => {
    if (post) {
      setIsLiked(post.user_liked);
      setIsSaved(post.user_bookmarked);
      setLikes(post.likes_count || 0);
      setComments(post.comments_count || 0);
      setShares(post.shares_count || 0);
      setViews(post.views_count || 0);
      
      // Track view when post loads
      trackView().then(success => {
        if (success) {
          setViews(prev => prev + 1);
        }
      });
    }
  }, [post, trackView]);

  // Subscribe to real-time counter updates
  useEffect(() => {
    if (!post?.id) return;

    const unsubscribe = subscribeToCounterUpdates((update) => {
      if (update.postId !== post.id) return;

      switch (update.field) {
        case 'likes_count':
          setLikes(update.value);
          break;
        case 'comments_count':
          setComments(update.value);
          break;
        case 'shares_count':
          setShares(update.value);
          break;
        case 'views_count':
          setViews(update.value);
          break;
      }
    });

    return unsubscribe;
  }, [post?.id]);

  // Generate SEO description from content
  const getPostDescription = () => {
    if (!post) return '';
    const content = post.content;
    return content.length > 160 ? content.substring(0, 157) + '...' : content;
  };

  // For reposts, use original post's media if current post has no media
  const displayMedia = post?.repost_of_id && (!post?.media || post.media.length === 0) && post?.original_post?.media 
    ? post.original_post.media 
    : post?.media || [];

  // Get post image for OG
  const getPostImage = () => {
    if (!displayMedia?.length) return undefined;
    return displayMedia[0].media_url;
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error || !post) {
    return (
      <MainLayout>
        <SEOHead 
          title={language === 'ar' ? 'المنشور غير موجود' : 'Post Not Found'}
          description={language === 'ar' ? 'المنشور الذي تبحث عنه غير موجود' : 'The post you are looking for does not exist'}
        />
        <div className="glass-card p-8 text-center">
          <p className="text-destructive mb-4">
            {language === 'ar' ? 'المنشور غير موجود أو تم حذفه' : 'Post not found or has been deleted'}
          </p>
          <Button onClick={() => navigate('/')}>
            {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
          </Button>
        </div>
      </MainLayout>
    );
  }

  const profile = post.profile;
  const displayName = language === 'ar' 
    ? (profile?.display_name_ar || profile?.display_name || profile?.username || 'مستخدم')
    : (profile?.display_name || profile?.username || 'User');
  
  const categoryName = post.category 
    ? (language === 'ar' ? post.category.name_ar : post.category.name_en)
    : null;

  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: language === 'ar' ? ar : enUS
  });

  const handleLike = () => {
    if (!user) {
      toast({
        title: language === 'ar' ? 'يجب تسجيل الدخول' : 'Login required',
        variant: 'destructive'
      });
      navigate('/auth');
      return;
    }
    
    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);
    
    toggleLike.mutate(
      { postId: post.id, isLiked },
      { onError: () => { setIsLiked(isLiked); setLikes(likes); } }
    );
  };

  const handleBookmark = () => {
    if (!user) {
      toast({
        title: language === 'ar' ? 'يجب تسجيل الدخول' : 'Login required',
        variant: 'destructive'
      });
      navigate('/auth');
      return;
    }
    
    setIsSaved(!isSaved);
    toggleBookmark.mutate(
      { postId: post.id, isBookmarked: isSaved },
      { onError: () => setIsSaved(isSaved) }
    );
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = `${displayName} on Tahweel`;
    const shareText = getPostDescription();

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        setShares(shares + 1); // Increment shares count
      } catch (err) {
        // User cancelled or error
        console.log('Share cancelled or failed:', err);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: language === 'ar' ? 'تم نسخ الرابط' : 'Link copied',
          description: language === 'ar' ? 'تم نسخ رابط المنشور إلى الحافظة' : 'Post link copied to clipboard',
        });
        setShares(shares + 1); // Increment shares count
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  // Build canonical URL
  const canonicalUrl = post.category?.slug 
    ? `/category/${post.category.slug}/post/${post.slug}`
    : `/post/${post.slug}`;

  return (
    <MainLayout>
      <SEOHead 
        title={`${displayName}: ${post.content.substring(0, 50)}${post.content.length > 50 ? '...' : ''}`}
        description={getPostDescription()}
        image={getPostImage()}
        url={canonicalUrl}
        type="article"
        author={displayName}
        publishedTime={post.created_at}
        modifiedTime={post.updated_at}
      />

      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 gap-2"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {language === 'ar' ? 'رجوع' : 'Back'}
      </Button>

      {/* Post Card */}
      <article className="glass-card p-6">
        {/* Status badges */}
        {(post.is_pinned || post.is_locked) && (
          <div className="flex gap-2 mb-4">
            {post.is_pinned && (
              <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-secondary/20 text-secondary">
                <Pin className="h-3 w-3" />
                {language === 'ar' ? 'مثبت' : 'Pinned'}
              </span>
            )}
            {post.is_locked && (
              <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                <Lock className="h-3 w-3" />
                {language === 'ar' ? 'مقفل' : 'Locked'}
              </span>
            )}
          </div>
        )}

        {/* Header */}
        <header className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link to={`/profile/${profile?.username}`}>
              <img
                src={getAvatarUrl(profile?.avatar_url)}
                alt={displayName}
                className="w-12 h-12 rounded-full bg-muted ring-2 ring-primary/20 hover:ring-primary/40 transition-all object-cover"
              />
            </Link>
            <div>
              <div className="flex items-center gap-1.5">
                <Link 
                  to={`/profile/${profile?.username}`}
                  className="font-semibold hover:text-primary transition-colors"
                >
                  {displayName}
                </Link>
                {profile?.is_verified && (
                  <BadgeCheck className="h-4 w-4 verified-badge" />
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link to={`/profile/${profile?.username}`} className="hover:underline">
                  @{profile?.username || 'user'}
                </Link>
                <span>•</span>
                <time dateTime={post.created_at}>{timeAgo}</time>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {categoryName && (
              <Link 
                to={`/category/${post.category?.slug}`}
                className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
              >
                {categoryName}
              </Link>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-card">
                <DropdownMenuItem 
                  className="cursor-pointer text-destructive"
                  onClick={() => setReportDialogOpen(true)}
                >
                  <Flag className="h-4 w-4 me-2" />
                  {t('action.report')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content */}
        <div className="text-base leading-relaxed mb-4 whitespace-pre-wrap">
          <MentionText content={post.content} />
        </div>

        {/* Link Previews */}
        {post.link_previews && (
          <div className="mb-4">
            <LinkPreview previews={typeof post.link_previews === 'string' ? JSON.parse(post.link_previews) : post.link_previews} />
          </div>
        )}

        {/* Images - Use displayMedia which handles repost fallback */}
        {displayMedia && displayMedia.length > 0 && (
          <div
            className={cn(
              'rounded-xl overflow-hidden mb-4 grid gap-1',
              displayMedia.length === 1 && 'grid-cols-1',
              displayMedia.length === 2 && 'grid-cols-2',
              displayMedia.length >= 3 && 'grid-cols-2'
            )}
          >
            {displayMedia.map((media, index) => (
              <figure
                key={media.id}
                className={cn(
                  'relative aspect-video bg-muted overflow-hidden',
                  displayMedia.length === 3 && index === 0 && 'row-span-2 aspect-square'
                )}
              >
                <img
                  src={media.media_url}
                  alt={`Post image ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </figure>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4 pb-4 border-b border-border">
          <span>{views} {language === 'ar' ? 'مشاهدة' : 'views'}</span>
        </div>

        {/* Actions */}
        <footer className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'gap-2 hover:text-destructive hover:bg-destructive/10',
                isLiked && 'text-destructive'
              )}
              onClick={handleLike}
              aria-label={language === 'ar' ? 'إعجاب' : 'Like'}
            >
              <Heart className={cn('h-5 w-5', isLiked && 'fill-current')} aria-hidden />
              <span>{likes}</span>
            </Button>

            <Button variant="ghost" size="sm" className="gap-2 hover:text-info hover:bg-info/10">
              <MessageCircle className="h-5 w-5" aria-hidden />
              <span>{comments}</span>
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 hover:text-success hover:bg-success/10"
              onClick={handleShare}
              aria-label={language === 'ar' ? 'مشاركة' : 'Share'}
            >
              <Share2 className="h-5 w-5" aria-hidden />
              <span>{shares}</span>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'hover:text-secondary hover:bg-secondary/10',
              isSaved && 'text-secondary'
            )}
            onClick={handleBookmark}
            aria-label={language === 'ar' ? 'حفظ' : 'Bookmark'}
          >
            <Bookmark className={cn('h-5 w-5', isSaved && 'fill-current')} aria-hidden />
          </Button>
        </footer>
      </article>

      {/* Comments Section */}
      <section className="glass-card p-6 mt-4" aria-label={language === 'ar' ? 'التعليقات' : 'Comments'}>
        <CommentSection postId={post.id} isLocked={post.is_locked || false} onCommentSuccess={() => setComments(comments + 1)} />
      </section>

      {/* Report Dialog */}
      <ReportPostDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        postId={post.id}
      />
    </MainLayout>
  );
}
