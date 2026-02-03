import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePendingPosts, useModeratePost, useDeletePost } from '@/hooks/useAdmin';
import { getAvatarUrl } from '@/lib/default-images';
import { useRealtimePendingPosts } from '@/hooks/useRealtimePendingPosts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  Trash2,
  Clock,
  AlertCircle,
  Eye,
  MapPin,
  Smile,
  Calendar,
  User,
  Image as ImageIcon,
  Video,
  BadgeCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface PendingPost {
  id: string;
  content: string;
  slug: string | null;
  location: string | null;
  feeling: string | null;
  created_at: string;
  profiles: {
    id: string;
    user_id: string;
    username: string | null;
    display_name: string | null;
    display_name_ar: string | null;
    avatar_url: string | null;
    is_verified: boolean | null;
  };
  categories: {
    id: string;
    name_ar: string;
    name_en: string;
    slug: string;
  } | null;
  post_media?: {
    id: string;
    media_url: string;
    media_type: string;
    sort_order: number | null;
  }[];
}

export default function AdminPendingPosts() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { data: posts, isLoading } = usePendingPosts();
  const moderatePost = useModeratePost();
  const deletePost = useDeletePost();
  
  // Subscribe to realtime updates for pending posts
  useRealtimePendingPosts();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<PendingPost | null>(null);
  
  const filteredPosts = posts?.filter(post => 
    post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (post.profiles as any)?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handlePreview = (post: any) => {
    setSelectedPost(post as PendingPost);
    setPreviewDialogOpen(true);
  };

  const handleApprove = async (postId: string, closePreview = false) => {
    try {
      await moderatePost.mutateAsync({ postId, action: 'approve' });
      toast({
        title: language === 'ar' ? 'تمت الموافقة' : 'Approved',
        description: language === 'ar' ? 'تمت الموافقة على المنشور بنجاح' : 'Post approved successfully',
      });
      if (closePreview) {
        setPreviewDialogOpen(false);
        setSelectedPost(null);
      }
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRejectClick = (postId: string) => {
    setSelectedPostId(postId);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedPostId) return;
    
    try {
      await moderatePost.mutateAsync({ postId: selectedPostId, action: 'hide' });
      toast({
        title: language === 'ar' ? 'تم الرفض' : 'Rejected',
        description: language === 'ar' ? 'تم رفض المنشور وإخفاؤه' : 'Post rejected and hidden',
      });
      setRejectDialogOpen(false);
      setPreviewDialogOpen(false);
      setSelectedPost(null);
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClick = (postId: string) => {
    setSelectedPostId(postId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPostId) return;
    
    try {
      await deletePost.mutateAsync(selectedPostId);
      toast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
        description: language === 'ar' ? 'تم حذف المنشور' : 'Post deleted successfully',
      });
      setDeleteDialogOpen(false);
      setPreviewDialogOpen(false);
      setSelectedPost(null);
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleApproveAll = async () => {
    if (!filteredPosts.length) return;
    
    try {
      for (const post of filteredPosts) {
        await moderatePost.mutateAsync({ postId: post.id, action: 'approve' });
      }
      toast({
        title: language === 'ar' ? 'تمت الموافقة على الكل' : 'All Approved',
        description: language === 'ar' 
          ? `تمت الموافقة على ${filteredPosts.length} منشورات` 
          : `Approved ${filteredPosts.length} posts`,
      });
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6 text-warning" />
            {language === 'ar' ? 'المنشورات المعلقة' : 'Pending Posts'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' 
              ? 'مراجعة المنشورات التي تحتاج إلى موافقة' 
              : 'Review posts that require approval'}
          </p>
        </div>
        
        {filteredPosts.length > 0 && (
          <Button 
            onClick={handleApproveAll}
            className="gap-2"
            disabled={moderatePost.isPending}
          >
            <CheckCircle className="h-4 w-4" />
            {language === 'ar' ? `الموافقة على الكل (${filteredPosts.length})` : `Approve All (${filteredPosts.length})`}
          </Button>
        )}
      </div>
      
      {/* Stats */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-warning/20 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold">{posts?.length || 0}</p>
            <p className="text-sm text-muted-foreground">
              {language === 'ar' ? 'منشورات بانتظار الموافقة' : 'Posts awaiting approval'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={language === 'ar' ? 'البحث في المنشورات...' : 'Search posts...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ps-10"
        />
      </div>
      
      {/* Posts Table */}
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{language === 'ar' ? 'المستخدم' : 'Author'}</TableHead>
              <TableHead>{language === 'ar' ? 'المحتوى' : 'Content'}</TableHead>
              <TableHead>{language === 'ar' ? 'القسم' : 'Category'}</TableHead>
              <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
              <TableHead>{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                </TableCell>
              </TableRow>
            ) : filteredPosts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle className="h-12 w-12 text-success/50" />
                    <p className="font-medium">
                      {language === 'ar' ? 'لا توجد منشورات معلقة' : 'No pending posts'}
                    </p>
                    <p className="text-sm">
                      {language === 'ar' 
                        ? 'جميع المنشورات تمت مراجعتها' 
                        : 'All posts have been reviewed'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredPosts.map((post) => {
                const profile = post.profiles as any;
                const category = post.categories as any;
                const media = (post as any).post_media || [];
                
                return (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={getAvatarUrl(profile?.avatar_url)}
                          alt=""
                          className="h-10 w-10 rounded-full bg-muted"
                        />
                        <div>
                          <span className="font-medium block flex items-center gap-1">
                            {profile?.display_name || profile?.username}
                            {profile?.is_verified && (
                              <BadgeCheck className="h-4 w-4 text-primary fill-primary/20" />
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            @{profile?.username || 'unknown'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="line-clamp-2 text-sm">
                        {post.content}
                      </p>
                      {media.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          {media.some((m: any) => m.media_type === 'image') && (
                            <span className="flex items-center gap-0.5">
                              <ImageIcon className="h-3 w-3" />
                              {media.filter((m: any) => m.media_type === 'image').length}
                            </span>
                          )}
                          {media.some((m: any) => m.media_type === 'video') && (
                            <span className="flex items-center gap-0.5 ms-2">
                              <Video className="h-3 w-3" />
                              {media.filter((m: any) => m.media_type === 'video').length}
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {category ? (
                        <Badge variant="outline" className="text-warning border-warning">
                          {language === 'ar' ? category.name_ar : category.name_en}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {format(new Date(post.created_at), 'MMM d, yyyy HH:mm', {
                        locale: language === 'ar' ? ar : enUS
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => handlePreview(post)}
                        >
                          <Eye className="h-4 w-4" />
                          {language === 'ar' ? 'معاينة' : 'Preview'}
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          className="gap-1.5 bg-success hover:bg-success/90"
                          onClick={() => handleApprove(post.id)}
                          disabled={moderatePost.isPending}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-warning border-warning hover:bg-warning/10"
                          onClick={() => handleRejectClick(post.id)}
                          disabled={moderatePost.isPending}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteClick(post.id)}
                          disabled={deletePost.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="glass-card max-w-2xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {language === 'ar' ? 'معاينة المنشور' : 'Post Preview'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPost && (
            <ScrollArea className="max-h-[calc(90vh-180px)]">
              <div className="p-6 pt-4 space-y-4">
                {/* Author Info */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
                  <img
                    src={getAvatarUrl(selectedPost.profiles?.avatar_url)}
                    alt=""
                    className="h-12 w-12 rounded-full bg-muted ring-2 ring-background"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {language === 'ar' 
                          ? selectedPost.profiles?.display_name_ar || selectedPost.profiles?.display_name || selectedPost.profiles?.username
                          : selectedPost.profiles?.display_name || selectedPost.profiles?.username
                        }
                      </span>
                      {selectedPost.profiles?.is_verified && (
                        <BadgeCheck className="h-4 w-4 text-primary fill-primary/20" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>@{selectedPost.profiles?.username}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(selectedPost.created_at), 'PPp', {
                          locale: language === 'ar' ? ar : enUS
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Metadata */}
                <div className="flex flex-wrap gap-2">
                  {selectedPost.categories && (
                    <Badge variant="outline" className="text-warning border-warning">
                      {language === 'ar' ? selectedPost.categories.name_ar : selectedPost.categories.name_en}
                    </Badge>
                  )}
                  {selectedPost.location && (
                    <Badge variant="secondary" className="gap-1">
                      <MapPin className="h-3 w-3" />
                      {selectedPost.location}
                    </Badge>
                  )}
                  {selectedPost.feeling && (
                    <Badge variant="secondary" className="gap-1">
                      <Smile className="h-3 w-3" />
                      {selectedPost.feeling}
                    </Badge>
                  )}
                </div>
                
                {/* Content */}
                <div className="p-4 rounded-xl bg-background border">
                  <p className="whitespace-pre-wrap text-foreground leading-relaxed">
                    {selectedPost.content}
                  </p>
                </div>
                
                {/* Media */}
                {selectedPost.post_media && selectedPost.post_media.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      {language === 'ar' ? 'الوسائط' : 'Media'} ({selectedPost.post_media.length})
                    </h4>
                    <div className={`grid gap-2 ${
                      selectedPost.post_media.length === 1 ? 'grid-cols-1' : 
                      selectedPost.post_media.length === 2 ? 'grid-cols-2' : 
                      'grid-cols-2 md:grid-cols-3'
                    }`}>
                      {selectedPost.post_media.map((media) => (
                        <div key={media.id} className="relative rounded-lg overflow-hidden bg-muted aspect-video">
                          {media.media_type === 'video' ? (
                            <video
                              src={media.media_url}
                              controls
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <img
                              src={media.media_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
          
          {/* Action Buttons */}
          {selectedPost && (
            <div className="p-6 pt-0 flex items-center gap-3 border-t bg-muted/30">
              <Button
                className="flex-1 gap-2 bg-success hover:bg-success/90"
                onClick={() => handleApprove(selectedPost.id, true)}
                disabled={moderatePost.isPending}
              >
                <CheckCircle className="h-4 w-4" />
                {language === 'ar' ? 'موافقة' : 'Approve'}
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2 text-warning border-warning hover:bg-warning/10"
                onClick={() => handleRejectClick(selectedPost.id)}
                disabled={moderatePost.isPending}
              >
                <XCircle className="h-4 w-4" />
                {language === 'ar' ? 'رفض' : 'Reject'}
              </Button>
              <Button
                variant="outline"
                className="gap-2 text-destructive border-destructive hover:bg-destructive/10"
                onClick={() => handleDeleteClick(selectedPost.id)}
                disabled={deletePost.isPending}
              >
                <Trash2 className="h-4 w-4" />
                {language === 'ar' ? 'حذف' : 'Delete'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Reject Confirmation Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ar' ? 'رفض المنشور' : 'Reject Post'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar' 
                ? 'هل أنت متأكد من رفض هذا المنشور؟ سيتم إخفاؤه من العرض العام.'
                : 'Are you sure you want to reject this post? It will be hidden from public view.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRejectConfirm}
              className="bg-warning text-warning-foreground hover:bg-warning/90"
            >
              {language === 'ar' ? 'رفض' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ar' ? 'حذف المنشور' : 'Delete Post'}
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
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {language === 'ar' ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
