import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToggleCommentLike, useUpdateComment, useDeleteComment, type Comment } from '@/hooks/useComments';
import { subscribeToCommentLikeUpdates } from '@/hooks/useRealtimeCommentLikes';
import { BadgeCheck, Heart, MessageCircle, ChevronDown, Loader2, Check, X, Trash2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAvatarUrl } from '@/lib/default-images';
import { formatDistanceToNow, differenceInMinutes } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { MentionText } from '@/components/feed/MentionText';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import type { CommentProfile } from '@/hooks/useComments';
import { LinkPreview } from '@/components/shared/LinkPreview';
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

interface CommentItemProps {
  comment: Comment & { hasMoreReplies?: boolean; totalReplies?: number };
  postId: string;
  onReply: (commentId: string, username: string) => void;
  isReply?: boolean;
}

export function CommentItem({ comment, postId, onReply, isReply = false }: CommentItemProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const toggleLike = useToggleCommentLike();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();
  
  const [isLiked, setIsLiked] = useState(comment.user_liked);
  const [likesCount, setLikesCount] = useState(comment.likes_count || 0);
  const [displayedReplies, setDisplayedReplies] = useState<Comment[]>(comment.replies || []);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreReplies, setHasMoreReplies] = useState(comment.hasMoreReplies || false);
  
  // Inline editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isOwner = user?.id === comment.user_id;
  
  // Check if comment can be edited (within 15 minutes)
  const canEdit = isOwner && differenceInMinutes(new Date(), new Date(comment.created_at)) < 15;

  // Subscribe to realtime like count updates
  useEffect(() => {
    const unsubscribe = subscribeToCommentLikeUpdates(({ commentId, likesCount: newCount }) => {
      if (commentId === comment.id) {
        setLikesCount(newCount);
      }
    });
    return unsubscribe;
  }, [comment.id]);

  // Sync state when comment prop changes
  useEffect(() => {
    setIsLiked(comment.user_liked);
    setLikesCount(comment.likes_count || 0);
    setDisplayedReplies(comment.replies || []);
    setHasMoreReplies(comment.hasMoreReplies || false);
    setEditContent(comment.content);
  }, [comment.user_liked, comment.likes_count, comment.replies, comment.hasMoreReplies, comment.content]);

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
    }
  }, [isEditing]);

  const profile = comment.profile;
  const displayName = language === 'ar' 
    ? (profile?.display_name_ar || profile?.display_name || profile?.username || 'مستخدم')
    : (profile?.display_name || profile?.username || 'User');

  const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
    addSuffix: true,
    locale: language === 'ar' ? ar : enUS
  });

  const handleLike = () => {
    if (!user) return;
    
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    
    toggleLike.mutate(
      { commentId: comment.id, postId, isLiked },
      {
        onError: () => {
          setIsLiked(isLiked);
          setLikesCount(likesCount);
        }
      }
    );
  };

  const handleContentClick = () => {
    if (canEdit && !isEditing) {
      setIsEditing(true);
    }
  };

  const handleDelete = () => {
    deleteComment.mutate(
      { commentId: comment.id, postId },
      {
        onSuccess: () => {
          setShowDeleteDialog(false);
        }
      }
    );
  };

  const handleSaveEdit = () => {
    if (!editContent.trim() || editContent === comment.content) {
      setIsEditing(false);
      setEditContent(comment.content);
      return;
    }

    updateComment.mutate(
      { commentId: comment.id, postId, content: editContent.trim() },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
        onError: () => {
          setEditContent(comment.content);
          setIsEditing(false);
        }
      }
    );
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancelEdit();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
  };

  const handleLoadMoreReplies = async () => {
    setIsLoadingMore(true);
    try {
      const { data: replies, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles!inner (
            id,
            user_id,
            username,
            display_name,
            display_name_ar,
            avatar_url,
            is_verified
          )
        `)
        .eq('parent_id', comment.id)
        .eq('is_hidden', false)
        .order('created_at', { ascending: true })
        .range(displayedReplies.length, displayedReplies.length + 4);
      
      if (error) throw error;

      let likedIds = new Set<string>();
      if (user && replies && replies.length > 0) {
        const { data: likes } = await supabase
          .from('likes')
          .select('comment_id')
          .eq('user_id', user.id)
          .in('comment_id', replies.map(r => r.id));
        
        likedIds = new Set(likes?.map(l => l.comment_id).filter(Boolean) as string[]);
      }

      const newReplies: Comment[] = (replies || []).map(reply => ({
        id: reply.id,
        post_id: reply.post_id,
        user_id: reply.user_id,
        content: reply.content,
        parent_id: reply.parent_id,
        likes_count: reply.likes_count,
        is_hidden: reply.is_hidden,
        created_at: reply.created_at,
        updated_at: reply.updated_at,
        profile: reply.profiles as unknown as CommentProfile,
        replies: [],
        user_liked: likedIds.has(reply.id)
      }));

      setDisplayedReplies(prev => [...prev, ...newReplies]);
      
      // Check if there are more replies
      const totalLoaded = displayedReplies.length + newReplies.length;
      setHasMoreReplies(newReplies.length === 5 && totalLoaded < (comment.totalReplies || 0));
    } catch (error) {
      console.error('Failed to load more replies:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const remainingReplies = (comment.totalReplies || 0) - displayedReplies.length;

  return (
    <div className={cn("group", isReply && "ms-10 mt-3")}>
      <div className="flex gap-3">
        <Link to={`/profile/${profile?.username}`}>
          <img
            src={getAvatarUrl(profile?.avatar_url)}
            alt={displayName}
            className={cn(
              "rounded-full bg-muted ring-2 ring-primary/10 object-cover",
              isReply ? "w-8 h-8" : "w-10 h-10"
            )}
          />
        </Link>
        
        <div className="flex-1 min-w-0">
          <div className={cn(
            "bg-muted/50 rounded-2xl px-4 py-2.5",
            canEdit && !isEditing && "cursor-text hover:bg-muted/70 transition-colors"
          )}>
            <div className="flex items-center gap-2 mb-1">
              <Link 
                to={`/profile/${profile?.username}`}
                className="font-semibold text-sm hover:text-primary transition-colors"
              >
                {displayName}
              </Link>
              {profile?.is_verified && (
                <BadgeCheck className="h-3.5 w-3.5 verified-badge" />
              )}
              <span className="text-xs text-muted-foreground">
                {timeAgo}
              </span>
              {/* Only show edited if updated_at is at least 1 second after created_at */}
              {new Date(comment.updated_at).getTime() - new Date(comment.created_at).getTime() > 1000 && (
                <span className="text-xs text-muted-foreground italic">
                  {language === 'ar' ? '(معدل)' : '(edited)'}
                </span>
              )}
            </div>
            
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  ref={textareaRef}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[60px] text-sm resize-none bg-background/50"
                  placeholder={language === 'ar' ? 'اكتب تعليقك...' : 'Write your comment...'}
                />
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={updateComment.isPending}
                    className="h-7 px-2"
                  >
                    <X className="h-3.5 w-3.5 me-1" />
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    disabled={updateComment.isPending || !editContent.trim()}
                    className="h-7 px-2"
                  >
                    {updateComment.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin me-1" />
                    ) : (
                      <Check className="h-3.5 w-3.5 me-1" />
                    )}
                    {language === 'ar' ? 'حفظ' : 'Save'}
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div 
                  className="text-sm whitespace-pre-wrap"
                  onClick={handleContentClick}
                >
                  <MentionText content={comment.content} />
                </div>
                
                {/* Link Previews */}
                {comment.link_previews && (
                  <div className="mt-2">
                    <LinkPreview previews={typeof comment.link_previews === 'string' ? JSON.parse(comment.link_previews) : comment.link_previews} />
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4 mt-1 px-2">
            <button
              onClick={handleLike}
              className={cn(
                "text-xs flex items-center gap-1 hover:text-destructive transition-colors",
                isLiked && "text-destructive"
              )}
              disabled={!user}
            >
              <Heart className={cn("h-3.5 w-3.5", isLiked && "fill-current")} />
              {likesCount > 0 && <span>{likesCount}</span>}
            </button>
            
            {!isReply && (
              <button
                onClick={() => onReply(comment.id, profile?.username || '')}
                className="text-xs flex items-center gap-1 hover:text-primary transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                {language === 'ar' ? 'رد' : 'Reply'}
              </button>
            )}
            
            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs flex items-center gap-1 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
              >
                <Pencil className="h-3 w-3" />
                {language === 'ar' ? 'تعديل' : 'Edit'}
              </button>
            )}
            
            {isOwner && (
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="text-xs flex items-center gap-1 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="h-3 w-3" />
                {language === 'ar' ? 'حذف' : 'Delete'}
              </button>
            )}
          </div>
          
          {/* Replies */}
          {displayedReplies.length > 0 && (
            <div className="space-y-0">
              {displayedReplies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  onReply={onReply}
                  isReply
                />
              ))}
            </div>
          )}

          {/* Load More Replies Button */}
          {!isReply && hasMoreReplies && remainingReplies > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLoadMoreReplies}
              disabled={isLoadingMore}
              className="ms-10 mt-2 text-xs text-primary hover:text-primary/80 gap-1"
            >
              {isLoadingMore ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              {language === 'ar' 
                ? `عرض ${remainingReplies} رد إضافي`
                : `View ${remainingReplies} more ${remainingReplies === 1 ? 'reply' : 'replies'}`}
            </Button>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ar' ? 'حذف التعليق' : 'Delete Comment'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar' 
                ? 'هل أنت متأكد من حذف هذا التعليق؟ لا يمكن التراجع عن هذا الإجراء.'
                : 'Are you sure you want to delete this comment? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteComment.isPending}
            >
              {deleteComment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin me-2" />
              ) : (
                <Trash2 className="h-4 w-4 me-2" />
              )}
              {language === 'ar' ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}