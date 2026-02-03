import { useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface UseBackgroundRemovalOptions {
  onSuccess?: (imageUrl: string) => void;
  onError?: (error: Error) => void;
}

export function useBackgroundRemoval(options?: UseBackgroundRemovalOptions) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const { language } = useLanguage();

  const removeBackground = async (file: File): Promise<string | null> => {
    setIsProcessing(true);
    setProgress(10);

    try {
      // Convert file to base64
      const base64 = await fileToBase64(file);
      setProgress(30);

      // Call Node.js API
      const response = await api.removeBackground(base64);

      setProgress(80);

      if (!response.success) {
        throw new Error(response.error || 'Failed to remove background');
      }

      if (!response.data?.imageUrl) {
        throw new Error('No processed image returned');
      }

      const data = response.data;

      setProgress(100);
      
      toast({
        title: language === 'ar' ? 'تمت إزالة الخلفية' : 'Background removed',
        description: language === 'ar' ? 'تم معالجة الصورة بنجاح' : 'Image processed successfully',
      });

      options?.onSuccess?.(data.imageUrl);
      return data.imageUrl;

    } catch (error) {
      console.error('[useBackgroundRemoval] Error:', error);
      const err = error instanceof Error ? error : new Error('Unknown error');
      
      toast({
        title: language === 'ar' ? 'فشل إزالة الخلفية' : 'Background removal failed',
        description: err.message,
        variant: 'destructive',
      });

      options?.onError?.(err);
      return null;
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return {
    removeBackground,
    isProcessing,
    progress,
  };
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix to get just the base64
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
