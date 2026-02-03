import { useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { useRoomMediaUpload } from '@/hooks/useFileUpload';
import { Progress } from '@/components/ui/progress';
import { ImagePlus, Paperclip, X, Loader2, Video } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RoomMediaUploadProps {
  onUpload: (url: string, type: 'image' | 'file' | 'video') => void;
  disabled?: boolean;
}

export function RoomMediaUpload({ onUpload, disabled }: RoomMediaUploadProps) {
  const { language } = useLanguage();
  const [preview, setPreview] = useState<{ url: string; type: 'image' | 'file' | 'video'; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const { mutate: upload, isPending, progress } = useRoomMediaUpload();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB for images/files, 50MB for videos)
    const maxSize = type === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(language === 'ar' 
        ? `حجم الملف كبير جداً (الحد الأقصى ${type === 'video' ? '50' : '10'}MB)` 
        : `File too large (max ${type === 'video' ? '50' : '10'}MB)`);
      return;
    }

    // Validate image types
    if (type === 'image' && !file.type.startsWith('image/')) {
      toast.error(language === 'ar' ? 'يرجى اختيار صورة' : 'Please select an image');
      return;
    }

    // Validate video types
    if (type === 'video' && !file.type.startsWith('video/')) {
      toast.error(language === 'ar' ? 'يرجى اختيار فيديو' : 'Please select a video');
      return;
    }

    console.log('Room Media Upload - File info:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    if (type === 'video') {
      toast.info(language === 'ar' ? 'جاري معالجة الفيديو...' : 'Processing video...');
    }

    upload(file, {
      onSuccess: (result) => {
        // Set preview
        setPreview({
          url: result.url,
          type,
          name: file.name
        });

        onUpload(result.url, type);
        toast.success(language === 'ar' ? 'تم رفع الملف بنجاح' : 'File uploaded successfully');
      },
      onError: (error: any) => {
        console.error('Upload failed:', error);
        toast.error(error?.message || (language === 'ar' ? 'فشل رفع الملف' : 'Failed to upload file'));
      },
    });

    // Reset inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const clearPreview = () => {
    setPreview(null);
  };

  return (
    <div className="flex items-center gap-1">
      {/* Image Upload */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'image')}
        disabled={disabled || isPending}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => imageInputRef.current?.click()}
        disabled={disabled || isPending}
        title={language === 'ar' ? 'صورة' : 'Image'}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ImagePlus className="h-4 w-4" />
        )}
      </Button>

      {/* Video Upload */}
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'video')}
        disabled={disabled || isPending}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => videoInputRef.current?.click()}
        disabled={disabled || isPending}
        title={language === 'ar' ? 'فيديو' : 'Video'}
      >
        <Video className="h-4 w-4" />
      </Button>

      {/* File Upload */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'file')}
        disabled={disabled || isPending}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isPending}
        title={language === 'ar' ? 'ملف' : 'File'}
      >
        <Paperclip className="h-4 w-4" />
      </Button>

      {/* Progress bar when uploading */}
      {isPending && progress > 0 && (
        <div className="flex items-center gap-2 px-2">
          <Progress value={progress} className="h-1 w-16" />
          <span className="text-xs text-muted-foreground">{progress}%</span>
        </div>
      )}

      {/* Preview */}
      {preview && !isPending && (
        <div className={cn(
          "flex items-center gap-2 px-2 py-1 rounded-md bg-muted text-xs",
          preview.type === 'image' && "text-primary"
        )}>
          {preview.type === 'image' ? (
            <img src={preview.url} alt="" className="h-6 w-6 rounded object-cover" />
          ) : preview.type === 'video' ? (
            <Video className="h-4 w-4" />
          ) : (
            <Paperclip className="h-4 w-4" />
          )}
          <span className="max-w-[100px] truncate">{preview.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={clearPreview}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
