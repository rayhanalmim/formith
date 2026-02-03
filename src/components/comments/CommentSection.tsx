/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateComment } from '@/hooks/useComments';
import { useInfiniteComments } from '@/hooks/useInfiniteComments';
import { useRealtimeCommentLikes } from '@/hooks/useRealtimeCommentLikes';
import { useRealtimeComments } from '@/hooks/useRealtimeComments';
import { CommentItem } from './CommentItem';
import { Button } from '@/components/ui/button';
import { MentionInput } from '@/components/ui/mention-input';
import { Loader2, Send, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useCurrentUserProfile } from '@/hooks/useProfile';
import { getAvatarUrl } from '@/lib/default-images';

interface CommentSectionProps {
  postId: string;
  isLocked?: boolean;
  onCommentSuccess?: () => void;
}

export function CommentSection({ postId, isLocked, onCommentSuccess }: CommentSectionProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { data: profile } = useCurrentUserProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const { 
    data, 
    isLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useInfiniteComments(postId);
  const createComment = useCreateComment();
  
  // Enable realtime updates for comment likes and new comments
  useRealtimeCommentLikes(postId);
  useRealtimeComments(postId);
  
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);

  // Flatten all comments from pages
  const comments = data?.pages.flatMap(page => page.comments) || [];
  const totalCount = data?.pages[0]?.totalCount || 0;

  // Infinite scroll observer
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const option = {
      root: null,
      rootMargin: '100px',
      threshold: 0,
    };
    
    const observer = new IntersectionObserver(handleObserver, option);
    observer.observe(element);
    
    return () => observer.disconnect();
  }, [handleObserver]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: language === 'ar' ? 'يجب تسجيل الدخول' : 'Login required',
        description: language === 'ar' ? 'سجل دخولك للتعليق' : 'Login to comment',
        variant: 'destructive'
      });
      navigate('/auth');
      return;
    }
    
    if (!content.trim()) return;
    
    try {
      await createComment.mutateAsync({
        postId,
        content: content.trim(),
        parentId: replyTo?.id,
      });
      
      setContent('');
      setReplyTo(null);
      onCommentSuccess?.();
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleReply = (commentId: string, username: string) => {
    setReplyTo({ id: commentId, username });
    setContent(`@${username} `);
  };

  const cancelReply = () => {
    setReplyTo(null);
    setContent('');
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">
        {language === 'ar' ? 'التعليقات' : 'Comments'}
        {totalCount > 0 && (
          <span className="text-muted-foreground ms-2 font-normal">
            ({totalCount})
          </span>
        )}
      </h3>
      
      {/* Comment Form */}
      {!isLocked && (
        <form onSubmit={handleSubmit} className="space-y-3">
          {replyTo && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
              <span>
                {language === 'ar' ? 'الرد على' : 'Replying to'} @{replyTo.username}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={cancelReply}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          
          <div className="flex gap-3">
            {user && (
              <img
                src={getAvatarUrl(profile?.avatar_url)}
                alt={profile?.display_name || user.email || 'User'}
                className="w-10 h-10 rounded-full bg-muted object-cover"
              />
            )}
            <div className="flex-1">
              <MentionInput
                value={content}
                onChange={setContent}
                placeholder={
                  user
                    ? (language === 'ar' ? 'اكتب تعليقاً... استخدم @ للإشارة' : 'Write a comment... Use @ to mention')
                    : (language === 'ar' ? 'سجل دخولك للتعليق' : 'Login to comment')
                }
                className="min-h-[80px] resize-none"
                disabled={!user}
              />
              <div className="flex justify-end mt-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!content.trim() || createComment.isPending}
                  className="gap-2"
                >
                  {createComment.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {language === 'ar' ? 'نشر' : 'Post'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}
      
      {isLocked && (
        <div className="text-center py-4 text-muted-foreground bg-muted/30 rounded-lg">
          {language === 'ar' ? 'التعليقات مغلقة على هذا المنشور' : 'Comments are locked on this post'}
        </div>
      )}
      
      {/* Comments List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              onReply={handleReply}
            />
          ))}
          
          {/* Infinite scroll trigger */}
          <div ref={loadMoreRef} className="h-1" />
          
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          {language === 'ar' ? 'لا توجد تعليقات بعد. كن أول من يعلق!' : 'No comments yet. Be the first to comment!'}
        </div>
      )}
    </div>
  );
}
