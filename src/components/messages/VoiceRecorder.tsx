import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDMMediaUpload } from '@/hooks/useFileUpload';
import { useVoiceRecording, formatVoiceDuration } from '@/hooks/useVoiceRecording';
import { Button } from '@/components/ui/button';
import { Mic, Square, Send, X, Pause, Play, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  onSend: (url: string) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onSend, disabled }: VoiceRecorderProps) {
  const { language } = useLanguage();
  const {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    audioUrl,
    error,
    errorAr,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    getAudioFile,
  } = useVoiceRecording();

  const { mutate: upload, isPending: isUploading } = useDMMediaUpload();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Show error toast with localized message
  useEffect(() => {
    if (error) {
      const message = language === 'ar' ? (errorAr || error) : error;
      toast.error(message, {
        duration: 5000,
        action: {
          label: language === 'ar' ? 'موافق' : 'OK',
          onClick: () => {},
        },
      });
    }
  }, [error, errorAr, language]);

  const handleSend = () => {
    const audioFile = getAudioFile();
    if (!audioFile) return;

    upload(audioFile, {
      onSuccess: (result) => {
        onSend(result.url);
        cancelRecording();
        toast.success(language === 'ar' ? 'تم إرسال الرسالة الصوتية' : 'Voice message sent');
      },
      onError: (err) => {
        console.error('Voice upload error:', err);
        toast.error(language === 'ar' ? 'فشل إرسال الرسالة الصوتية' : 'Failed to send voice message');
      },
    });
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Handle audio ended
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [audioUrl]);

  // Not recording and no audio - show record button
  if (!isRecording && !audioBlob) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled}
        onClick={startRecording}
        className="flex-shrink-0"
        title={language === 'ar' ? 'تسجيل رسالة صوتية' : 'Record voice message'}
      >
        <Mic className="h-5 w-5" />
      </Button>
    );
  }

  // Recording in progress
  if (isRecording) {
    return (
      <div className="flex items-center gap-2 bg-destructive/10 rounded-full px-3 py-1.5 animate-in slide-in-from-right">
        <div className={cn(
          "w-2 h-2 rounded-full bg-destructive",
          !isPaused && "animate-pulse"
        )} />
        
        <span className="text-sm font-mono min-w-[48px] text-center">
          {formatVoiceDuration(duration)}
        </span>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={isPaused ? resumeRecording : pauseRecording}
        >
          {isPaused ? (
            <Play className="h-4 w-4" />
          ) : (
            <Pause className="h-4 w-4" />
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={cancelRecording}
        >
          <X className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={stopRecording}
        >
          <Square className="h-4 w-4 fill-current" />
        </Button>
      </div>
    );
  }

  // Recording complete - show preview
  return (
    <div className="flex items-center gap-2 bg-muted rounded-full px-3 py-1.5 animate-in slide-in-from-right">
      <audio ref={audioRef} src={audioUrl || undefined} />
      
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={togglePlayback}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>

      <span className="text-sm font-mono min-w-[48px] text-center">
        {formatVoiceDuration(duration)}
      </span>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-destructive hover:text-destructive"
        onClick={cancelRecording}
        disabled={isUploading}
      >
        <X className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-primary hover:text-primary"
        onClick={handleSend}
        disabled={isUploading}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
