import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminPosts, useModeratePost, useDeletePost, useBulkDeletePosts, useBulkModeratePosts } from '@/hooks/useAdmin';
import { getAvatarUrl } from '@/lib/default-images';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  MoreHorizontal, 
  CheckCircle, 
  EyeOff, 
  Pin, 
  Lock, 
  Unlock, 
  Trash2,
  Eye,
  ChevronDown
} from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function AdminPosts() {
  const { language } = useLanguage();
  const { toast } = useToast();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  
  const { data, isLoading } = useAdminPosts(currentPage, pageSize);
  const moderatePost = useModeratePost();
  const deletePost = useDeletePost();
  const bulkDeletePosts = useBulkDeletePosts();
  const bulkModeratePosts = useBulkModeratePosts();
  
  const posts = data?.posts || [];
  const totalPages = data?.totalPages || 1;
  const totalCount = data?.totalCount || 0;
  
  // Client-side search filtering on current page
  const filteredPosts = posts.filter(post => 
    post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (post.profiles as any)?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPosts(new Set(filteredPosts.map(p => p.id)));
    } else {
      setSelectedPosts(new Set());
    }
  };

  const handleSelectPost = (postId: string, checked: boolean) => {
    const newSelected = new Set(selectedPosts);
    if (checked) {
      newSelected.add(postId);
    } else {
      newSelected.delete(postId);
    }
    setSelectedPosts(newSelected);
  };

  const handleModerate = async (postId: string, action: 'approve' | 'hide' | 'pin' | 'unpin' | 'lock' | 'unlock') => {
    try {
      await moderatePost.mutateAsync({ postId, action });
      toast({
        title: language === 'ar' ? 'تم التحديث' : 'Updated',
        description: language === 'ar' ? 'تم تحديث المنشور' : 'Post updated successfully',
      });
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
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectedPosts.size === 0) return;
    setBulkDeleteDialogOpen(true);
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedPosts.size === 0) return;
    
    try {
      await bulkDeletePosts.mutateAsync(Array.from(selectedPosts));
      toast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
        description: language === 'ar' 
          ? `تم حذف ${selectedPosts.size} منشور` 
          : `${selectedPosts.size} posts deleted successfully`,
      });
      setSelectedPosts(new Set());
      setBulkDeleteDialogOpen(false);
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleBulkModerate = async (action: 'approve' | 'hide' | 'pin' | 'unpin') => {
    if (selectedPosts.size === 0) return;
    
    try {
      await bulkModeratePosts.mutateAsync({ postIds: Array.from(selectedPosts), action });
      
      const actionLabels: Record<string, { en: string; ar: string }> = {
        approve: { en: 'approved', ar: 'تمت الموافقة على' },
        hide: { en: 'hidden', ar: 'تم إخفاء' },
        pin: { en: 'pinned', ar: 'تم تثبيت' },
        unpin: { en: 'unpinned', ar: 'تم إلغاء تثبيت' },
      };
      
      toast({
        title: language === 'ar' ? 'تم التحديث' : 'Updated',
        description: language === 'ar' 
          ? `${actionLabels[action].ar} ${selectedPosts.size} منشور`
          : `${selectedPosts.size} posts ${actionLabels[action].en} successfully`,
      });
      setSelectedPosts(new Set());
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const isAllSelected = filteredPosts.length > 0 && selectedPosts.size === filteredPosts.length;
  const isSomeSelected = selectedPosts.size > 0 && selectedPosts.size < filteredPosts.length;
  const isBulkLoading = bulkDeletePosts.isPending || bulkModeratePosts.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {language === 'ar' ? 'إدارة المنشورات' : 'Post Management'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' 
              ? 'مراجعة وإدارة المنشورات' 
              : 'Review and manage posts'}
          </p>
        </div>
        
        {selectedPosts.size > 0 && (
          <div className="flex items-center gap-2">
            {/* Bulk Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isBulkLoading}>
                  {language === 'ar' ? 'إجراءات جماعية' : 'Bulk Actions'}
                  <ChevronDown className="h-4 w-4 ms-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-card">
                <DropdownMenuItem onClick={() => handleBulkModerate('approve')}>
                  <CheckCircle className="h-4 w-4 me-2 text-success" />
                  {language === 'ar' ? `موافقة على ${selectedPosts.size} منشور` : `Approve ${selectedPosts.size} Posts`}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkModerate('hide')}>
                  <EyeOff className="h-4 w-4 me-2" />
                  {language === 'ar' ? `إخفاء ${selectedPosts.size} منشور` : `Hide ${selectedPosts.size} Posts`}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkModerate('pin')}>
                  <Pin className="h-4 w-4 me-2" />
                  {language === 'ar' ? `تثبيت ${selectedPosts.size} منشور` : `Pin ${selectedPosts.size} Posts`}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkModerate('unpin')}>
                  <Pin className="h-4 w-4 me-2 opacity-50" />
                  {language === 'ar' ? `إلغاء تثبيت ${selectedPosts.size} منشور` : `Unpin ${selectedPosts.size} Posts`}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={handleBulkDeleteClick}
                >
                  <Trash2 className="h-4 w-4 me-2" />
                  {language === 'ar' ? `حذف ${selectedPosts.size} منشور` : `Delete ${selectedPosts.size} Posts`}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <span className="text-sm text-muted-foreground">
              {language === 'ar' 
                ? `تم تحديد ${selectedPosts.size} منشور` 
                : `${selectedPosts.size} selected`}
            </span>
          </div>
        )}
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
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) {
                      (el as any).indeterminate = isSomeSelected;
                    }
                  }}
                  onCheckedChange={handleSelectAll}
                  aria-label={language === 'ar' ? 'تحديد الكل' : 'Select all'}
                />
              </TableHead>
              <TableHead>{language === 'ar' ? 'المستخدم' : 'Author'}</TableHead>
              <TableHead>{language === 'ar' ? 'المحتوى' : 'Content'}</TableHead>
              <TableHead>{language === 'ar' ? 'القسم' : 'Category'}</TableHead>
              <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
              <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
              <TableHead>{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                </TableCell>
              </TableRow>
            ) : filteredPosts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {language === 'ar' ? 'لا توجد منشورات' : 'No posts found'}
                </TableCell>
              </TableRow>
            ) : (
              filteredPosts.map((post) => {
                const profile = post.profiles as any;
                const category = post.categories as any;
                const isSelected = selectedPosts.has(post.id);
                
                return (
                  <TableRow key={post.id} className={isSelected ? 'bg-muted/50' : ''}>
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectPost(post.id, !!checked)}
                        aria-label={language === 'ar' ? 'تحديد' : 'Select'}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={getAvatarUrl(profile?.avatar_url)}
                          alt=""
                          className="h-8 w-8 rounded-full bg-muted object-cover"
                        />
                        <span className="font-medium text-sm">
                          @{profile?.username || 'unknown'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate text-sm">
                        {post.content?.substring(0, 100)}...
                      </p>
                    </TableCell>
                    <TableCell>
                      {category ? (
                        <Badge variant="outline">
                          {language === 'ar' ? category.name_ar : category.name_en}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {!post.is_approved && (
                          <Badge variant="outline" className="text-warning border-warning">
                            {language === 'ar' ? 'معلق' : 'Pending'}
                          </Badge>
                        )}
                        {post.is_hidden && (
                          <Badge variant="destructive">
                            {language === 'ar' ? 'مخفي' : 'Hidden'}
                          </Badge>
                        )}
                        {post.is_pinned && (
                          <Badge className="bg-secondary text-secondary-foreground">
                            {language === 'ar' ? 'مثبت' : 'Pinned'}
                          </Badge>
                        )}
                        {post.is_locked && (
                          <Badge variant="outline">
                            {language === 'ar' ? 'مقفل' : 'Locked'}
                          </Badge>
                        )}
                        {post.is_approved && !post.is_hidden && !post.is_pinned && !post.is_locked && (
                          <Badge variant="outline" className="text-success border-success">
                            {language === 'ar' ? 'نشط' : 'Active'}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(post.created_at), 'MMM d, yyyy', {
                        locale: language === 'ar' ? ar : enUS
                      })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass-card">
                          {!post.is_approved && (
                            <DropdownMenuItem onClick={() => handleModerate(post.id, 'approve')}>
                              <CheckCircle className="h-4 w-4 me-2 text-success" />
                              {language === 'ar' ? 'موافقة' : 'Approve'}
                            </DropdownMenuItem>
                          )}
                          
                          {post.is_hidden ? (
                            <DropdownMenuItem onClick={() => handleModerate(post.id, 'approve')}>
                              <Eye className="h-4 w-4 me-2" />
                              {language === 'ar' ? 'إظهار' : 'Show'}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleModerate(post.id, 'hide')}>
                              <EyeOff className="h-4 w-4 me-2" />
                              {language === 'ar' ? 'إخفاء' : 'Hide'}
                            </DropdownMenuItem>
                          )}
                          
                          {post.is_pinned ? (
                            <DropdownMenuItem onClick={() => handleModerate(post.id, 'unpin')}>
                              <Pin className="h-4 w-4 me-2" />
                              {language === 'ar' ? 'إلغاء التثبيت' : 'Unpin'}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleModerate(post.id, 'pin')}>
                              <Pin className="h-4 w-4 me-2" />
                              {language === 'ar' ? 'تثبيت' : 'Pin'}
                            </DropdownMenuItem>
                          )}
                          
                          {post.is_locked ? (
                            <DropdownMenuItem onClick={() => handleModerate(post.id, 'unlock')}>
                              <Unlock className="h-4 w-4 me-2" />
                              {language === 'ar' ? 'فتح القفل' : 'Unlock'}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleModerate(post.id, 'lock')}>
                              <Lock className="h-4 w-4 me-2" />
                              {language === 'ar' ? 'قفل' : 'Lock'}
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeleteClick(post.id)}
                          >
                            <Trash2 className="h-4 w-4 me-2" />
                            {language === 'ar' ? 'حذف' : 'Delete'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Page Size Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {language === 'ar' ? 'عرض:' : 'Show:'}
            </span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setCurrentPage(1);
                setSelectedPosts(new Set());
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-card">
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              {language === 'ar' 
                ? `من إجمالي ${totalCount} منشور`
                : `of ${totalCount} posts`}
            </span>
          </div>
          
          {/* Pagination */}
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => {
                    setCurrentPage((prev) => Math.max(1, prev - 1));
                    setSelectedPosts(new Set());
                  }}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {/* First page */}
              {currentPage > 2 && (
                <>
                  <PaginationItem>
                    <PaginationLink
                      onClick={() => {
                        setCurrentPage(1);
                        setSelectedPosts(new Set());
                      }}
                      className="cursor-pointer"
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>
                  {currentPage > 3 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                </>
              )}
              
              {/* Current page and neighbors */}
              {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(currentPage - 1, totalPages - 2)) + i;
                if (pageNum < 1 || pageNum > totalPages) return null;
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => {
                        setCurrentPage(pageNum);
                        setSelectedPosts(new Set());
                      }}
                      isActive={currentPage === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              {/* Last page */}
              {currentPage < totalPages - 1 && (
                <>
                  {currentPage < totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationLink
                      onClick={() => {
                        setCurrentPage(totalPages);
                        setSelectedPosts(new Set());
                      }}
                      className="cursor-pointer"
                    >
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}
              
              <PaginationItem>
                <PaginationNext
                  onClick={() => {
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                    setSelectedPosts(new Set());
                  }}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
      
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

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ar' ? 'حذف المنشورات المحددة' : 'Delete Selected Posts'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar' 
                ? `هل أنت متأكد من حذف ${selectedPosts.size} منشور؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete ${selectedPosts.size} posts? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={bulkDeletePosts.isPending}
            >
              {bulkDeletePosts.isPending 
                ? (language === 'ar' ? 'جاري الحذف...' : 'Deleting...')
                : (language === 'ar' ? 'حذف' : 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}