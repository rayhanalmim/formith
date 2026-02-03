/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminReports, useResolveReport } from '@/hooks/useAdmin';
import { getAvatarUrl } from '@/lib/default-images';
import { useRealtimeReports } from '@/hooks/useRealtimeReports';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ReportPostPreviewDialog } from '@/components/admin/ReportPostPreviewDialog';
import { Flag, CheckCircle, XCircle, Clock, FileText, MessageCircle, User, Eye, BadgeCheck, Ban } from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

export default function AdminReports() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { data: reports, isLoading, refetch } = useAdminReports();
  const resolveReport = useResolveReport();
  
  // Subscribe to realtime updates for reports
  useRealtimeReports();
  
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [resolveAction, setResolveAction] = useState<'resolved' | 'dismissed'>('resolved');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewReport, setPreviewReport] = useState<any>(null);
  
  const pendingReports = reports?.filter(r => r.status === 'pending') || [];
  const resolvedReports = reports?.filter(r => r.status === 'resolved') || [];
  const dismissedReports = reports?.filter(r => r.status === 'dismissed') || [];

  const handleResolveClick = (report: any, action: 'resolved' | 'dismissed') => {
    setSelectedReport(report);
    setResolveAction(action);
    setResolutionNotes('');
    setResolveDialogOpen(true);
  };

  const handlePreviewClick = (report: any) => {
    setPreviewReport(report);
    setPreviewDialogOpen(true);
  };

  const handleResolveConfirm = async () => {
    if (!selectedReport) return;
    
    try {
      await resolveReport.mutateAsync({
        reportId: selectedReport.id,
        status: resolveAction,
        notes: resolutionNotes || undefined,
      });
      
      toast({
        title: language === 'ar' ? 'تم التحديث' : 'Updated',
        description: resolveAction === 'resolved'
          ? (language === 'ar' ? 'تم حل البلاغ' : 'Report resolved')
          : (language === 'ar' ? 'تم رفض البلاغ' : 'Report dismissed'),
      });
      
      setResolveDialogOpen(false);
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getReportTypeIcon = (report: any) => {
    if (report.post_id) return FileText;
    if (report.comment_id) return MessageCircle;
    if (report.user_id) return User;
    return Flag;
  };

  const renderReportsTable = (reportsList: any[]) => (
    <div className="glass-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{language === 'ar' ? 'النوع' : 'Type'}</TableHead>
            <TableHead>{language === 'ar' ? 'المحتوى' : 'Content'}</TableHead>
            <TableHead>{language === 'ar' ? 'صاحب المنشور' : 'Post Owner'}</TableHead>
            <TableHead>{language === 'ar' ? 'السبب' : 'Reason'}</TableHead>
            <TableHead>{language === 'ar' ? 'المُبلِّغ' : 'Reporter'}</TableHead>
            <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
            <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
            <TableHead>{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reportsList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                {language === 'ar' ? 'لا توجد بلاغات' : 'No reports found'}
              </TableCell>
            </TableRow>
          ) : (
            reportsList.map((report) => {
              const TypeIcon = getReportTypeIcon(report);
              const reporter = report.reporter as any;
              const post = report.post as any;
              const postOwner = post?.owner;
              const ownerDisplayName = language === 'ar' 
                ? (postOwner?.display_name_ar || postOwner?.display_name || postOwner?.username)
                : (postOwner?.display_name || postOwner?.username);
              
              return (
                <TableRow key={report.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-muted">
                        <TypeIcon className="h-4 w-4" />
                      </div>
                      <span className="text-sm">
                        {report.post_id && (language === 'ar' ? 'منشور' : 'Post')}
                        {report.comment_id && (language === 'ar' ? 'تعليق' : 'Comment')}
                        {report.user_id && (language === 'ar' ? 'مستخدم' : 'User')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {post ? (
                      <div className="max-w-xs">
                        <p className="text-sm truncate">{post.content?.substring(0, 60)}...</p>
                        {post.media?.length > 0 && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {post.media.length} {language === 'ar' ? 'وسائط' : 'media'}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {postOwner ? (
                      <div className="flex items-center gap-2">
                        <img
                          src={getAvatarUrl(postOwner.avatar_url)}
                          alt=""
                          className="h-6 w-6 rounded-full bg-muted"
                        />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium">{ownerDisplayName}</span>
                            {postOwner.is_verified && (
                              <BadgeCheck className="h-3 w-3 text-primary" />
                            )}
                            {postOwner.is_banned && (
                              <Ban className="h-3 w-3 text-destructive" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">@{postOwner.username}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm max-w-xs truncate">{report.reason}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <img
                        src={getAvatarUrl(reporter?.avatar_url)}
                        alt=""
                        className="h-6 w-6 rounded-full bg-muted"
                      />
                      <span className="text-sm">
                        @{reporter?.username || 'unknown'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(report.created_at), 'MMM d, yyyy', {
                      locale: language === 'ar' ? ar : enUS
                    })}
                  </TableCell>
                  <TableCell>
                    {report.status === 'pending' && (
                      <Badge variant="outline" className="gap-1 text-warning border-warning">
                        <Clock className="h-3 w-3" />
                        {language === 'ar' ? 'معلق' : 'Pending'}
                      </Badge>
                    )}
                    {report.status === 'resolved' && (
                      <Badge variant="outline" className="gap-1 text-success border-success">
                        <CheckCircle className="h-3 w-3" />
                        {language === 'ar' ? 'تم الحل' : 'Resolved'}
                      </Badge>
                    )}
                    {report.status === 'dismissed' && (
                      <Badge variant="outline" className="gap-1 text-muted-foreground">
                        <XCircle className="h-3 w-3" />
                        {language === 'ar' ? 'مرفوض' : 'Dismissed'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {post && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreviewClick(report)}
                        >
                          <Eye className="h-4 w-4 me-1" />
                          {language === 'ar' ? 'عرض' : 'View'}
                        </Button>
                      )}
                      {report.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-success border-success hover:bg-success/10"
                            onClick={() => handleResolveClick(report, 'resolved')}
                          >
                            <CheckCircle className="h-4 w-4 me-1" />
                            {language === 'ar' ? 'حل' : 'Resolve'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResolveClick(report, 'dismissed')}
                          >
                            <XCircle className="h-4 w-4 me-1" />
                            {language === 'ar' ? 'رفض' : 'Dismiss'}
                          </Button>
                        </>
                      )}
                    </div>
                    {report.status !== 'pending' && report.resolution_notes && (
                      <p className="text-xs text-muted-foreground max-w-xs truncate mt-1">
                        {report.resolution_notes}
                      </p>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {language === 'ar' ? 'إدارة البلاغات' : 'Report Management'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'ar' 
            ? 'مراجعة وإدارة بلاغات المستخدمين' 
            : 'Review and manage user reports'}
        </p>
      </div>
      
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="glass-card">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            {language === 'ar' ? 'معلق' : 'Pending'}
            {pendingReports.length > 0 && (
              <Badge variant="destructive" className="h-5 min-w-5 px-1">
                {pendingReports.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="resolved" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            {language === 'ar' ? 'تم الحل' : 'Resolved'}
          </TabsTrigger>
          <TabsTrigger value="dismissed" className="gap-2">
            <XCircle className="h-4 w-4" />
            {language === 'ar' ? 'مرفوض' : 'Dismissed'}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="mt-4">
          {renderReportsTable(pendingReports)}
        </TabsContent>
        
        <TabsContent value="resolved" className="mt-4">
          {renderReportsTable(resolvedReports)}
        </TabsContent>
        
        <TabsContent value="dismissed" className="mt-4">
          {renderReportsTable(dismissedReports)}
        </TabsContent>
      </Tabs>
      
      {/* Post Preview Dialog */}
      <ReportPostPreviewDialog
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        post={previewReport?.post || null}
        reportReason={previewReport?.reason || ''}
        reportId={previewReport?.id || ''}
        onActionComplete={() => refetch()}
      />
      
      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>
              {resolveAction === 'resolved'
                ? (language === 'ar' ? 'حل البلاغ' : 'Resolve Report')
                : (language === 'ar' ? 'رفض البلاغ' : 'Dismiss Report')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                {language === 'ar' ? 'ملاحظات (اختياري)' : 'Notes (optional)'}
              </label>
              <Textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder={language === 'ar' ? 'أضف ملاحظات...' : 'Add notes...'}
                className="mt-2"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleResolveConfirm}
              disabled={resolveReport.isPending}
              className={resolveAction === 'resolved' ? 'bg-success hover:bg-success/90' : ''}
            >
              {resolveAction === 'resolved'
                ? (language === 'ar' ? 'حل' : 'Resolve')
                : (language === 'ar' ? 'رفض' : 'Dismiss')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
