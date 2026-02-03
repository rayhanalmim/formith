import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCoverUpload } from '@/hooks/useFileUpload';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getCoverUrl } from '@/lib/default-images';

interface CoverUploadProps {
  currentUrl?: string | null;
  onUploadComplete?: (url: string) => void;
}

export function CoverUpload({ currentUrl, onUploadComplete }: CoverUploadProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
  const { mutate: upload, isPending, progress } = useCoverUpload();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    upload(file, {
      onSuccess: (result) => {
        toast({
          title: language === 'ar' ? 'تم تحديث الغلاف' : 'Cover updated',
        });
        onUploadComplete?.(result.url);
        setPreview(null);
      },
      onError: (error) => {
        toast({
          title: language === 'ar' ? 'خطأ في الرفع' : 'Upload failed',
          description: error.message,
          variant: 'destructive',
        });
        setPreview(null);
      },
    });

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const displayUrl = preview || getCoverUrl(currentUrl);

  return (
    <div className="relative group">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
        disabled={isPending}
      />
      
      <div
        className={cn(
          'relative w-full h-32 md:h-40 rounded-lg overflow-hidden bg-muted cursor-pointer',
          isPending && 'pointer-events-none'
        )}
        onClick={() => inputRef.current?.click()}
      >
        <img
          src={displayUrl}
          alt="Cover"
          className="w-full h-full object-cover"
        />

        {/* Overlay */}
        {!isPending && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="flex flex-col items-center gap-1 text-white">
              <Camera className="h-6 w-6" />
              <span className="text-xs">
                {language === 'ar' ? 'تغيير الغلاف' : 'Change Cover'}
              </span>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isPending && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Progress bar */}
      {isPending && progress > 0 && (
        <div className="absolute bottom-0 left-0 right-0">
          <Progress value={progress} className="h-1" />
        </div>
      )}
    </div>
  );
}
