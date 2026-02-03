import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDeleteHighlight, useRemoveFromHighlight, useUpdateHighlight, type StoryHighlight } from '@/hooks/useStoryHighlights';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Trash2,
  Pause,
  Play,
  MoreVertical,
  Edit,
  Music,
  Check,
  ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
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

interface HighlightViewerProps {
  highlight: StoryHighlight;
  isOwnProfile: boolean;
  onClose: () => void;
}

const STORY_DURATION = 59000; // 59 seconds per story

export function HighlightViewer({ highlight, isOwnProfile, onClose }: HighlightViewerProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const deleteHighlight = useDeleteHighlight();
  const removeFromHighlight = useRemoveFromHighlight();
  const updateHighlight = useUpdateHighlight();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(highlight.title);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  const items = highlight.items || [];
  const currentItem = items[currentIndex];
  const currentStory = currentItem?.story;
  const isVideoStory = currentStory?.media_type === 'video';
  
  // Audio playback for story music (only for image stories - videos use original audio)
  useEffect(() => {
    // Stop previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    // Play background music only for image stories (not videos - they have original audio)
    if (currentStory?.audio_url && currentStory?.media_type === 'image') {
      const audio = new Audio(currentStory.audio_url);
      audio.loop = true;
      audio.volume = 0.5;
      audio.play().catch(console.error);
      audioRef.current = audio;
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [currentStory?.audio_url, currentStory?.media_type]);
  
  // Pause/resume audio when story is paused
  useEffect(() => {
    if (audioRef.current) {
      if (isPaused) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [isPaused]);
  
  // Reset video state when changing stories
  useEffect(() => {
    setVideoDuration(null);
    setIsVideoReady(false);
  }, [currentIndex]);
  
  // Progress timer - for videos, wait until duration is known and video is ready
  useEffect(() => {
    if (isPaused || !currentStory) return;
    
    // For videos, wait for duration and ready state
    if (isVideoStory && (!videoDuration || !isVideoReady)) return;
    
    const duration = isVideoStory && videoDuration ? videoDuration * 1000 : STORY_DURATION;
    const interval = 50;
    const increment = (interval / duration) * 100;
    
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          goToNext();
          return 0;
        }
        return prev + increment;
      });
    }, interval);
    
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentIndex, isPaused, currentStory, isVideoStory, videoDuration, isVideoReady]);
  
  const goToNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, items.length, onClose]);
  
  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  }, [currentIndex]);
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'ArrowLeft') goToPrev();
    if (e.key === ' ') {
      e.preventDefault();
      setIsPaused(prev => !prev);
    }
  }, [onClose, goToNext, goToPrev]);
  
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);
  
  const handleDeleteHighlight = async () => {
    try {
      await deleteHighlight.mutateAsync(highlight.id);
      toast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
      });
      onClose();
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: String(error),
        variant: 'destructive',
      });
    }
  };
  
  const handleRemoveStory = async () => {
    if (!currentItem) return;
    
    try {
      await removeFromHighlight.mutateAsync({
        highlightId: highlight.id,
        storyId: currentItem.story_id,
      });
      
      // If this was the last story, close or delete the highlight
      if (items.length === 1) {
        await deleteHighlight.mutateAsync(highlight.id);
        onClose();
      } else {
        // Move to next or previous story
        if (currentIndex === items.length - 1) {
          setCurrentIndex(prev => prev - 1);
        }
      }
      
      toast({
        title: language === 'ar' ? 'تمت الإزالة' : 'Removed',
      });
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: String(error),
        variant: 'destructive',
      });
    }
  };
  
  const handleSaveTitle = async () => {
    if (!editedTitle.trim()) {
      setEditedTitle(highlight.title);
      setIsEditingTitle(false);
      return;
    }
    
    try {
      await updateHighlight.mutateAsync({
        highlightId: highlight.id,
        title: editedTitle.trim(),
      });
      setIsEditingTitle(false);
      toast({
        title: language === 'ar' ? 'تم الحفظ' : 'Saved',
      });
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: String(error),
        variant: 'destructive',
      });
    }
  };
  
  const handleSetCover = async (coverUrl: string) => {
    try {
      await updateHighlight.mutateAsync({
        highlightId: highlight.id,
        coverUrl,
      });
      setCoverPickerOpen(false);
      setIsPaused(false);
      toast({
        title: language === 'ar' ? 'تم تغيير الغلاف' : 'Cover changed',
      });
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: String(error),
        variant: 'destructive',
      });
    }
  };
  
  if (!currentStory) return null;
  
  const timeAgo = formatDistanceToNow(new Date(currentStory.created_at), {
    addSuffix: true,
    locale: language === 'ar' ? ar : enUS,
  });
  
  return createPortal(
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
      onClick={(e) => {
        if (e.target === containerRef.current) onClose();
      }}
    >
      {/* Story Container */}
      <div className="relative w-full max-w-[420px] h-full max-h-[calc(100vh-40px)] md:max-h-[85vh] md:rounded-2xl overflow-hidden bg-black">
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-20 p-2 flex gap-1">
          {items.map((_, index) => (
            <div key={index} className="flex-1 h-1.5 bg-white/30 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full bg-white rounded-full",
                  isPaused ? "" : "transition-all duration-75 ease-linear"
                )}
                style={{ 
                  width: index < currentIndex 
                    ? '100%' 
                    : index === currentIndex 
                      ? `${progress}%` 
                      : '0%' 
                }}
              />
            </div>
          ))}
        </div>
        
        {/* Paused indicator */}
        {isPaused && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-sm rounded-full p-4 animate-scale-in">
              <Pause className="h-8 w-8 text-white" />
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="absolute top-4 left-0 right-0 z-50 px-4 pt-4 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3">
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="h-8 w-32 text-sm bg-black/50 border-white/30 text-white"
                  maxLength={30}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') {
                      setEditedTitle(highlight.title);
                      setIsEditingTitle(false);
                    }
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={handleSaveTitle}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 bg-black/50 rounded-full">
                <span className="text-white font-semibold text-sm">{highlight.title}</span>
                {currentStory?.audio_url && (
                  <Music className="h-3.5 w-3.5 text-white/80" />
                )}
              </div>
            )}
            <span className="text-white/70 text-xs">{timeAgo}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
            </Button>
            
            {isOwnProfile && (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-[99999] bg-popover">
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingTitle(true);
                      setIsPaused(true);
                    }}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    {language === 'ar' ? 'تعديل العنوان' : 'Edit title'}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCoverPickerOpen(true);
                      setIsPaused(true);
                    }}
                    className="gap-2"
                  >
                    <ImageIcon className="h-4 w-4" />
                    {language === 'ar' ? 'تغيير الغلاف' : 'Change cover'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveStory();
                    }}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    {language === 'ar' ? 'إزالة من المختصر' : 'Remove from highlight'}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteDialogOpen(true);
                      setIsPaused(true);
                    }}
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    {language === 'ar' ? 'حذف المختصر' : 'Delete highlight'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Story Content */}
        <div 
          className="w-full h-full flex items-center justify-center"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {currentStory.media_type === 'video' ? (
            <video
              ref={videoRef}
              src={currentStory.media_url}
              className="w-full h-full object-contain"
              autoPlay
              muted={false}
              playsInline
              style={{ filter: currentStory.filter || undefined }}
              onLoadedMetadata={(e) => {
                const video = e.currentTarget;
                if (video.duration && !isNaN(video.duration) && video.duration > 0) {
                  setVideoDuration(video.duration);
                }
              }}
              onPlaying={() => setIsVideoReady(true)}
              onWaiting={() => setIsVideoReady(false)}
              onLoadStart={() => setIsVideoReady(false)}
            />
          ) : (
            <img
              src={currentStory.media_url}
              alt=""
              className="w-full h-full object-contain"
              style={{ filter: currentStory.filter || undefined }}
            />
          )}
          
          {/* Text Overlay */}
          {currentStory.text_overlay && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: `${currentStory.text_overlay.position.x}%`,
                top: `${currentStory.text_overlay.position.y}%`,
                transform: 'translate(-50%, -50%)',
                fontFamily: currentStory.text_overlay.font,
                color: currentStory.text_overlay.color,
                fontSize: `${currentStory.text_overlay.size}px`,
                backgroundColor: currentStory.text_overlay.backgroundColor,
                padding: currentStory.text_overlay.backgroundColor ? '8px 16px' : undefined,
                borderRadius: currentStory.text_overlay.backgroundColor ? '8px' : undefined,
              }}
            >
              {currentStory.text_overlay.text}
            </div>
          )}
          
          {/* Stickers */}
          {currentStory.stickers?.map((sticker: any, index: number) => (
            <div
              key={index}
              className="absolute pointer-events-none"
              style={{
                left: `${sticker.position.x}%`,
                top: `${sticker.position.y}%`,
                transform: `translate(-50%, -50%) rotate(${sticker.rotation || 0}deg)`,
                fontSize: `${sticker.size}px`,
              }}
            >
              {sticker.type === 'emoji' ? sticker.data : (
                <img src={sticker.data} alt="" className="w-auto h-auto max-w-full" />
              )}
            </div>
          ))}
        </div>
        
        {/* Navigation areas */}
        <div className="absolute inset-0 z-10 flex pointer-events-none">
          <div 
            className="w-1/3 h-full cursor-pointer pointer-events-auto"
            onClick={goToPrev}
          />
          <div className="w-1/3 h-full" />
          <div 
            className="w-1/3 h-full cursor-pointer pointer-events-auto"
            onClick={goToNext}
          />
        </div>
      </div>
      
      {/* Desktop navigation arrows */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden md:flex absolute left-4 text-white hover:bg-white/20"
        onClick={goToPrev}
        disabled={currentIndex === 0}
      >
        <ChevronLeft className="h-8 w-8" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        className="hidden md:flex absolute right-4 text-white hover:bg-white/20"
        onClick={goToNext}
      >
        <ChevronRight className="h-8 w-8" />
      </Button>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={deleteDialogOpen} 
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setIsPaused(false);
        }}
      >
        <AlertDialogContent className="z-[99999]">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ar' ? 'حذف المختصر؟' : 'Delete Highlight?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar' 
                ? 'سيتم حذف هذا المختصر نهائياً. لا يمكن التراجع عن هذا الإجراء.'
                : 'This highlight will be permanently deleted. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => { e.stopPropagation(); setIsPaused(false); }}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.stopPropagation(); handleDeleteHighlight(); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {language === 'ar' ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Cover Picker Dialog */}
      <AlertDialog open={coverPickerOpen} onOpenChange={(open) => {
        setCoverPickerOpen(open);
        if (!open) setIsPaused(false);
      }}>
        <AlertDialogContent className="max-w-md z-[99999]">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ar' ? 'اختر صورة الغلاف' : 'Choose Cover Image'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar' 
                ? 'اختر قصة لاستخدامها كغلاف للمختصر'
                : 'Select a story to use as the highlight cover'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto py-4">
            {items.map((item, idx) => {
              const story = item.story;
              if (!story) return null;
              const thumbUrl = story.media_type === 'video' 
                ? (story.thumbnail_url || story.media_url) 
                : story.media_url;
              const isSelected = highlight.cover_url === thumbUrl;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleSetCover(thumbUrl)}
                  className={cn(
                    "relative aspect-[9/16] rounded-lg overflow-hidden border-2 transition-all",
                    isSelected ? "border-primary ring-2 ring-primary" : "border-transparent hover:border-muted-foreground/50"
                  )}
                >
                  {story.media_type === 'video' ? (
                    <video
                      src={story.media_url + '#t=0.5'}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={story.media_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <Check className="h-6 w-6 text-primary" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>,
    document.body
  );
}
