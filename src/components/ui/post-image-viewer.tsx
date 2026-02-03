import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Share2, Bookmark, Repeat2, Eye, BadgeCheck, Send, Loader2 } from 'lucide-react';
import { Button } from './button';
import { ScrollArea } from './scroll-area';
import { Input } from './input';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useComments, useCreateComment } from '@/hooks/useComments';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { getAvatarUrl } from '@/lib/default-images';
import { MentionText } from '@/components/feed/MentionText';
import { useToast } from '@/hooks/use-toast';
import { isVideoUrl } from '@/lib/image-optimization';

interface PostImageViewerProps {
  images: { url: string; alt?: string }[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  post: {
    id: string;
    content: string;
    created_at: string;
    profile?: {
      username?: string | null;
      display_name?: string | null;
      display_name_ar?: string | null;
      avatar_url?: string | null;
      is_verified?: boolean;
    };
  };
  counters: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
    isLiked: boolean;
    isSaved: boolean;
  };
  onLike?: () => void;
  onBookmark?: () => void;
  onShare?: () => void;
  onRepost?: () => void;
  onComment?: () => void;
}

export function PostImageViewer({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  post,
  counters,
  onLike,
  onBookmark,
  onShare,
  onRepost,
  onComment,
}: PostImageViewerProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [commentText, setCommentText] = useState('');
  const lastTouchDistance = useRef<number | null>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);
  
  // Swipe gesture tracking
  const swipeStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const SWIPE_THRESHOLD = 50; // minimum distance for swipe
  const SWIPE_VELOCITY_THRESHOLD = 0.3; // minimum velocity for swipe

  // Fetch comments
  const { data: comments, isLoading: commentsLoading, refetch: refetchComments } = useComments(post.id);
  const createComment = useCreateComment();

  const profile = post.profile;
  const displayName = language === 'ar'
    ? (profile?.display_name_ar || profile?.display_name || profile?.username || 'مستخدم')
    : (profile?.display_name || profile?.username || 'User');

  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: language === 'ar' ? ar : enUS
  });

  // Handle comment submission
  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    
    if (!user) {
      toast({
        title: language === 'ar' ? 'يجب تسجيل الدخول' : 'Login required',
        description: language === 'ar' ? 'سجل دخولك للتعليق' : 'Login to comment',
        variant: 'destructive'
      });
      return;
    }

    try {
      await createComment.mutateAsync({
        postId: post.id,
        content: commentText.trim()
      });
      setCommentText('');
      refetchComments();
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل إرسال التعليق' : 'Failed to post comment',
        variant: 'destructive'
      });
    }
  };

  // Reset state when opening or changing image
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      resetTransforms();
    }
  }, [isOpen, initialIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, currentIndex, images.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    resetTransforms();
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    resetTransforms();
  }, [images.length]);

  const resetTransforms = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    lastTouchDistance.current = null;
  };

  // Double click/tap to zoom
  const handleDoubleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (scale > 1) {
      resetTransforms();
    } else {
      setScale(2);
    }
  };

  // Mouse drag for panning when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    const newScale = Math.min(Math.max(scale + delta, 1), 4);

    if (newScale <= 1) {
      resetTransforms();
    } else {
      setScale(newScale);
    }
  };

  // Touch handlers for pinch-to-zoom and swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = getTouchDistance(e.touches);
      lastTouchDistance.current = distance;
    } else if (e.touches.length === 1) {
      // Track swipe start position (only when not zoomed)
      if (scale <= 1) {
        swipeStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          time: Date.now()
        };
      } else {
        // Panning when zoomed
        setIsDragging(true);
        setDragStart({
          x: e.touches[0].clientX - position.x,
          y: e.touches[0].clientY - position.y,
        });
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance.current !== null) {
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      const delta = (distance - lastTouchDistance.current) / 100;
      const newScale = Math.min(Math.max(scale + delta, 1), 4);

      if (newScale <= 1) {
        resetTransforms();
      } else {
        setScale(newScale);
      }
      lastTouchDistance.current = distance;
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Check for swipe gesture (only when not zoomed and we have a start position)
    if (scale <= 1 && swipeStartRef.current && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - swipeStartRef.current.x;
      const deltaY = touch.clientY - swipeStartRef.current.y;
      const deltaTime = Date.now() - swipeStartRef.current.time;
      const velocity = Math.abs(deltaX) / deltaTime;
      
      // Only trigger swipe if horizontal movement is greater than vertical
      // and meets threshold requirements
      if (
        Math.abs(deltaX) > SWIPE_THRESHOLD &&
        Math.abs(deltaX) > Math.abs(deltaY) * 1.5 &&
        velocity > SWIPE_VELOCITY_THRESHOLD &&
        images.length > 1
      ) {
        if (deltaX > 0) {
          // Swipe right - go to previous
          goToPrevious();
        } else {
          // Swipe left - go to next
          goToNext();
        }
      }
    }
    
    swipeStartRef.current = null;
    lastTouchDistance.current = null;
    setIsDragging(false);
  };

  const getTouchDistance = (touches: React.TouchList) => {
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );
  };

  if (!isOpen) return null;

  const currentImage = images[currentIndex];
  const showNavigation = images.length > 1;

  // Use portal to render at document body level (escapes any parent overflow/positioning)
  return createPortal(
    <div className="fixed inset-0 z-[9999] animate-fade-in flex">
      {/* Image Section - Left/Main */}
      <div
        className="flex-1 bg-black relative flex items-center justify-center"
        onClick={onClose}
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 z-20 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Image counter */}
        {showNavigation && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 text-white/80 text-sm font-medium">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Previous button */}
        {showNavigation && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/10 hover:bg-white/20 text-white"
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}

        {/* Next button */}
        {showNavigation && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/10 hover:bg-white/20 text-white"
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        )}

        {/* Image container */}
        <div
          className="flex items-center justify-center w-full h-full p-4"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {isVideoUrl(currentImage.url) ? (
            <video
              src={currentImage.url}
              className="max-w-full max-h-full object-contain select-none"
              controls
              autoPlay
              playsInline
              style={{ touchAction: 'none' }}
            />
          ) : (
            <img
              src={currentImage.url}
              alt={currentImage.alt || ''}
              className={cn(
                'max-w-full max-h-full object-contain select-none transition-transform duration-150',
                isDragging ? 'cursor-grabbing' : scale > 1 ? 'cursor-grab' : 'cursor-default'
              )}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                touchAction: 'none',
              }}
              onDoubleClick={handleDoubleClick}
              draggable={false}
            />
          )}
        </div>

        {/* Thumbnail navigation - mobile only */}
        {showNavigation && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/50 rounded-lg p-2 max-w-[80%] overflow-x-auto lg:hidden">
            {images.map((image, index) => (
              <button
                key={index}
                className={cn(
                  'w-10 h-10 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all',
                  index === currentIndex
                    ? 'border-white ring-1 ring-white/50'
                    : 'border-transparent opacity-60 hover:opacity-100'
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                  resetTransforms();
                }}
              >
                <img
                  src={image.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Post Details Section - Right (hidden on mobile) */}
      <div className="hidden lg:flex flex-col w-[360px] bg-background border-s border-border">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <Link to={`/profile/${profile?.username}`} onClick={onClose}>
            <img
              src={getAvatarUrl(profile?.avatar_url)}
              alt={displayName}
              className="w-10 h-10 rounded-full bg-muted ring-2 ring-primary/20 hover:ring-primary/40 transition-all object-cover"
            />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Link
                to={`/profile/${profile?.username}`}
                onClick={onClose}
                className="font-semibold text-sm hover:text-primary cursor-pointer transition-colors truncate"
              >
                {displayName}
              </Link>
              {profile?.is_verified && (
                <BadgeCheck className="h-4 w-4 verified-badge flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 lg:hidden"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Post Content */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            <div className="text-sm leading-relaxed whitespace-pre-wrap mb-4">
              <MentionText content={post.content} />
            </div>

            {/* Thumbnail strip for desktop */}
            {showNavigation && (
              <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
                {images.map((image, index) => (
                  <button
                    key={index}
                    className={cn(
                      'w-14 h-14 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all',
                      index === currentIndex
                        ? 'border-primary ring-2 ring-primary/50'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    )}
                    onClick={() => {
                      setCurrentIndex(index);
                      resetTransforms();
                    }}
                  >
                    <img
                      src={image.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Comments section */}
            <div className="border-t border-border pt-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                {language === 'ar' ? 'التعليقات' : 'Comments'}
                <span className="text-muted-foreground font-normal">
                  ({comments?.length || 0})
                </span>
              </h3>
              
              {commentsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-2">
                      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments && comments.length > 0 ? (
                <div className="space-y-3">
                  {comments.slice(0, 10).map(comment => {
                    const commentProfile = comment.profile;
                    const commentDisplayName = language === 'ar'
                      ? (commentProfile?.display_name_ar || commentProfile?.display_name || commentProfile?.username || 'مستخدم')
                      : (commentProfile?.display_name || commentProfile?.username || 'User');
                    const commentTimeAgo = formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                      locale: language === 'ar' ? ar : enUS
                    });
                    
                    return (
                      <div key={comment.id} className="flex gap-2">
                        <Link 
                          to={`/profile/${commentProfile?.username}`} 
                          onClick={onClose}
                          className="flex-shrink-0"
                        >
                          <img
                            src={getAvatarUrl(commentProfile?.avatar_url)}
                            alt={commentDisplayName}
                            className="w-8 h-8 rounded-full bg-muted object-cover hover:ring-2 hover:ring-primary/40 transition-all"
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="bg-muted/50 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <Link
                                to={`/profile/${commentProfile?.username}`}
                                onClick={onClose}
                                className="font-medium text-xs hover:text-primary transition-colors"
                              >
                                {commentDisplayName}
                              </Link>
                              {commentProfile?.is_verified && (
                                <BadgeCheck className="h-3 w-3 verified-badge" />
                              )}
                            </div>
                            <p className="text-xs whitespace-pre-wrap break-words">
                              <MentionText content={comment.content} />
                            </p>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1 px-1">
                            {commentTimeAgo}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {comments.length > 10 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      {language === 'ar' 
                        ? `+ ${comments.length - 10} تعليقات أخرى` 
                        : `+ ${comments.length - 10} more comments`}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {language === 'ar' ? 'لا توجد تعليقات بعد' : 'No comments yet'}
                </p>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Actions Footer */}
        <div className="border-t border-border p-3 space-y-3">
          {/* Comment input */}
          <div className="flex items-center gap-2">
            <Input
              ref={commentInputRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={language === 'ar' ? 'اكتب تعليقاً...' : 'Write a comment...'}
              className="flex-1 text-sm h-9"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitComment();
                }
              }}
              disabled={createComment.isPending}
            />
            <Button
              size="icon"
              className="h-9 w-9 flex-shrink-0"
              onClick={handleSubmitComment}
              disabled={!commentText.trim() || createComment.isPending}
            >
              {createComment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Counters */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {counters.likes}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              {comments?.length || counters.comments}
            </span>
            <span className="flex items-center gap-1">
              <Repeat2 className="h-3.5 w-3.5" />
              {counters.shares}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {counters.views}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'gap-1.5 hover:text-destructive hover:bg-destructive/10',
                  counters.isLiked && 'text-destructive'
                )}
                onClick={onLike}
              >
                <Heart className={cn('h-4 w-4', counters.isLiked && 'fill-current')} />
                <span className="text-xs">{language === 'ar' ? 'إعجاب' : 'Like'}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 hover:text-info hover:bg-info/10"
                onClick={() => commentInputRef.current?.focus()}
              >
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs">{language === 'ar' ? 'تعليق' : 'Comment'}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 hover:text-success hover:bg-success/10"
                onClick={onRepost}
              >
                <Repeat2 className="h-4 w-4" />
                <span className="text-xs">{language === 'ar' ? 'مشاركة' : 'Share'}</span>
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8 hover:text-secondary hover:bg-secondary/10',
                counters.isSaved && 'text-secondary'
              )}
              onClick={onBookmark}
            >
              <Bookmark className={cn('h-4 w-4', counters.isSaved && 'fill-current')} />
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}