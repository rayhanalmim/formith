import { useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ImagePlus, FileText, Paperclip, Video, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface DMMediaUploadProps {
  onUpload: (url: string, type: 'image' | 'file' | 'video', file: File) => void;
  disabled?: boolean;
}

export function DMMediaUpload({ onUpload, disabled }: DMMediaUploadProps) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(language === 'ar' ? 'حجم الصورة كبير جداً' : 'Image too large (max 10MB)');
        return;
      }

      console.log('DM Upload - Image file selected for encryption:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      // Create a temporary URL for preview (actual upload with encryption happens on send)
      const previewUrl = URL.createObjectURL(file);
      onUpload(previewUrl, 'image', file);
      setIsOpen(false);
      // toast.success(
      //   language === 'ar' ? '🔒 سيتم تشفير الصورة عند الإرسال' : '🔒 Image will be encrypted on send'
      // );
    }
    e.target.value = '';
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(language === 'ar' ? 'حجم الفيديو كبير جداً (الحد 50MB)' : 'Video too large (max 50MB)');
        return;
      }

      console.log('DM Upload - Video file selected for encryption:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      // Create a temporary URL for preview
      const previewUrl = URL.createObjectURL(file);
      onUpload(previewUrl, 'video', file);
      setIsOpen(false);
      toast.success(
        language === 'ar' ? '🔒 سيتم تشفير الفيديو عند الإرسال' : '🔒 Video will be encrypted on send'
      );
    }
    e.target.value = '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        toast.error(language === 'ar' ? 'حجم الملف كبير جداً' : 'File too large (max 25MB)');
        return;
      }

      console.log('DM Upload - General file selected for encryption:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      // Create a temporary URL for preview
      const previewUrl = URL.createObjectURL(file);
      onUpload(previewUrl, 'file', file);
      setIsOpen(false);
      toast.success(
        language === 'ar' ? '🔒 سيتم تشفير الملف عند الإرسال' : '🔒 File will be encrypted on send'
      );
    }
    e.target.value = '';
  };

  return (
    <>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*,image/gif"
        className="hidden"
        onChange={handleImageSelect}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={handleVideoSelect}
      />
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
      />

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            className="flex-shrink-0"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          <div className="flex flex-col gap-1">
            <div className="px-2 py-1.5 text-xs text-muted-foreground flex items-center gap-1.5">
              <Lock className="h-3 w-3" />
              {language === 'ar' ? 'تشفير شامل' : 'End-to-end encrypted'}
            </div>
            <Button
              variant="ghost"
              className="justify-start gap-2"
              onClick={() => imageInputRef.current?.click()}
            >
              <ImagePlus className="h-4 w-4" />
              {language === 'ar' ? 'صورة' : 'Image'}
            </Button>
            <Button
              variant="ghost"
              className="justify-start gap-2"
              onClick={() => videoInputRef.current?.click()}
            >
              <Video className="h-4 w-4" />
              {language === 'ar' ? 'فيديو' : 'Video'}
            </Button>
            <Button
              variant="ghost"
              className="justify-start gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileText className="h-4 w-4" />
              {language === 'ar' ? 'ملف' : 'File'}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
