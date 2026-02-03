import { useRef, useState } from 'react';
import { ImagePlus, X, Loader2, Film, FileVideo } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePostMediaUpload } from '@/hooks/useFileUpload';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { compressImage, blobToFile, isImageFile, isGifFile, formatFileSize } from '@/lib/image-compression';
import { compressVideo, videoToFile, isVideoFile, videoNeedsCompression } from '@/lib/video-compression';

interface MediaFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

interface PostMediaUploadProps {
  onFilesSelected: (urls: string[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export function PostMediaUpload({ onFilesSelected, maxFiles = 4, disabled }: PostMediaUploadProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([]);
  const [compressionStatus, setCompressionStatus] = useState<string | null>(null);
  const [compressionProgress, setCompressionProgress] = useState(0);
  
  const { mutate: upload, isPending, progress } = usePostMediaUpload();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = maxFiles - selectedFiles.length;
    if (files.length > remaining) {
      toast({
        title: language === 'ar' ? 'الحد الأقصى للملفات' : 'Max files limit',
        description: language === 'ar' 
          ? `يمكنك إضافة ${remaining} ملفات فقط` 
          : `You can only add ${remaining} more files`,
        variant: 'destructive',
      });
      return;
    }

    // Create previews
    const newFiles: MediaFile[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image',
    }));

    setSelectedFiles(prev => [...prev, ...newFiles]);

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) return;

    // Compress files before upload
    const filesToUpload: File[] = [];
    const totalFiles = selectedFiles.length;
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const mediaFile = selectedFiles[i];
      const isGif = isGifFile(mediaFile.file);
      const isVideo = isVideoFile(mediaFile.file);
      
      console.log('Post Upload - Processing file:', {
        name: mediaFile.file.name,
        type: mediaFile.file.type,
        isGif,
        isVideo,
        size: formatFileSize(mediaFile.file.size)
      });
      
      // Compress videos over 15MB
      if (isVideo && mediaFile.file.size > 15 * 1024 * 1024) {
        setCompressionStatus(
          language === 'ar' 
            ? `جاري ضغط الفيديو ${i + 1}/${totalFiles}...` 
            : `Compressing video ${i + 1}/${totalFiles}...`
        );
        
        try {
          const compressedBlob = await compressVideo(mediaFile.file, {
            maxWidth: 1280,
            maxHeight: 720,
            videoBitrate: 2000,
          }, (p) => setCompressionProgress(p));
          
          const compressedFile = videoToFile(compressedBlob, mediaFile.file.name);
          console.log(`Compressed video: ${formatFileSize(mediaFile.file.size)} → ${formatFileSize(compressedFile.size)}`);
          filesToUpload.push(compressedFile);
        } catch (error) {
          console.error('Video compression failed, using original:', error);
          filesToUpload.push(mediaFile.file);
        }
      }
      // Skip compression for GIFs to preserve animation  
      else if (isGif) {
        console.log(`Skipping compression for GIF: ${mediaFile.file.name} to preserve animation`);
        filesToUpload.push(mediaFile.file);
      } 
      // Compress images
      else if (isImageFile(mediaFile.file)) {
        setCompressionStatus(
          language === 'ar' 
            ? `جاري ضغط الصورة ${i + 1}/${totalFiles}...` 
            : `Compressing image ${i + 1}/${totalFiles}...`
        );
        
        try {
          const compressedBlob = await compressImage(mediaFile.file, {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 0.85,
            outputType: 'webp',
          });
          const compressedFile = blobToFile(compressedBlob, mediaFile.file.name);
          console.log(`Compressed ${mediaFile.file.name}: ${formatFileSize(mediaFile.file.size)} → ${formatFileSize(compressedFile.size)}`);
          filesToUpload.push(compressedFile);
        } catch (error) {
          console.error('Compression failed, using original:', error);
          filesToUpload.push(mediaFile.file);
        }
      } else {
        filesToUpload.push(mediaFile.file);
      }
    }
    
    setCompressionStatus(language === 'ar' ? 'جاري الرفع...' : 'Uploading...');
    setCompressionProgress(0);

    upload(
      filesToUpload,
      {
        onSuccess: (results) => {
          onFilesSelected(results.map(r => r.url));
          // Cleanup previews
          selectedFiles.forEach(f => URL.revokeObjectURL(f.preview));
          setSelectedFiles([]);
          setCompressionStatus(null);
          toast({
            title: language === 'ar' ? 'تم رفع الملفات' : 'Files uploaded',
          });
        },
        onError: (error) => {
          setCompressionStatus(null);
          toast({
            title: language === 'ar' ? 'خطأ في الرفع' : 'Upload failed',
            description: error.message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        disabled={isPending || disabled}
      />

      {/* Selected files preview */}
      {selectedFiles.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="relative aspect-video rounded-lg overflow-hidden bg-muted"
            >
              {file.type === 'image' ? (
                <img
                  src={file.preview}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <Film className="h-8 w-8 text-muted-foreground" />
                  <video
                    src={file.preview}
                    className="absolute inset-0 w-full h-full object-cover"
                    muted
                  />
                </div>
              )}
              
              {!isPending && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Compression progress */}
      {compressionStatus && !isPending && (
        <div className="space-y-1">
          <Progress value={compressionProgress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
            <FileVideo className="h-3 w-3" />
            {compressionStatus} {compressionProgress > 0 && `${Math.round(compressionProgress)}%`}
          </p>
        </div>
      )}

      {/* Upload progress bar */}
      {isPending && (
        <div className="space-y-1">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {compressionStatus || (language === 'ar' ? 'جاري الرفع...' : 'Uploading...')} {progress}%
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => inputRef.current?.click()}
          disabled={isPending || disabled || selectedFiles.length >= maxFiles}
        >
          <ImagePlus className="h-4 w-4" />
          {language === 'ar' ? 'إضافة صور/فيديو' : 'Add Media'}
        </Button>

        {selectedFiles.length > 0 && (
          <Button
            type="button"
            size="sm"
            className="gap-2"
            onClick={handleUpload}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              language === 'ar' ? 'رفع الملفات' : 'Upload Files'
            )}
          </Button>
        )}

        <span className="text-xs text-muted-foreground ms-auto">
          {selectedFiles.length}/{maxFiles}
        </span>
      </div>
    </div>
  );
}
