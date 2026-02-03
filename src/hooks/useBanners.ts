import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, Banner } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type { Banner };

export function useActiveBanners() {
  return useQuery({
    queryKey: ['banners', 'active'],
    queryFn: async (): Promise<Banner[]> => {
      const response = await api.getActiveBanners();
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - match Redis TTL
  });
}

export function useAllBanners() {
  return useQuery({
    queryKey: ['banners', 'all'],
    queryFn: async (): Promise<Banner[]> => {
      const response = await api.getAllBanners();
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - match Redis TTL
  });
}

export function useCreateBanner() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (banner: Omit<Banner, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      await api.createBanner({
        ...banner,
        created_by: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast.success(language === 'ar' ? 'تم إنشاء البانر' : 'Banner created');
    },
    onError: (error) => {
      console.error('Failed to create banner:', error);
      toast.error(language === 'ar' ? 'فشل إنشاء البانر' : 'Failed to create banner');
    },
  });
}

export function useUpdateBanner() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Banner> & { id: string }) => {
      await api.updateBanner(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast.success(language === 'ar' ? 'تم تحديث البانر' : 'Banner updated');
    },
    onError: (error) => {
      console.error('Failed to update banner:', error);
      toast.error(language === 'ar' ? 'فشل تحديث البانر' : 'Failed to update banner');
    },
  });
}

export function useDeleteBanner() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.deleteBanner(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast.success(language === 'ar' ? 'تم حذف البانر' : 'Banner deleted');
    },
    onError: (error) => {
      console.error('Failed to delete banner:', error);
      toast.error(language === 'ar' ? 'فشل حذف البانر' : 'Failed to delete banner');
    },
  });
}
