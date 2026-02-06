import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getAvatarUrl } from '@/lib/default-images';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { 
  BadgeCheck, 
  Ban, 
  MessageCircle,
  Calendar,
  Heart,
  ExternalLink,
  Trash2,
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

interface CommentOwner {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
  is_banned: boolean | null;
  ban_reason: string | null;
}

interface ReportedComment {
  id: string;
  content: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  likes_count: number | null;
  is_hidden: boolean | null;
  created_at: string;
  owner: CommentOwner | null;
  post: {
    content: string | null;
    slug: string | null;
  } | null;
}

interface ReportCommentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comment: ReportedComment | null;
  reportReason: string;
  reportId: string;
  onActionComplete?: () => void;
}

export function ReportCommentPreviewDialog({ 
  open, 
  onOpenChange, 
  comment,
  reportReason,
  reportId,
  onActionComplete
}: ReportCommentPreviewDialogProps) {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBanning, setIsBanning] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [banReason, setBanReason] = useState('');
  
  if (!comment) return null;
  
  const owner = comment.owner;
  const displayName = language === 'ar' 
    ? (owner?.display_name || owner?.username)
    : (owner?.display_name || owner?.username);

  const handleDeleteComment = async () => {
    setIsDeleting(true);
    try {
      await api.adminDeleteComment(comment.id);
      
      // Auto-resolve the report
      await api.updateReportStatus(
        reportId, 
        'resolved', 
        'admin', 
        language === 'ar' ? 'تم حذف التعليق' : 'Comment deleted'
      );
      
      toast({
        title: language === 'ar' ? 'تم حذف التعليق' : 'Comment deleted',
        description: language === 'ar' ? 'تم حذف التعليق بنجاح' : 'The comment has been deleted successfully',
      });
      
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['pending-reports-count'] });
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      onActionComplete?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error instanceof Error ? error.message : (language === 'ar' ? 'فشل في حذف التعليق' : 'Failed to delete comment'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleBanUser = async () => {
    if (!owner) return;
    
    setIsBanning(true);
    try {
      const reason = banReason || (language === 'ar' ? 'انتهاك قواعد المجتمع' : 'Violation of community guidelines');
      
      // Use the admin API endpoint for proper backend handling
      await api.toggleUserBan(owner.user_id, true, reason);
      
      // Try to send ban notification email
      try {
        await api.sendBanNotification(owner.user_id, true, reason, language);
      } catch (emailError) {
        console.warn('Failed to send ban notification email:', emailError);
      }
      
      // Auto-resolve the report
      await api.updateReportStatus(
        reportId, 
        'resolved', 
        'admin', 
        language === 'ar' ? 'تم حظر المستخدم' : 'User banned'
      );
      
      toast({
        title: language === 'ar' ? 'تم حظر المستخدم' : 'User banned',
        description: language === 'ar' ? 'تم حظر المستخدم بنجاح' : 'The user has been banned successfully',
      });
      
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['pending-reports-count'] });
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
      queryClient.invalidateQueries({ queryKey: ['pending-reports-count'] });
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
      queryClient.invalidateQueries({ queryKey: ['pending-reports-count'] });
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
              <MessageCircle className="h-5 w-5 text-destructive" />
              {language === 'ar' ? 'تفاصيل التعليق المُبلَّغ عنه' : 'Reported Comment Details'}
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

            {/* Comment Type Badge */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <MessageCircle className="h-3 w-3" />
                {language === 'ar' ? 'تعليق' : 'Comment'}
              </Badge>
              {comment.parent_id && (
                <Badge variant="secondary" className="text-xs">
                  {language === 'ar' ? 'رد' : 'Reply'}
                </Badge>
              )}
            </div>
            
            {/* Comment Owner Info */}
            {owner && (
              <div className="p-4 rounded-lg bg-muted/50 space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  {language === 'ar' ? 'صاحب التعليق' : 'Comment Author'}
                </h3>
                
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={getAvatarUrl(owner.avatar_url)} />
                    <AvatarFallback>{displayName?.charAt(0)?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{displayName}</span>
                      {owner.is_verified && (
                        <BadgeCheck className="h-4 w-4 text-primary" />
                      )}
                      {owner.is_banned && (
                        <Badge variant="destructive" className="gap-1">
                          <Ban className="h-3 w-3" />
                          {language === 'ar' ? 'محظور' : 'Banned'}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground">@{owner.username}</p>
                    
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
            
            {/* Comment Content */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">
                {language === 'ar' ? 'محتوى التعليق' : 'Comment Content'}
              </h3>
              
              <div className="p-4 rounded-lg border bg-card">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{comment.content}</p>
                
                {/* Comment Stats */}
                <div className="flex items-center gap-4 mt-4 pt-3 border-t text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {comment.likes_count || 0}
                  </span>
                  <span className="ms-auto flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(comment.created_at), 'MMM d, yyyy HH:mm', {
                      locale: language === 'ar' ? ar : enUS
                    })}
                  </span>
                </div>

                {/* Comment Status */}
                {comment.is_hidden && (
                  <div className="mt-3">
                    <Badge variant="outline" className="text-warning border-warning">
                      {language === 'ar' ? 'مخفي' : 'Hidden'}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Parent Post Context */}
            {comment.post && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  {language === 'ar' ? 'المنشور الأصلي' : 'Original Post'}
                </h3>
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {comment.post.content?.substring(0, 200)}
                    {(comment.post.content?.length || 0) > 200 ? '...' : ''}
                  </p>
                  {comment.post.slug && (
                    <Link 
                      to={`/post/${comment.post.slug}`}
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                    >
                      {language === 'ar' ? 'عرض المنشور' : 'View Post'}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-6 pt-4 border-t">
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {/* Delete Comment */}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isDeleting}
                className="gap-1"
              >
                <Trash2 className="h-4 w-4" />
                {language === 'ar' ? 'حذف التعليق' : 'Delete Comment'}
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
              {language === 'ar' ? 'تأكيد حذف التعليق' : 'Confirm Delete Comment'}
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
              onClick={handleDeleteComment}
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
