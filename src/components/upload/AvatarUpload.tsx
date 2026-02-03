import { useRef, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAvatarUpload } from '@/hooks/useFileUpload';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  currentUrl?: string | null;
  onUploadComplete?: (url: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
};

export function AvatarUpload({ currentUrl, onUploadComplete, size = 'md' }: AvatarUploadProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
  const { mutate: upload, isPending, progress } = useAvatarUpload();

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
          title: language === 'ar' ? 'تم تحديث الصورة' : 'Avatar updated',
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

  const displayUrl = preview || currentUrl;

  return (
    <div className="relative group">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileSelect}
        disabled={isPending}
      />
      
      <div
        className={cn(
          'relative rounded-full overflow-hidden bg-muted cursor-pointer',
          sizeClasses[size],
          isPending && 'pointer-events-none'
        )}
        onClick={() => inputRef.current?.click()}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Camera className="h-6 w-6 text-muted-foreground" />
          </div>
        )}

        {/* Overlay */}
        {!isPending && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="h-6 w-6 text-white" />
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
        <div className="absolute -bottom-2 left-0 right-0">
          <Progress value={progress} className="h-1" />
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center mt-2">
        {language === 'ar' ? 'انقر لتغيير الصورة' : 'Click to change'}
      </p>
    </div>
  );
}
