import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useStoryUpload } from '@/contexts/StoryUploadContext';
import { useCreateStory } from '@/hooks/useStories';
import { usePostMediaUpload } from '@/hooks/useFileUpload';
import { useVoiceRecording, formatVoiceDuration } from '@/hooks/useVoiceRecording';
import { compressImage, blobToFile, isImageFile, formatFileSize } from '@/lib/image-compression';
import { compressVideo, videoToFile, isVideoFile } from '@/lib/video-compression';
import { STORY_MUSIC_LIBRARY, type StoryMusic } from '@/lib/story-music';
import { 
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import {
  ImagePlus, 
  X, 
  Loader2,
  Send,
  Volume2,
  VolumeX,
  Mic,
  Square,
  Trash2,
  Play,
  Pause,
  Smile,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { StoryEmojiPicker } from './StoryEmojiPicker';
import { DraggableEmoji } from './DraggableEmoji';

interface CreateStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FILTERS = [
  { name: 'none', label: 'Original', gradient: 'from-pink-500 to-rose-500' },
  { name: 'grayscale', label: 'B&W', gradient: 'from-gray-400 to-gray-600', css: 'grayscale(100%)' },
  { name: 'sepia', label: 'Sepia', gradient: 'from-amber-300 to-amber-600', css: 'sepia(100%)' },
  { name: 'vintage', label: 'Vintage', gradient: 'from-amber-200 to-yellow-600', css: 'sepia(50%) contrast(90%) brightness(90%)' },
  { name: 'warm', label: 'Warm', gradient: 'from-orange-400 to-red-500', css: 'saturate(150%) brightness(105%)' },
  { name: 'cool', label: 'Cool', gradient: 'from-cyan-400 to-blue-500', css: 'saturate(80%) hue-rotate(20deg)' },
  { name: 'dramatic', label: 'Drama', gradient: 'from-purple-500 to-indigo-600', css: 'contrast(130%) saturate(120%)' },
  { name: 'fade', label: 'Fade', gradient: 'from-slate-300 to-slate-500', css: 'contrast(90%) brightness(110%) saturate(80%)' },
  { name: 'vivid', label: 'Vivid', gradient: 'from-fuchsia-500 to-pink-500', css: 'saturate(180%) contrast(110%)' },
  { name: 'noir', label: 'Noir', gradient: 'from-zinc-700 to-black', css: 'grayscale(100%) contrast(140%)' },
];

const MAX_VIDEO_DURATION = 59;

export function CreateStoryDialog({ open, onOpenChange }: CreateStoryDialogProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const { startUpload, updateProgress, finishUpload, cancelUpload } = useStoryUpload();
  const createStory = useCreateStory();
  const { mutateAsync: uploadMedia } = usePostMediaUpload();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const filtersScrollRef = useRef<HTMLDivElement>(null);
  const voiceoverAudioRef = useRef<HTMLAudioElement | null>(null);
  
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  
  // Video duration for auto-trimming
  const [videoDuration, setVideoDuration] = useState(0);
  
  // Filter state
  const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  // Sound state - just toggle for original sound (muted or not)
  const [isMuted, setIsMuted] = useState(false);
  const [selectedMusic] = useState<StoryMusic>(STORY_MUSIC_LIBRARY[0]);
  
  // Voiceover state
  const voiceRecording = useVoiceRecording();
  const [voiceoverBlob, setVoiceoverBlob] = useState<Blob | null>(null);
  const [voiceoverUrl, setVoiceoverUrl] = useState<string | null>(null);
  const [isPlayingVoiceover, setIsPlayingVoiceover] = useState(false);
  
  // Reaction emoji state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactionEmoji, setReactionEmoji] = useState<string | null>(null);
  const [emojiPosition, setEmojiPosition] = useState({ x: 75, y: 25 });
  const mediaPreviewRef = useRef<HTMLDivElement>(null);
  
  // Minimum swipe distance for filter change
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    const currentIndex = FILTERS.findIndex(f => f.name === selectedFilter.name);
    
    if (isLeftSwipe && currentIndex < FILTERS.length - 1) {
      setSelectedFilter(FILTERS[currentIndex + 1]);
    } else if (isRightSwipe && currentIndex > 0) {
      setSelectedFilter(FILTERS[currentIndex - 1]);
    }
  };
  
  // Voiceover handlers
  const handleStartVoiceover = async () => {
    // Clear any existing voiceover
    if (voiceoverUrl) {
      URL.revokeObjectURL(voiceoverUrl);
      setVoiceoverUrl(null);
      setVoiceoverBlob(null);
    }
    await voiceRecording.startRecording();
  };
  
  const handleStopVoiceover = () => {
    voiceRecording.stopRecording();
  };
  
  // When recording stops, capture the audio
  useEffect(() => {
    if (voiceRecording.audioBlob && voiceRecording.audioUrl && !voiceRecording.isRecording) {
      setVoiceoverBlob(voiceRecording.audioBlob);
      setVoiceoverUrl(voiceRecording.audioUrl);
    }
  }, [voiceRecording.audioBlob, voiceRecording.audioUrl, voiceRecording.isRecording]);
  
  const handleDeleteVoiceover = () => {
    if (voiceoverUrl) {
      URL.revokeObjectURL(voiceoverUrl);
    }
    setVoiceoverBlob(null);
    setVoiceoverUrl(null);
    voiceRecording.cancelRecording();
  };
  
  const handlePlayVoiceover = () => {
    if (!voiceoverUrl) return;
    
    if (isPlayingVoiceover && voiceoverAudioRef.current) {
      voiceoverAudioRef.current.pause();
      voiceoverAudioRef.current.currentTime = 0;
      setIsPlayingVoiceover(false);
      return;
    }
    
    const audio = new Audio(voiceoverUrl);
    voiceoverAudioRef.current = audio;
    audio.play();
    setIsPlayingVoiceover(true);
    
    audio.onended = () => {
      setIsPlayingVoiceover(false);
      voiceoverAudioRef.current = null;
    };
  };
  
  // Cleanup voiceover audio on unmount
  useEffect(() => {
    return () => {
      if (voiceoverAudioRef.current) {
        voiceoverAudioRef.current.pause();
        voiceoverAudioRef.current = null;
      }
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const isVideo = file.type.startsWith('video/');
    
    if (!isVideo) {
      // For images, just load them
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
      setMediaType('image');
    } else {
      // For videos, get duration for auto-trim
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        setVideoDuration(video.duration);
        setMediaFile(file);
        setMediaPreview(URL.createObjectURL(file));
        setMediaType('video');
      };
      video.src = URL.createObjectURL(file);
    }
  };
  
  // Loop video within 15 second range
  const handleVideoTimeUpdate = () => {
    if (videoRef.current && mediaType === 'video') {
      if (videoRef.current.currentTime >= MAX_VIDEO_DURATION) {
        videoRef.current.currentTime = 0;
      }
    }
  };
  
  const trimVideo = async (file: File, start: number, end: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      
      video.onloadeddata = async () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d')!;
          
          // Use MediaRecorder to capture the trimmed portion
          const stream = canvas.captureStream(30);
          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: 2500000,
          });
          
          const chunks: Blob[] = [];
          mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
          mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            resolve(blob);
          };
          
          video.currentTime = start;
          await new Promise(r => video.onseeked = r);
          
          mediaRecorder.start();
          video.play();
          
          const drawFrame = () => {
            if (video.currentTime >= end) {
              video.pause();
              mediaRecorder.stop();
              return;
            }
            ctx.drawImage(video, 0, 0);
            requestAnimationFrame(drawFrame);
          };
          drawFrame();
        } catch (error) {
          reject(error);
        }
      };
      
      video.onerror = reject;
    });
  };
  
  const handleSubmit = async () => {
    if (!mediaFile || !user) return;
    
    // Store values we need for upload
    const fileToProcess = mediaFile;
    const currentMediaType = mediaType;
    const currentFilter = selectedFilter;
    const currentVoiceoverBlob = voiceoverBlob;
    const currentVideoDuration = videoDuration;
    const currentReactionEmoji = reactionEmoji;
    const currentEmojiPosition = emojiPosition;
    
    console.log('Before reset - reactionEmoji:', currentReactionEmoji, 'position:', currentEmojiPosition);
    
    // Close dialog immediately and start background upload
    handleReset();
    onOpenChange(false);
    
    // Start background upload with progress indicator
    startUpload();
    
    try {
      let fileToUpload: File | Blob = fileToProcess;
      const originalSize = fileToProcess.size;
      
      // Compress/process media
      if (currentMediaType === 'image' && isImageFile(fileToProcess)) {
        updateProgress(5, language === 'ar' ? 'جاري ضغط الصورة...' : 'Compressing image...');
        try {
          const compressedBlob = await compressImage(fileToProcess, {
            maxWidth: 1080,
            maxHeight: 1920,
            quality: 0.85,
            outputType: 'webp',
          });
          fileToUpload = blobToFile(compressedBlob, fileToProcess.name);
          console.log(`Story image compressed: ${formatFileSize(originalSize)} → ${formatFileSize(fileToUpload.size)}`);
        } catch (error) {
          console.error('Compression failed, using original:', error);
        }
        updateProgress(20);
      } else if (currentMediaType === 'video') {
        // Compress video if > 10MB
        if (fileToProcess.size > 10 * 1024 * 1024) {
          updateProgress(5, language === 'ar' ? 'جاري ضغط الفيديو...' : 'Compressing video...');
          console.log(`Compressing story video: ${formatFileSize(originalSize)}`);
          
          try {
            const compressedBlob = await compressVideo(fileToProcess, {
              maxWidth: 720,
              maxHeight: 1280,
              videoBitrate: 1500,
            }, (p) => updateProgress(Math.round(p * 0.4))); // 0-40% for compression
            
            fileToUpload = videoToFile(compressedBlob, fileToProcess.name);
            console.log(`Story video compressed: ${formatFileSize(originalSize)} → ${formatFileSize(fileToUpload.size)}`);
          } catch (error) {
            console.error('Video compression failed, using original:', error);
          }
        }
        
        // Auto-trim if too long
        if (currentVideoDuration > MAX_VIDEO_DURATION) {
          updateProgress(45, language === 'ar' ? 'جاري قص الفيديو...' : 'Trimming video...');
          try {
            const trimmedBlob = await trimVideo(fileToUpload as File, 0, MAX_VIDEO_DURATION);
            fileToUpload = new File([trimmedBlob], 'trimmed-video.webm', { type: 'video/webm' });
          } catch (error) {
            console.error('Video trimming failed:', error);
            toast({
              title: language === 'ar' ? 'خطأ في قص الفيديو' : 'Video trimming failed',
              description: language === 'ar' ? 'جرب فيديو أقصر' : 'Try a shorter video',
              variant: 'destructive',
            });
            cancelUpload();
            return;
          }
        }
        updateProgress(50);
      }
      
      updateProgress(55, language === 'ar' ? 'جاري الرفع...' : 'Uploading...');
      
      // Upload media
      const results = await uploadMedia([fileToUpload as File]);
      const mediaUrl = results[0]?.url;
      
      if (!mediaUrl) throw new Error('Upload failed');
      
      // Upload voiceover if exists
      let audioUrl: string | null = null;
      if (currentVoiceoverBlob) {
        updateProgress(75, language === 'ar' ? 'جاري رفع التعليق الصوتي...' : 'Uploading voiceover...');
        const voiceoverFile = new File(
          [currentVoiceoverBlob], 
          `voiceover-${Date.now()}.webm`, 
          { type: currentVoiceoverBlob.type || 'audio/webm' }
        );
        const voiceoverResults = await uploadMedia([voiceoverFile]);
        audioUrl = voiceoverResults[0]?.url || null;
      }
      
      updateProgress(85, language === 'ar' ? 'جاري النشر...' : 'Publishing...');
      
      // Create story
      console.log('About to create story - currentReactionEmoji:', currentReactionEmoji, 'currentEmojiPosition:', currentEmojiPosition);
      
      const reactionEmojiData = currentReactionEmoji ? {
        emoji: currentReactionEmoji,
        position: currentEmojiPosition,
      } : undefined;
      
      console.log('reactionEmojiData:', reactionEmojiData);
      
      const storyPayload = {
        mediaUrl,
        mediaType: currentMediaType,
        textOverlay: null,
        stickers: [],
        filter: currentFilter.css || null,
        audioUrl,
        reactionEmoji: reactionEmojiData,
      };
      
      console.log('Creating story with payload:', JSON.stringify(storyPayload, null, 2));
      
      await createStory.mutateAsync(storyPayload);
      
      finishUpload();
      
      toast({
        title: language === 'ar' ? 'تم نشر القصة' : 'Story posted',
      });
    } catch (error) {
      console.error('Story creation error:', error);
      cancelUpload();
      toast({
        title: language === 'ar' ? 'حدث خطأ' : 'Error occurred',
        description: String(error),
        variant: 'destructive',
      });
    }
  };
  
  const handleReset = () => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    if (voiceoverUrl) URL.revokeObjectURL(voiceoverUrl);
    if (voiceoverAudioRef.current) {
      voiceoverAudioRef.current.pause();
      voiceoverAudioRef.current = null;
    }
    setMediaFile(null);
    setMediaPreview(null);
    setSelectedFilter(FILTERS[0]);
    setIsMuted(false);
    setVideoDuration(0);
    setVoiceoverBlob(null);
    setVoiceoverUrl(null);
    setIsPlayingVoiceover(false);
    setReactionEmoji(null);
    setEmojiPosition({ x: 75, y: 25 });
    setShowEmojiPicker(false); // Close emoji picker when dialog closes
    voiceRecording.cancelRecording();
  };
  
  // Also close emoji picker when dialog closes via onOpenChange
  useEffect(() => {
    if (!open) {
      setShowEmojiPicker(false);
    }
  }, [open]);
  
  return (
    <>
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        // Only close if emoji picker is not open
        if (!isOpen && !showEmojiPicker) {
          handleReset();
          onOpenChange(isOpen);
        } else if (!isOpen && showEmojiPicker) {
          // Prevent dialog from closing if emoji picker is open
          return;
        } else {
          onOpenChange(isOpen);
        }
      }}
      modal={!showEmojiPicker}
    >
      <DialogContent className="w-[95vw] max-w-[400px] h-[90vh] max-h-[750px] p-0 overflow-hidden bg-black border border-white/20 rounded-2xl flex flex-col [&>button]:hidden">
        <VisuallyHidden>
          <DialogTitle>{language === 'ar' ? 'قصة جديدة' : 'New Story'}</DialogTitle>
        </VisuallyHidden>
        
        {/* Header - Fixed */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
          <button 
            onClick={() => onOpenChange(false)}
            className="w-10 h-10 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex flex-col items-center">
            <h2 className="text-white font-semibold text-base">
              {language === 'ar' ? 'قصة جديدة' : 'New Story'}
            </h2>
          </div>
          
          {mediaPreview ? (
            <Button
              onClick={handleSubmit}
              size="sm"
              className="h-9 px-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-full"
            >
              <Send className="h-4 w-4 me-1.5" />
              {language === 'ar' ? 'نشر' : 'Post'}
            </Button>
          ) : (
            <div className="w-10" />
          )}
        </div>
        
        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {!mediaPreview ? (
            /* Upload Zone */
            <div className="p-4 h-full flex items-center justify-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                className="hidden"
                onChange={handleFileSelect}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[9/16] max-h-[55vh] rounded-2xl border-2 border-dashed border-white/20 hover:border-primary/50 transition-all duration-300 flex flex-col items-center justify-center gap-4 bg-white/5 hover:bg-white/10"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/20 flex items-center justify-center">
                  <ImagePlus className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                </div>
                <div className="text-center px-4">
                  <p className="font-semibold text-white text-base sm:text-lg">
                    {language === 'ar' ? 'اختر صورة أو فيديو' : 'Choose photo or video'}
                  </p>
                  <p className="text-xs sm:text-sm text-white/50 mt-1">
                    {language === 'ar' ? 'الفيديو يُقص تلقائياً إلى 59 ثانية' : 'Videos auto-trimmed to 59 seconds'}
                  </p>
                </div>
              </button>
            </div>
          ) : (
            /* Preview & Controls */
            <div className="flex flex-col p-4 gap-4">
              {/* Media Preview with swipe gestures */}
              <div 
                className="relative w-full flex justify-center"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
              <div 
                ref={mediaPreviewRef}
                className="relative w-full max-w-[260px] aspect-[9/16] bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
              >
                  {/* 59-second progress bar */}
                  <div className="absolute top-0 left-0 right-0 z-20 p-2">
                    <div className="h-1 w-full bg-muted/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                        style={{ 
                          animation: `countdown ${MAX_VIDEO_DURATION}s linear infinite`,
                        }}
                      />
                    </div>
                  </div>
                  <style>{`
                    @keyframes countdown {
                      0% { width: 0%; }
                      100% { width: 100%; }
                    }
                  `}</style>
                  
                  {mediaType === 'video' ? (
                    <video
                      ref={videoRef}
                      src={mediaPreview}
                      className="w-full h-full object-cover"
                      style={{ filter: selectedFilter.css || undefined }}
                      autoPlay
                      loop
                      muted
                      playsInline
                      onTimeUpdate={handleVideoTimeUpdate}
                    />
                  ) : (
                    <img
                      src={mediaPreview}
                      alt=""
                      className="w-full h-full object-cover"
                      style={{ filter: selectedFilter.css || undefined }}
                    />
                  )}
                  
                  {/* Draggable reaction emoji overlay */}
                  {reactionEmoji && (
                    <DraggableEmoji
                      emoji={reactionEmoji}
                      initialPosition={emojiPosition}
                      containerRef={mediaPreviewRef}
                      onPositionChange={setEmojiPosition}
                      onRemove={() => setReactionEmoji(null)}
                    />
                  )}
                  
                  {/* Top action buttons */}
                  <div className="absolute top-8 right-2 flex flex-col gap-2 z-20">
                    {/* Change media button */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                      title={language === 'ar' ? 'تغيير الوسائط' : 'Change media'}
                    >
                      <ImagePlus className="h-4 w-4" />
                    </button>
                    
                    {/* Add emoji button */}
                    <button
                      onClick={() => setShowEmojiPicker(true)}
                      className={cn(
                        "p-2 rounded-full transition-colors",
                        reactionEmoji 
                          ? "bg-primary text-white" 
                          : "bg-black/60 text-white hover:bg-black/80"
                      )}
                      title={language === 'ar' ? 'إضافة إيموجي تفاعلي' : 'Add reaction emoji'}
                    >
                      <Smile className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Hidden file input for changing media */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
              </div>
              
              {/* Filters */}
              <div className="pt-3 pb-6 px-1">
                <div 
                  ref={filtersScrollRef}
                  className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory px-3"
                >
                  {FILTERS.map((filter) => (
                    <button
                      key={filter.name}
                      onClick={() => setSelectedFilter(filter)}
                      className={cn(
                        "flex-shrink-0 flex flex-col items-center gap-1.5 snap-start transition-all duration-200",
                        selectedFilter.name === filter.name && "scale-105"
                      )}
                    >
                      <div
                        className={cn(
                          "w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br transition-all duration-200 shadow-lg",
                          filter.gradient,
                          selectedFilter.name === filter.name 
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-black" 
                            : "opacity-70 hover:opacity-100"
                        )}
                        style={{ filter: filter.css || undefined }}
                      />
                      <span className={cn(
                        "text-[10px] sm:text-xs transition-colors whitespace-nowrap",
                        selectedFilter.name === filter.name ? "text-white font-medium" : "text-white/60"
                      )}>
                        {filter.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Voiceover Recording Section */}
              <div className="px-4 py-3 border-t border-white/10">
                <p className="text-white/60 text-xs mb-2">
                  {language === 'ar' ? 'تعليق صوتي' : 'Voiceover'}
                </p>
                
                {/* Recording UI */}
                {voiceRecording.isRecording ? (
                  <div className="flex items-center gap-3 p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
                      <Mic className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">
                        {language === 'ar' ? 'جاري التسجيل...' : 'Recording...'}
                      </p>
                      <p className="text-red-300 text-xs font-mono">
                        {formatVoiceDuration(voiceRecording.duration)}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white hover:bg-red-500/30"
                      onClick={handleStopVoiceover}
                    >
                      <Square className="h-5 w-5 fill-current" />
                    </Button>
                  </div>
                ) : voiceoverUrl ? (
                  /* Voiceover Preview */
                  <div className="flex items-center gap-3 p-3 bg-primary/20 border border-primary/30 rounded-xl">
                    <button
                      onClick={handlePlayVoiceover}
                      className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/80 transition-colors"
                    >
                      {isPlayingVoiceover ? (
                        <Pause className="h-5 w-5 text-white" />
                      ) : (
                        <Play className="h-5 w-5 text-white" />
                      )}
                    </button>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">
                        {language === 'ar' ? 'تعليق صوتي مسجل' : 'Voiceover recorded'}
                      </p>
                      <p className="text-primary/70 text-xs">
                        {language === 'ar' ? 'اضغط للاستماع' : 'Tap to preview'}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white/70 hover:text-destructive hover:bg-destructive/20"
                      onClick={handleDeleteVoiceover}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                ) : (
                  /* Record Button */
                  <button
                    onClick={handleStartVoiceover}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <Mic className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-start">
                      <p className="text-white font-medium text-sm">
                        {language === 'ar' ? 'إضافة تعليق صوتي' : 'Add voiceover'}
                      </p>
                      <p className="text-white/50 text-xs">
                        {language === 'ar' ? 'سجّل صوتك على القصة' : 'Record your voice over the story'}
                      </p>
                    </div>
                  </button>
                )}
                
                {/* Error message */}
                {voiceRecording.error && (
                  <p className="text-red-400 text-xs mt-2">
                    {language === 'ar' ? voiceRecording.errorAr : voiceRecording.error}
                  </p>
                )}
              </div>
              
              {/* Sound Toggle - Only for videos */}
              {mediaType === 'video' && (
                <div className="px-4 py-3 border-t border-white/10">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all",
                      !isMuted 
                        ? "bg-primary/20 border border-primary/30" 
                        : "bg-white/10 hover:bg-white/15"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        !isMuted ? "bg-primary" : "bg-white/20"
                      )}>
                        {isMuted ? (
                          <VolumeX className="h-5 w-5 text-white" />
                        ) : (
                          <Volume2 className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div className="text-start">
                        <p className="text-white font-medium text-sm">
                          {language === 'ar' ? 'الصوت الأصلي' : 'Original sound'}
                        </p>
                        <p className="text-white/50 text-xs">
                          {isMuted 
                            ? (language === 'ar' ? 'الصوت مكتوم' : 'Sound is muted')
                            : (language === 'ar' ? 'الصوت مفعّل' : 'Sound is enabled')
                          }
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              )}
              
              {/* Upload progress - removed since upload happens in background */}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
    
    {/* Emoji Picker Modal - rendered outside Dialog */}
    {showEmojiPicker && (
      <StoryEmojiPicker
        onSelect={(emoji) => {
          setReactionEmoji(emoji);
          setShowEmojiPicker(false);
        }}
        onClose={() => setShowEmojiPicker(false)}
      />
    )}
    </>
  );
}
