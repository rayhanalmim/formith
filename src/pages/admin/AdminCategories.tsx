import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, useReorderCategories } from '@/hooks/useAdmin';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
import { Switch } from '@/components/ui/switch';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, GripVertical, Download } from 'lucide-react';
import { exportToCSV, formatDateForCSV } from '@/lib/csv-export';

const categorySchema = z.object({
  name_en: z.string().min(2, 'Name must be at least 2 characters'),
  name_ar: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  description_en: z.string().optional(),
  description_ar: z.string().optional(),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  is_active: z.boolean().default(true),
  allow_posting: z.boolean().default(true),
  allow_comments: z.boolean().default(true),
  require_approval: z.boolean().default(false),
  sort_order: z.number().default(0),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface SortableRowProps {
  category: any;
  language: 'ar' | 'en';
  onEdit: (category: any) => void;
  onDelete: (categoryId: string) => void;
}

function SortableRow({ category, language, onEdit, onDelete }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className={isDragging ? 'bg-muted/50' : ''}>
      <TableCell>
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell>
        <div>
          <p className="font-medium">
            {language === 'ar' ? category.name_ar : category.name_en}
          </p>
          <p className="text-sm text-muted-foreground">
            {language === 'ar' ? category.name_en : category.name_ar}
          </p>
        </div>
      </TableCell>
      <TableCell className="font-mono text-sm">
        {category.slug}
      </TableCell>
      <TableCell>
        {category.is_active ? (
          <Badge variant="outline" className="text-success border-success">
            {language === 'ar' ? 'نشط' : 'Active'}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            {language === 'ar' ? 'معطل' : 'Inactive'}
          </Badge>
        )}
      </TableCell>
      <TableCell>
        {category.posts_count || 0}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(category)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(category.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function AdminCategories() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { data: categories, isLoading } = useAdminCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const reorderCategories = useReorderCategories();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name_en: '',
      name_ar: '',
      description_en: '',
      description_ar: '',
      slug: '',
      is_active: true,
      allow_posting: true,
      allow_comments: true,
      require_approval: false,
      sort_order: 0,
    },
  });

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && categories) {
      const oldIndex = categories.findIndex((c) => c.id === active.id);
      const newIndex = categories.findIndex((c) => c.id === over.id);

      const reorderedCategories = arrayMove(categories, oldIndex, newIndex);
      
      // Create the ordered list with new sort_order values
      const orderedList = reorderedCategories.map((cat, index) => ({
        id: cat.id,
        sort_order: index,
      }));

      try {
        await reorderCategories.mutateAsync(orderedList);
        toast({
          title: language === 'ar' ? 'تم الترتيب' : 'Reordered',
          description: language === 'ar' ? 'تم حفظ ترتيب الأقسام' : 'Category order saved',
        });
      } catch (error: any) {
        toast({
          title: language === 'ar' ? 'خطأ' : 'Error',
          description: error.message,
          variant: 'destructive',
        });
      }
    }
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    form.reset({
      name_en: '',
      name_ar: '',
      description_en: '',
      description_ar: '',
      slug: '',
      is_active: true,
      allow_posting: true,
      allow_comments: true,
      require_approval: false,
      sort_order: (categories?.length || 0) + 1,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (category: any) => {
    setEditingCategory(category);
    form.reset({
      name_en: category.name_en,
      name_ar: category.name_ar,
      description_en: category.description_en || '',
      description_ar: category.description_ar || '',
      slug: category.slug,
      is_active: category.is_active,
      allow_posting: category.allow_posting,
      allow_comments: category.allow_comments,
      require_approval: category.require_approval,
      sort_order: category.sort_order || 0,
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (categoryId: string) => {
    setDeletingCategoryId(categoryId);
    setDeleteDialogOpen(true);
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({ 
          id: editingCategory.id, 
          name_en: data.name_en,
          name_ar: data.name_ar,
          description_en: data.description_en,
          description_ar: data.description_ar,
          slug: data.slug,
          is_active: data.is_active,
          allow_posting: data.allow_posting,
          allow_comments: data.allow_comments,
          require_approval: data.require_approval,
          sort_order: data.sort_order,
        });
        toast({
          title: language === 'ar' ? 'تم التحديث' : 'Updated',
          description: language === 'ar' ? 'تم تحديث القسم' : 'Category updated successfully',
        });
      } else {
        await createCategory.mutateAsync({
          name_en: data.name_en,
          name_ar: data.name_ar,
          description_en: data.description_en,
          description_ar: data.description_ar,
          slug: data.slug,
          is_active: data.is_active,
          allow_posting: data.allow_posting,
          allow_comments: data.allow_comments,
          require_approval: data.require_approval,
          sort_order: data.sort_order,
        });
        toast({
          title: language === 'ar' ? 'تم الإنشاء' : 'Created',
          description: language === 'ar' ? 'تم إنشاء القسم' : 'Category created successfully',
        });
      }
      setDialogOpen(false);
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCategoryId) return;
    
    try {
      await deleteCategory.mutateAsync(deletingCategoryId);
      toast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
        description: language === 'ar' ? 'تم حذف القسم' : 'Category deleted successfully',
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

  // Calculate total posts count
  const totalPostsCount = categories?.reduce((sum, cat) => sum + (cat.posts_count || 0), 0) || 0;

  const handleExportCategories = () => {
    if (!categories) return;
    
    exportToCSV(
      categories.map(cat => ({
        name_en: cat.name_en,
        name_ar: cat.name_ar,
        slug: cat.slug,
        is_active: cat.is_active ? 'Yes' : 'No',
        allow_posting: cat.allow_posting ? 'Yes' : 'No',
        allow_comments: cat.allow_comments ? 'Yes' : 'No',
        require_approval: cat.require_approval ? 'Yes' : 'No',
        posts_count: cat.posts_count || 0,
        sort_order: cat.sort_order || 0,
        created_at: formatDateForCSV(cat.created_at),
      })),
      'categories-export',
      [
        { key: 'name_en', header: 'Name (EN)' },
        { key: 'name_ar', header: 'Name (AR)' },
        { key: 'slug', header: 'Slug' },
        { key: 'is_active', header: 'Active' },
        { key: 'allow_posting', header: 'Allow Posting' },
        { key: 'allow_comments', header: 'Allow Comments' },
        { key: 'require_approval', header: 'Require Approval' },
        { key: 'posts_count', header: 'Posts Count' },
        { key: 'sort_order', header: 'Sort Order' },
        { key: 'created_at', header: 'Created At' },
      ]
    );
    
    toast({
      title: language === 'ar' ? 'تم التصدير' : 'Exported',
      description: language === 'ar' ? 'تم تصدير بيانات الأقسام' : 'Categories data exported successfully',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {language === 'ar' ? 'إدارة الأقسام' : 'Category Management'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' 
              ? 'إضافة وتعديل وحذف الأقسام - اسحب لإعادة الترتيب' 
              : 'Add, edit, and delete categories - drag to reorder'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExportCategories} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            {language === 'ar' ? 'تصدير CSV' : 'Export CSV'}
          </Button>
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            {language === 'ar' ? 'قسم جديد' : 'New Category'}
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">
            {language === 'ar' ? 'إجمالي الأقسام' : 'Total Categories'}
          </p>
          <p className="text-2xl font-bold">{categories?.length || 0}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">
            {language === 'ar' ? 'إجمالي المنشورات' : 'Total Posts'}
          </p>
          <p className="text-2xl font-bold">{totalPostsCount}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">
            {language === 'ar' ? 'أقسام نشطة' : 'Active Categories'}
          </p>
          <p className="text-2xl font-bold">{categories?.filter(c => c.is_active).length || 0}</p>
        </div>
      </div>
      
      {/* Categories Table */}
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>{language === 'ar' ? 'الاسم' : 'Name'}</TableHead>
              <TableHead>{language === 'ar' ? 'المعرف' : 'Slug'}</TableHead>
              <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
              <TableHead>{language === 'ar' ? 'المنشورات' : 'Posts'}</TableHead>
              <TableHead>{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                </TableCell>
              </TableRow>
            ) : categories?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {language === 'ar' ? 'لا توجد أقسام' : 'No categories found'}
                </TableCell>
              </TableRow>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={categories?.map(c => c.id) || []}
                  strategy={verticalListSortingStrategy}
                >
                  {categories?.map((category) => (
                    <SortableRow
                      key={category.id}
                      category={category}
                      language={language}
                      onEdit={handleOpenEdit}
                      onDelete={handleDeleteClick}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-card max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCategory 
                ? (language === 'ar' ? 'تعديل القسم' : 'Edit Category')
                : (language === 'ar' ? 'قسم جديد' : 'New Category')}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name (English)</FormLabel>
                      <FormControl>
                        <Input {...field} dir="ltr" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="name_ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم (عربي)</FormLabel>
                      <FormControl>
                        <Input {...field} dir="rtl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'المعرف' : 'Slug'}</FormLabel>
                    <FormControl>
                      <Input {...field} dir="ltr" placeholder="category-slug" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="description_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (English)</FormLabel>
                      <FormControl>
                        <Textarea {...field} dir="ltr" rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description_ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الوصف (عربي)</FormLabel>
                      <FormControl>
                        <Textarea {...field} dir="rtl" rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-4 pt-2">
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>{language === 'ar' ? 'نشط' : 'Active'}</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="allow_posting"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>{language === 'ar' ? 'السماح بالنشر' : 'Allow Posting'}</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="allow_comments"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>{language === 'ar' ? 'السماح بالتعليقات' : 'Allow Comments'}</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="require_approval"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>{language === 'ar' ? 'يتطلب موافقة' : 'Require Approval'}</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
                  {(createCategory.isPending || updateCategory.isPending) 
                    ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                    : (language === 'ar' ? 'حفظ' : 'Save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ar' ? 'حذف القسم' : 'Delete Category'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar' 
                ? 'هل أنت متأكد من حذف هذا القسم؟ لا يمكن التراجع عن هذا الإجراء.'
                : 'Are you sure you want to delete this category? This action cannot be undone.'}
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