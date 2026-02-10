/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToggleLike, useToggleBookmark, useEditPost, useDeletePost, canEditPost, type Post } from '@/hooks/usePosts';
import { usePoll } from '@/hooks/usePolls';
import { subscribeToCounterUpdates } from '@/hooks/useRealtimePostCounters';
import { trackPostView } from '@/hooks/usePostViews';
import { BadgeCheck, Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Repeat2, MapPin, Edit, Trash2, Loader2, Eye, Clock, Flag, Send, Languages } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { getAvatarUrl } from '@/lib/default-images';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { SharePostDialog } from './SharePostDialog';
import { RepostDialog } from './RepostDialog';
import { ReportPostDialog } from './ReportPostDialog';
import { MentionText } from './MentionText';
import { LazyImage, LazyAvatar } from '@/components/ui/lazy-image';
import { PostImageViewer } from '@/components/ui/post-image-viewer';
import { SharePostToDMDialog } from '@/components/messages/SharePostToDMDialog';
import { PollDisplay } from '@/components/polls/PollDisplay';
import { LinkPreview } from '@/components/shared/LinkPreview';
import { useTranslation } from '@/hooks/useTranslation';

interface PostCardProps {
  post: Post;
  onRepostSuccess?: () => void;
  isNew?: boolean;
}

