import { useRef, useState } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface VoiceMessagePlayerProps {
  src: string;
  className?: string;
}

export function VoiceMessagePlayer({ src, className }: VoiceMessagePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate waveform bars (static visualization)
  const waveformBars = Array.from({ length: 30 }, (_, i) => {
    const height = 20 + Math.sin(i * 0.5) * 15 + Math.random() * 10;
    const progress = duration > 0 ? currentTime / duration : 0;
    const isActive = i / 30 < progress;
    return { height, isActive };
  });

  return (
    <div className={cn(
      "flex items-center gap-3 bg-accent/50 rounded-2xl px-3 py-2 min-w-[200px] max-w-[280px]",
      className
    )}>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 flex-shrink-0"
        onClick={togglePlay}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4 ms-0.5" />
        )}
      </Button>

      <div className="flex-1 min-w-0">
        {/* Waveform visualization */}
        <div className="flex items-center gap-[2px] h-6 mb-1">
          {waveformBars.map((bar, i) => (
            <div
              key={i}
              className={cn(
                "w-[3px] rounded-full transition-colors",
                bar.isActive ? "bg-primary" : "bg-muted-foreground/30"
              )}
              style={{ height: `${bar.height}%` }}
            />
          ))}
        </div>

        {/* Time display */}
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Check if a URL is a voice message
 */
export function isVoiceMessage(url: string | null | undefined): boolean {
  if (!url) return false;
  const voiceExtensions = ['.webm', '.ogg', '.mp3', '.m4a', '.wav'];
  const lowerUrl = url.toLowerCase();
  
  // Check for voice message patterns
  if (lowerUrl.includes('voice-message') || lowerUrl.includes('voice_message')) {
    return true;
  }
  
  // Check file extensions with audio type indicators
  return voiceExtensions.some(ext => lowerUrl.endsWith(ext));
}
