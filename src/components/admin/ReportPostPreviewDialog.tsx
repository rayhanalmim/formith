import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getAvatarUrl } from '@/lib/default-images';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { 
  BadgeCheck, 
  Ban, 
  Heart, 
  MessageCircle, 
  Eye, 
  Calendar,
  Users,
  FileText,
  ExternalLink,
  Trash2,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PostOwner {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  display_name_ar: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
  is_banned: boolean | null;
  ban_reason: string | null;
  followers_count: number | null;
  posts_count: number | null;
  created_at: string;
}

interface PostMedia {
  id: string;
  media_url: string;
  media_type: string;
  sort_order: number | null;
}

interface ReportedPost {
  id: string;
  content: string;
  slug: string | null;
  created_at: string;
  likes_count: number | null;
  comments_count: number | null;
  views_count: number | null;
  is_approved: boolean | null;
  is_hidden: boolean | null;
  owner: PostOwner | null;
  media: PostMedia[];
}

interface ReportPostPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: ReportedPost | null;
  reportReason: string;
  reportId: string;
  onActionComplete?: () => void;
}

export function ReportPostPreviewDialog({ 
  open, 
  onOpenChange, 
  post,
  reportReason,
  reportId,
  onActionComplete
}: ReportPostPreviewDialogProps) {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const [isBanning, setIsBanning] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [banReason, setBanReason] = useState('');
  
  if (!post) return null;
  
  const owner = post.owner;
  const displayName = language === 'ar' 
    ? (owner?.display_name_ar || owner?.display_name || owner?.username)
    : (owner?.display_name || owner?.username);

  const handleDeletePost = async () => {
    setIsDeleting(true);
    try {
      await api.adminDeletePost(post.id);
      
      // Auto-resolve the report
      await api.updateReportStatus(
        reportId, 
        'resolved', 
        'admin', 
        language === 'ar' ? 'تم حذف المنشور' : 'Post deleted'
      );
      
      toast({
        title: language === 'ar' ? 'تم حذف المنشور' : 'Post deleted',
        description: language === 'ar' ? 'تم حذف المنشور بنجاح' : 'The post has been deleted successfully',
      });
      
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      onActionComplete?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error instanceof Error ? error.message : (language === 'ar' ? 'فشل في حذف المنشور' : 'Failed to delete post'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleHidePost = async () => {
    setIsHiding(true);
    try {
      await api.moderatePost(post.id, post.is_hidden ? 'approve' : 'hide');
      
      toast({
        title: post.is_hidden 
          ? (language === 'ar' ? 'تم إظهار المنشور' : 'Post shown')
          : (language === 'ar' ? 'تم إخفاء المنشور' : 'Post hidden'),
      });
      
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      onActionComplete?.();
    } catch (error) {
      console.error('Error hiding post:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error instanceof Error ? error.message : (language === 'ar' ? 'فشل في إخفاء المنشور' : 'Failed to hide post'),
        variant: 'destructive',
      });
    } finally {
      setIsHiding(false);
    }
  };

  const handleBanUser = async () => {
    if (!owner) return;
    
    setIsBanning(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_banned: true,
          ban_reason: banReason || (language === 'ar' ? 'انتهاك قواعد المجتمع' : 'Violation of community guidelines')
        })
        .eq('user_id', owner.user_id);
      
      if (error) throw error;
      
      // Try to send ban notification email
      try {
        await api.sendBanNotification(
          owner.user_id,
          true,
          banReason || (language === 'ar' ? 'انتهاك قواعد المجتمع' : 'Violation of community guidelines'),
          language
        );
      } catch (emailError) {
        console.warn('Failed to send ban notification email:', emailError);
      }
      
      // Auto-resolve the report
      await supabase
        .from('reports')
        .update({ 
          status: 'resolved',
          resolution_notes: language === 'ar' ? 'تم حظر المستخدم' : 'User banned',
          resolved_at: new Date().toISOString()
        })
        .eq('id', reportId);
      
      toast({
        title: language === 'ar' ? 'تم حظر المستخدم' : 'User banned',
        description: language === 'ar' ? 'تم حظر المستخدم بنجاح' : 'The user has been banned successfully',
      });
      
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      onActionComplete?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error banning user:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في حظر المستخدم' : 'Failed to ban user',
        variant: 'destructive',
      });
    } finally {
      setIsBanning(false);
      setShowBanDialog(false);
      setBanReason('');
    }
  };

  const handleResolveReport = async () => {
    setIsResolving(true);
    try {
      await api.updateReportStatus(reportId, 'resolved', 'admin', undefined);
      
      toast({
        title: language === 'ar' ? 'تم حل البلاغ' : 'Report resolved',
      });
      
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      onActionComplete?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error resolving report:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error instanceof Error ? error.message : 'Failed to resolve report',
        variant: 'destructive',
      });
    } finally {
      setIsResolving(false);
    }
  };

  const handleDismissReport = async () => {
    setIsDismissing(true);
    try {
      await api.updateReportStatus(
        reportId, 
        'dismissed', 
        'admin', 
        language === 'ar' ? 'تم رفض البلاغ' : 'Report dismissed'
      );
      
      toast({
        title: language === 'ar' ? 'تم رفض البلاغ' : 'Report dismissed',
      });
      
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      onActionComplete?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error dismissing report:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error instanceof Error ? error.message : 'Failed to dismiss report',
        variant: 'destructive',
      });
    } finally {
      setIsDismissing(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="glass-card max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-destructive" />
              {language === 'ar' ? 'تفاصيل المنشور المُبلَّغ عنه' : 'Reported Post Details'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Report Reason */}
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm font-medium text-destructive mb-1">
                {language === 'ar' ? 'سبب البلاغ:' : 'Report Reason:'}
              </p>
              <p className="text-sm">{reportReason}</p>
            </div>
            
            {/* Post Owner Info */}
            {owner && (
              <div className="p-4 rounded-lg bg-muted/50 space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  {language === 'ar' ? 'صاحب المنشور' : 'Post Owner'}
                </h3>
                
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage 
                      src={getAvatarUrl(owner.avatar_url)} 
                    />
                    <AvatarFallback>{displayName?.charAt(0)?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-lg">{displayName}</span>
                      {owner.is_verified && (
                        <BadgeCheck className="h-5 w-5 text-primary" />
                      )}
                      {owner.is_banned && (
                        <Badge variant="destructive" className="gap-1">
                          <Ban className="h-3 w-3" />
                          {language === 'ar' ? 'محظور' : 'Banned'}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground">@{owner.username}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {owner.followers_count || 0} {language === 'ar' ? 'متابع' : 'followers'}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {owner.posts_count || 0} {language === 'ar' ? 'منشور' : 'posts'}
                      </span>
                    </div>
                    
                    {owner.created_at && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {language === 'ar' ? 'انضم في: ' : 'Joined: '}
                        {format(new Date(owner.created_at), 'MMM d, yyyy', {
                          locale: language === 'ar' ? ar : enUS
                        })}
                      </p>
                    )}
                    
                    {owner.is_banned && owner.ban_reason && (
                      <div className="p-2 rounded bg-destructive/10 text-sm">
                        <span className="font-medium text-destructive">
                          {language === 'ar' ? 'سبب الحظر: ' : 'Ban reason: '}
                        </span>
                        {owner.ban_reason}
                      </div>
                    )}
                    
                    <Link 
                      to={`/profile/${owner.username}`}
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      {language === 'ar' ? 'عرض الملف الشخصي' : 'View Profile'}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
            
            {/* Post Content */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">
                {language === 'ar' ? 'محتوى المنشور' : 'Post Content'}
              </h3>
              
              <div className="p-4 rounded-lg border bg-card">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>
                
                {/* Post Media */}
                {post.media && post.media.length > 0 && (
                  <div className={`mt-4 grid gap-2 ${
                    post.media.length === 1 ? 'grid-cols-1' : 
                    post.media.length === 2 ? 'grid-cols-2' : 
                    'grid-cols-2'
                  }`}>
                    {post.media.slice(0, 4).map((media, index) => (
                      <div key={media.id} className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                        {media.media_type === 'video' ? (
                          <video 
                            src={media.media_url} 
                            className="w-full h-full object-cover"
                            controls
                          />
                        ) : (
                          <img 
                            src={media.media_url} 
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                        {index === 3 && post.media.length > 4 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-white text-xl font-bold">
                              +{post.media.length - 4}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Post Stats */}
                <div className="flex items-center gap-4 mt-4 pt-3 border-t text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {post.likes_count || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    {post.comments_count || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {post.views_count || 0}
                  </span>
                  <span className="ms-auto flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(post.created_at), 'MMM d, yyyy HH:mm', {
                      locale: language === 'ar' ? ar : enUS
                    })}
                  </span>
                </div>
                
                {/* Post Status Badges */}
                <div className="flex items-center gap-2 mt-3">
                  {post.is_hidden && (
                    <Badge variant="outline" className="text-warning border-warning">
                      {language === 'ar' ? 'مخفي' : 'Hidden'}
                    </Badge>
                  )}
                  {!post.is_approved && (
                    <Badge variant="outline" className="text-destructive border-destructive">
                      {language === 'ar' ? 'غير معتمد' : 'Not Approved'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {/* View Post Link */}
            {post.slug && (
              <div className="flex justify-center">
                <Link to={`/post/${post.slug}`}>
                  <Button variant="outline" className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    {language === 'ar' ? 'عرض المنشور' : 'View Post'}
                  </Button>
                </Link>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-6 pt-4 border-t">
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {/* Hide/Show Post */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleHidePost}
                disabled={isHiding}
                className="gap-1"
              >
                {isHiding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
                {post.is_hidden 
                  ? (language === 'ar' ? 'إظهار' : 'Show')
                  : (language === 'ar' ? 'إخفاء' : 'Hide')
                }
              </Button>
              
              {/* Delete Post */}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isDeleting}
                className="gap-1"
              >
                <Trash2 className="h-4 w-4" />
                {language === 'ar' ? 'حذف المنشور' : 'Delete Post'}
              </Button>
              
              {/* Ban User */}
              {owner && !owner.is_banned && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowBanDialog(true)}
                  disabled={isBanning}
                  className="gap-1"
                >
                  <Ban className="h-4 w-4" />
                  {language === 'ar' ? 'حظر المستخدم' : 'Ban User'}
                </Button>
              )}
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto sm:ms-auto">
              {/* Dismiss Report */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDismissReport}
                disabled={isDismissing}
                className="gap-1"
              >
                {isDismissing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                {language === 'ar' ? 'رفض البلاغ' : 'Dismiss'}
              </Button>
              
              {/* Resolve Report */}
              <Button
                variant="default"
                size="sm"
                onClick={handleResolveReport}
                disabled={isResolving}
                className="gap-1"
              >
                {isResolving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                {language === 'ar' ? 'حل البلاغ' : 'Resolve'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {language === 'ar' ? 'تأكيد حذف المنشور' : 'Confirm Delete Post'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar' 
                ? 'هل أنت متأكد من حذف هذا المنشور؟ لا يمكن التراجع عن هذا الإجراء.'
                : 'Are you sure you want to delete this post? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin me-2" />
              ) : null}
              {language === 'ar' ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Ban User Confirmation Dialog */}
      <AlertDialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-destructive" />
              {language === 'ar' ? 'تأكيد حظر المستخدم' : 'Confirm Ban User'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                {language === 'ar' 
                  ? `هل أنت متأكد من حظر ${displayName}؟ سيتم منعه من الوصول إلى حسابه.`
                  : `Are you sure you want to ban ${displayName}? They will be blocked from accessing their account.`}
              </p>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === 'ar' ? 'سبب الحظر (اختياري):' : 'Ban reason (optional):'}
                </label>
                <Textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل سبب الحظر...' : 'Enter ban reason...'}
                  className="min-h-[80px]"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBanReason('')}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBanUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isBanning}
            >
              {isBanning ? (
                <Loader2 className="h-4 w-4 animate-spin me-2" />
              ) : null}
              {language === 'ar' ? 'حظر' : 'Ban'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
