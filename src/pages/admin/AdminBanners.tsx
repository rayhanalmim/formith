import { useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAllBanners, useCreateBanner, useUpdateBanner, useDeleteBanner, Banner } from '@/hooks/useBanners';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Plus, Pencil, Trash2, ExternalLink, Loader2, Image, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

export default function AdminBanners() {
  const { language } = useLanguage();
  const { data: banners, isLoading } = useAllBanners();
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deletingBanner, setDeletingBanner] = useState<Banner | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setTitle('');
    setTitleAr('');
    setImageUrl('');
    setLinkUrl('');
    setIsActive(true);
    setSortOrder(0);
    setImageFile(null);
    setImagePreview('');
  };

  const openEditDialog = (banner: Banner) => {
    setEditingBanner(banner);
    setTitle(banner.title);
    setTitleAr(banner.title_ar || '');
    setImageUrl(banner.image_url);
    setImagePreview(banner.image_url);
    setLinkUrl(banner.link_url);
    setIsActive(banner.is_active);
    setSortOrder(banner.sort_order);
    setImageFile(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      return;
    }

    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setImageUrl('');
  };

  const uploadBannerImage = async (): Promise<string> => {
    if (!imageFile) return imageUrl;

    setIsUploading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const formData = new FormData();
      formData.append('file', imageFile, imageFile.name);
      formData.append('folder', 'banners');

      const response = await fetch(`${API_BASE_URL}/storage/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error || 'Upload failed');
      }

      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Upload failed');

      return result.data.url;
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreate = async () => {
    const uploadedUrl = await uploadBannerImage();
    await createBanner.mutateAsync({
      title,
      title_ar: titleAr || null,
      image_url: uploadedUrl,
      link_url: linkUrl,
      is_active: isActive,
      sort_order: sortOrder,
    });
    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!editingBanner) return;
    const uploadedUrl = await uploadBannerImage();
    await updateBanner.mutateAsync({
      id: editingBanner.id,
      title,
      title_ar: titleAr || null,
      image_url: uploadedUrl,
      link_url: linkUrl,
      is_active: isActive,
      sort_order: sortOrder,
    });
    setEditingBanner(null);
    resetForm();
  };

  const handleDelete = async () => {
    if (!deletingBanner) return;
    await deleteBanner.mutateAsync(deletingBanner.id);
    setDeletingBanner(null);
  };

  const handleToggleActive = async (banner: Banner) => {
    await updateBanner.mutateAsync({
      id: banner.id,
      is_active: !banner.is_active,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {language === 'ar' ? 'إدارة البانرات' : 'Banner Management'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'إدارة البانرات الترويجية في الصفحة الرئيسية' : 'Manage promotional banners on the feed page'}
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
          <Plus className="h-4 w-4 me-2" />
          {language === 'ar' ? 'إضافة بانر' : 'Add Banner'}
        </Button>
      </div>

      {/* Banners Table */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : banners && banners.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{language === 'ar' ? 'الصورة' : 'Image'}</TableHead>
                <TableHead>{language === 'ar' ? 'العنوان' : 'Title'}</TableHead>
                <TableHead>{language === 'ar' ? 'الرابط' : 'Link'}</TableHead>
                <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                <TableHead>{language === 'ar' ? 'الترتيب' : 'Order'}</TableHead>
                <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                <TableHead className="text-end">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banners.map(banner => (
                <TableRow key={banner.id}>
                  <TableCell>
                    <div className="w-20 h-12 rounded overflow-hidden bg-muted">
                      <img
                        src={banner.image_url}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{banner.title}</p>
                      {banner.title_ar && (
                        <p className="text-sm text-muted-foreground" dir="rtl">{banner.title_ar}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <a
                      href={banner.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-primary hover:underline max-w-[200px] truncate"
                    >
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{banner.link_url}</span>
                    </a>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={banner.is_active}
                      onCheckedChange={() => handleToggleActive(banner)}
                    />
                  </TableCell>
                  <TableCell>{banner.sort_order}</TableCell>
                  <TableCell>
                    {format(new Date(banner.created_at), 'dd MMM yyyy', {
                      locale: language === 'ar' ? ar : enUS,
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(banner)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingBanner(banner)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg">
          <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">
            {language === 'ar' ? 'لا توجد بانرات' : 'No banners yet'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {language === 'ar' ? 'أضف بانر للظهور في الصفحة الرئيسية' : 'Add a banner to display on the feed page'}
          </p>
          <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
            <Plus className="h-4 w-4 me-2" />
            {language === 'ar' ? 'إضافة بانر' : 'Add Banner'}
          </Button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || !!editingBanner} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setEditingBanner(null);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingBanner
                ? (language === 'ar' ? 'تعديل البانر' : 'Edit Banner')
                : (language === 'ar' ? 'إضافة بانر جديد' : 'Add New Banner')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  {language === 'ar' ? 'العنوان (English)' : 'Title (English)'}
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Banner title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="titleAr">
                  {language === 'ar' ? 'العنوان (عربي)' : 'Title (Arabic)'}
                </Label>
                <Input
                  id="titleAr"
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  placeholder="عنوان البانر"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                {language === 'ar' ? 'صورة البانر' : 'Banner Image'}
              </Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <p className="text-white text-sm font-medium">
                        {language === 'ar' ? 'تغيير الصورة' : 'Change Image'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-4">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'انقر لرفع صورة البانر' : 'Click to upload banner image'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG, WebP, GIF (max 10MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkUrl">
                {language === 'ar' ? 'رابط الوجهة' : 'Destination URL'}
              </Label>
              <Input
                id="linkUrl"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com/page"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sortOrder">
                  {language === 'ar' ? 'ترتيب العرض' : 'Sort Order'}
                </Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                  min={0}
                />
              </div>
              <div className="flex items-center justify-between pt-6">
                <Label htmlFor="isActive">
                  {language === 'ar' ? 'نشط' : 'Active'}
                </Label>
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setEditingBanner(null);
                resetForm();
              }}
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={editingBanner ? handleUpdate : handleCreate}
              disabled={!title || (!imageUrl && !imageFile) || !linkUrl || createBanner.isPending || updateBanner.isPending || isUploading}
            >
              {(createBanner.isPending || updateBanner.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin me-2" />
              )}
              {editingBanner
                ? (language === 'ar' ? 'تحديث' : 'Update')
                : (language === 'ar' ? 'إنشاء' : 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingBanner} onOpenChange={() => setDeletingBanner(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ar' ? 'حذف البانر' : 'Delete Banner'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar'
                ? 'هل أنت متأكد من حذف هذا البانر؟ لا يمكن التراجع عن هذا الإجراء.'
                : 'Are you sure you want to delete this banner? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteBanner.isPending && <Loader2 className="h-4 w-4 animate-spin me-2" />}
              {language === 'ar' ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