// Helper function to detect if text contains Arabic characters (ignoring hashtags and mentions)
const isArabicText = (text: string): boolean => {
  if (!text) return false;
  // Remove hashtags and mentions before checking
  const cleaned = text.replace(/#[a-zA-Z0-9_\u0600-\u06FF]+/g, '').replace(/@[a-zA-Z0-9_]+/g, '');
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicRegex.test(cleaned);
};

// Helper function to get emoji for feeling
const getFeelingEmoji = (feeling: string): string => {
  const feelingsMap: Record<string, string> = {
    'Happy': '😊', 'سعيد': '😊',
    'Sad': '😢', 'حزين': '😢',
    'Angry': '😡', 'غاضب': '😡',
    'In Love': '😍', 'متيم': '😍',
    'Cool': '😎', 'رائع': '😎',
    'Thinking': '🤔', 'متفكر': '🤔',
    'Sleepy': '😴', 'نعسان': '😴',
    'Celebrating': '🎉', 'محتفل': '🎉',
    'Frustrated': '😤', 'محبط': '😤',
    'Grateful': '🥰', 'ممتن': '🥰',
    'Motivated': '💪', 'متحمس': '💪',
    'Relaxed': '😌', 'مرتاح': '😌',
  };
  return feelingsMap[feeling] || '😊';
};

export function PostCard({ post, onRepostSuccess, isNew = false }: PostCardProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const toggleLike = useToggleLike();
  const toggleBookmark = useToggleBookmark();
  const editPost = useEditPost();
  const deletePost = useDeletePost();
  
  const { translate, getTranslation } = useTranslation();
  
  const [isLiked, setIsLiked] = useState(post.user_liked);
  const [isSaved, setIsSaved] = useState(post.user_bookmarked);
  const [likes, setLikes] = useState(Math.max(0, post.likes_count ?? 0));
  const [shares, setShares] = useState(Math.max(0, post.shares_count ?? 0));
  const [comments, setComments] = useState(Math.max(0, post.comments_count ?? 0));
  const [views, setViews] = useState(Math.max(0, post.views_count ?? 0));
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareToDMDialogOpen, setShareToDMDialogOpen] = useState(false);
  const [repostDialogOpen, setRepostDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const hasTrackedView = useRef(false);

  // Subscribe to real-time counter updates
  useEffect(() => {
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
  }, [post.id]);

  // Sync with prop updates
  useEffect(() => {
    setLikes(Math.max(0, post.likes_count ?? 0));
    setShares(Math.max(0, post.shares_count ?? 0));
    setComments(Math.max(0, post.comments_count ?? 0));
    setViews(Math.max(0, post.views_count ?? 0));
    setIsLiked(post.user_liked);
    setIsSaved(post.user_bookmarked);
  }, [post.likes_count, post.shares_count, post.comments_count, post.views_count, post.user_liked, post.user_bookmarked]);

  // Track view when lightbox opens
  const handleImageClick = async (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
    
    // Track view only once per post per session for logged-in users
    if (!hasTrackedView.current && user?.id) {
      hasTrackedView.current = true;
      const success = await trackPostView(post.id, user.id);
      if (success) {
        setViews(prev => prev + 1);
      }
    }
  };

  // Track view when post card is first seen by a logged-in user
  useEffect(() => {
    if (!user?.id || hasTrackedView.current) return;

    hasTrackedView.current = true;
    trackPostView(post.id, user.id).then((success) => {
      if (success) {
        setViews((prev) => prev + 1);
      }
    });
  }, [post.id, user?.id]);

  // Sync with prop updates
  useEffect(() => {
    setLikes(Math.max(0, post.likes_count ?? 0));
    setShares(Math.max(0, post.shares_count ?? 0));
    setComments(Math.max(0, post.comments_count ?? 0));
    setIsLiked(post.user_liked);
    setIsSaved(post.user_bookmarked);
  }, [post.likes_count, post.shares_count, post.comments_count, post.user_liked, post.user_bookmarked]);
  
  const postUrl = post.category?.slug 
    ? `/category/${post.category.slug}/post/${post.slug || post.id}` 
    : `/post/${post.slug || post.id}`;

  const isOwner = user?.id === post.user_id;
  const canEdit = isOwner && canEditPost(post.created_at);

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
        description: language === 'ar' ? 'سجل دخولك للإعجاب بالمنشورات' : 'Login to like posts',
        variant: 'destructive'
      });
      navigate('/auth');
      return;
    }
    
    // Optimistic update
    setIsLiked(!isLiked);
    setLikes(isLiked ? Math.max(0, likes - 1) : likes + 1);
    
    toggleLike.mutate(
      { postId: post.id, isLiked },
      {
        onError: () => {
          // Revert on error
          setIsLiked(isLiked);
          setLikes(likes);
        }
      }
    );
  };

  const handleBookmark = () => {
    if (!user) {
      toast({
        title: language === 'ar' ? 'يجب تسجيل الدخول' : 'Login required',
        description: language === 'ar' ? 'سجل دخولك لحفظ المنشورات' : 'Login to bookmark posts',
        variant: 'destructive'
      });
      navigate('/auth');
      return;
    }
    
    // Optimistic update
    setIsSaved(!isSaved);
    
    toggleBookmark.mutate(
      { postId: post.id, isBookmarked: isSaved },
      {
        onError: () => {
          setIsSaved(isSaved);
        }
      }
    );
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    
    try {
      await editPost.mutateAsync({ postId: post.id, content: editContent });
      toast({
        title: language === 'ar' ? 'تم التعديل' : 'Updated',
        description: language === 'ar' ? 'تم تعديل المنشور بنجاح' : 'Post updated successfully',
      });
      setEditDialogOpen(false);
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deletePost.mutateAsync(post.id);
      toast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
        description: language === 'ar' ? 'تم حذف المنشور بنجاح' : 'Post deleted successfully',
      });
      setDeleteDialogOpen(false);
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Check if this is a repost
  const isRepost = !!post.repost_of_id && !!post.original_post;
  const originalPost = post.original_post;
  const originalProfile = originalPost?.profile;
  const originalDisplayName = language === 'ar' 
    ? (originalProfile?.display_name_ar || originalProfile?.display_name || originalProfile?.username || 'مستخدم')
    : (originalProfile?.display_name || originalProfile?.username || 'User');

  // For reposts, use original post's media if current post has no media
  const displayMedia = isRepost && post.media.length === 0 && originalPost?.media 
    ? originalPost.media 
    : post.media;

  // Check if post is pending approval (only visible to post owner)
  const isPendingApproval = post.is_approved === false && !post.is_hidden;

  return (
    <>
      <article className={cn(
        "glass-card p-4 hover-scale animate-fade-in relative transition-all duration-500",
        isPendingApproval && "bg-muted/70 border-muted",
        isNew && "ring-2 ring-primary/50 shadow-neon-primary animate-new-post"
      )}>
        {/* Pending approval banner */}
        {isPendingApproval && (
          <div className="absolute top-0 left-0 right-0 bg-muted/80 border-b border-pink-500/30 rounded-t-xl px-4 py-2 flex items-center justify-center gap-2">
            <Clock className="h-4 w-4 text-pink-500" />
            <span className="text-xs font-medium text-pink-500">
              {language === 'ar' ? 'في انتظار الموافقة' : 'Pending Approval'}
            </span>
          </div>
        )}
        {/* Repost indicator */}
        {isRepost && (
          <div className={cn(
            "flex items-center gap-2 text-xs text-muted-foreground mb-3 pb-2 border-b border-border/50",
            isPendingApproval && "mt-8"
          )}>
            <Repeat2 className="h-3.5 w-3.5" />
            <span>{language === 'ar' ? 'أعاد النشر من' : 'Reposted from'}</span>
            <Link 
              to={`/profile/${originalProfile?.username}`}
              className="font-medium text-primary hover:underline"
            >
              @{originalProfile?.username || 'user'}
            </Link>
          </div>
        )}

        {/* Header */}
        <div className={cn(
          "flex items-start justify-between gap-2 mb-3",
          isPendingApproval && !isRepost && "mt-8"
        )}>
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Link to={`/profile/${profile?.username}`} className="shrink-0">
              <LazyAvatar
                src={getAvatarUrl(profile?.avatar_url)}
                alt={displayName}
                className="w-11 h-11 rounded-full bg-muted ring-2 ring-primary/20 hover:ring-primary/40 transition-all"
              />
            </Link>
            <div className="flex-1 min-w-0">
              {/* Name row */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link 
                  to={`/profile/${profile?.username}`}
                  className="font-semibold text-sm hover:text-primary cursor-pointer transition-colors truncate"
                >
                  {displayName}
                </Link>
                {profile?.is_verified && (
                  <BadgeCheck className="h-4 w-4 verified-badge shrink-0" />
                )}
              </div>
              {/* Username and time row */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Link to={`/profile/${profile?.username}`} className="hover:underline truncate">
                  @{profile?.username || 'user'}
                </Link>
                <span className="shrink-0">•</span>
                <span className="shrink-0">{timeAgo}</span>
              </div>
              {/* Meta row - location, feeling, category */}
              {(post.location || post.feeling || categoryName) && (
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {post.location && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate max-w-[120px]">{post.location}</span>
                    </span>
                  )}
                  {post.feeling && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                      {getFeelingEmoji(post.feeling)} {post.feeling}
                    </span>
                  )}
                  {categoryName && (
                    <Link 
                      to={`/category/${post.category?.slug}`}
                      className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors truncate max-w-[100px]"
                    >
                      {categoryName}
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-card">
              {canEdit && (
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => {
                    setEditContent(post.content);
                    setEditDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4 me-2" />
                  {language === 'ar' ? 'تعديل' : 'Edit'}
                </DropdownMenuItem>
              )}
              {isOwner && (
                <>
                  <DropdownMenuItem 
                    className="cursor-pointer text-destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 me-2" />
                    {language === 'ar' ? 'حذف' : 'Delete'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem 
                className="cursor-pointer text-destructive"
                onSelect={(e) => {
                  e.preventDefault();
                  setReportDialogOpen(true);
                }}
              >
                <Flag className="h-4 w-4 me-2" />
                {language === 'ar' ? 'إبلاغ' : 'Report'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Quote content (if this is a quote repost) */}
        {post.quote_content && (
          <div className="text-sm leading-relaxed mb-3 whitespace-pre-wrap" dir={isArabicText(post.quote_content) ? 'rtl' : 'ltr'}>
            <MentionText content={post.quote_content} />
          </div>
        )}

        {/* Original post embed for quote reposts */}
        {isRepost && post.quote_content && originalPost && (
          <Link 
            to={`/post/${originalPost.slug || originalPost.id}`}
            className="block border border-border rounded-lg p-3 mb-3 bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <LazyAvatar
                src={getAvatarUrl(originalProfile?.avatar_url)}
                alt={originalDisplayName}
                className="w-6 h-6 rounded-full bg-muted"
              />
              <span className="font-medium text-xs">{originalDisplayName}</span>
              {originalProfile?.is_verified && (
                <BadgeCheck className="h-3 w-3 verified-badge" />
              )}
              <span className="text-xs text-muted-foreground">@{originalProfile?.username}</span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2" dir={isArabicText(originalPost.content) ? 'rtl' : 'ltr'}>
              {originalPost.content}
            </p>
          </Link>
        )}

        {/* Content - show original content for simple reposts, or post content for regular posts */}
        {(!post.quote_content || !isRepost) && (() => {
          const contentText = isRepost && originalPost ? originalPost.content : post.content;
          const translationId = `post-${post.id}`;
          const translation = getTranslation(translationId);
          const contentIsArabic = isArabicText(contentText);
          const showTranslated = translation.isTranslated && translation.translatedText;
          const displayText = showTranslated ? translation.translatedText! : contentText;
          const displayDir = showTranslated
            ? (translation.targetLang === 'ar' ? 'rtl' : 'ltr')
            : (contentIsArabic ? 'rtl' : 'ltr');
          
          return (
            <div className="mb-3">
              <div className="text-sm leading-relaxed whitespace-pre-wrap" dir={displayDir}>
                <MentionText content={displayText} />
              </div>
              
              {/* Translation error */}
              {translation.error && (
                <p className="text-xs text-destructive mt-1">{translation.error}</p>
              )}
              
              {/* Translate toggle button */}
              {user && (
                <button
                  onClick={() => translate(translationId, contentText)}
                  disabled={translation.isTranslating}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mt-1.5"
                >
                  {translation.isTranslating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Languages className="h-3 w-3" />
                  )}
                  {translation.isTranslating
                    ? (language === 'ar' ? 'جاري الترجمة...' : 'Translating...')
                    : translation.isTranslated
                      ? (language === 'ar' ? 'عرض الأصلي' : 'Show original')
                      : contentIsArabic
                        ? (language === 'ar' ? 'ترجم إلى الإنجليزية' : 'Translate to English')
                        : (language === 'ar' ? 'ترجم إلى العربية' : 'Translate to Arabic')
                  }
                </button>
              )}
            </div>
          );
        })()}

        {/* Link Previews */}
        {post.link_previews && (
          <LinkPreview previews={typeof post.link_previews === 'string' ? JSON.parse(post.link_previews) : post.link_previews} />
        )}

        {/* Poll Display - show original post's poll for reposts */}
        <PollDisplay 
          postId={isRepost && originalPost ? originalPost.id : post.id} 
          postOwnerId={isRepost && originalPost?.profile ? originalPost.profile.user_id : post.user_id}
        />

        {displayMedia && displayMedia.length > 0 && (
          <div
            className={cn(
              'rounded-xl overflow-hidden mb-3 grid gap-1',
              displayMedia.length === 1 && 'grid-cols-1',
              displayMedia.length === 2 && 'grid-cols-2',
              displayMedia.length >= 3 && 'grid-cols-2'
            )}
          >
            {displayMedia.slice(0, 4).map((media, index) => (
              <div
                key={media.id}
                className={cn(
                  'relative bg-muted overflow-hidden cursor-pointer group',
                  displayMedia.length === 1 && 'aspect-video',
                  displayMedia.length === 2 && 'aspect-video',
                  displayMedia.length === 3 && index === 0 && 'row-span-2 aspect-square',
                  displayMedia.length === 3 && index > 0 && 'aspect-square',
                  displayMedia.length >= 4 && 'aspect-square'
                )}
                onClick={() => handleImageClick(index)}
              >
                <LazyImage
                  src={media.media_url}
                  alt=""
                  className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                />
                {displayMedia.length > 4 && index === 3 && (
                  <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                    <span className="text-2xl font-bold">+{displayMedia.length - 4}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Post Image Viewer - Facebook style */}
        {displayMedia && displayMedia.length > 0 && (
          <PostImageViewer
            images={displayMedia.map(m => ({ url: m.media_url }))}
            initialIndex={lightboxIndex}
            isOpen={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
            post={{
              id: post.id,
              content: isRepost && originalPost ? originalPost.content : post.content,
              created_at: post.created_at,
              profile: profile,
            }}
            counters={{
              likes,
              comments,
              shares,
              views,
              isLiked,
              isSaved,
            }}
            onLike={handleLike}
            onBookmark={handleBookmark}
            onShare={() => setShareDialogOpen(true)}
            onRepost={() => setRepostDialogOpen(true)}
          />
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'gap-2 hover:text-destructive hover:bg-destructive/10',
                isLiked && 'text-destructive'
              )}
              onClick={handleLike}
            >
              <Heart className={cn('h-4 w-4', isLiked && 'fill-current')} />
              <span className="text-xs">{likes}</span>
            </Button>

            <Link to={post.category?.slug ? `/category/${post.category.slug}/post/${post.slug || post.id}` : `/post/${post.slug || post.id}`}>
              <Button variant="ghost" size="sm" className="gap-2 hover:text-info hover:bg-info/10">
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs">{comments}</span>
              </Button>
            </Link>

            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 hover:text-success hover:bg-success/10"
              onClick={() => setRepostDialogOpen(true)}
            >
              <Repeat2 className="h-4 w-4" />
              <span className="text-xs">{shares}</span>
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 hover:text-info hover:bg-info/10"
              onClick={() => setShareDialogOpen(true)}
            >
              <Share2 className="h-4 w-4" />
            </Button>

            {/* Share to DM */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 hover:text-primary hover:bg-primary/10"
              onClick={() => setShareToDMDialogOpen(true)}
              title={language === 'ar' ? 'مشاركة في رسالة خاصة' : 'Share to DM'}
            >
              <Send className="h-4 w-4" />
            </Button>

            {/* Views counter */}
            <div className="flex items-center gap-1 px-2 text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span className="text-xs">{views}</span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8 hover:text-secondary hover:bg-secondary/10',
              isSaved && 'text-secondary'
            )}
            onClick={handleBookmark}
          >
            <Bookmark className={cn('h-4 w-4', isSaved && 'fill-current')} />
          </Button>
        </div>
      </article>

      {/* Share Dialog */}
      <SharePostDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        postUrl={postUrl}
        postContent={post.content}
        postSlug={post.slug}
      />

      {/* Repost Dialog */}
      <RepostDialog
        open={repostDialogOpen}
        onOpenChange={setRepostDialogOpen}
        post={post}
        onRepostSuccess={() => {
          setShares(shares + 1);
          onRepostSuccess?.();
        }}
      />

      {/* Report Dialog */}
      <ReportPostDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        postId={post.id}
      />

      {/* Share to DM Dialog */}
      <SharePostToDMDialog
        open={shareToDMDialogOpen}
        onOpenChange={setShareToDMDialogOpen}
        post={{
          id: post.id,
          content: post.content,
          slug: post.slug,
          profile: post.profile,
          category: post.category,
          media: post.media,
        }}
      />

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'تعديل المنشور' : 'Edit Post'}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={4}
            className="resize-none"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleEdit} disabled={editPost.isPending}>
              {editPost.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {language === 'ar' ? 'حفظ' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ar' ? 'حذف المنشور؟' : 'Delete Post?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar' 
                ? 'هذا الإجراء لا يمكن التراجع عنه. سيتم حذف المنشور نهائياً.'
                : 'This action cannot be undone. The post will be permanently deleted.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletePost.isPending}
            >
              {deletePost.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {language === 'ar' ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}