import { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  poster?: string;
  maxWidth?: string;
  maxHeight?: string;
  showControls?: boolean;
}

export function VideoPlayer({ 
  src, 
  className, 
  autoPlay = false, 
  muted = false,
  loop = false,
  poster,
  maxWidth = '100%',
  maxHeight = '85vh',
  showControls = true
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControlsOverlay, setShowControlsOverlay] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Auto-hide controls after 3 seconds of inactivity
  useEffect(() => {
    if (!showControls) return;

    let timeout: NodeJS.Timeout;
    const resetTimeout = () => {
      clearTimeout(timeout);
      setShowControlsOverlay(true);
      timeout = setTimeout(() => {
        if (isPlaying) {
          setShowControlsOverlay(false);
        }
      }, 3000);
    };

    const video = videoRef.current;
    if (video) {
      video.addEventListener('play', resetTimeout);
      video.addEventListener('pause', () => {
        clearTimeout(timeout);
        setShowControlsOverlay(true);
      });
      video.addEventListener('mousemove', resetTimeout);
      video.addEventListener('touchstart', resetTimeout);
    }

    return () => clearTimeout(timeout);
  }, [isPlaying, showControls]);

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (!loop && videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    videoRef.current.muted = newMuted;
    
    if (newMuted) {
      setVolume(0);
    } else {
      setVolume(videoRef.current.volume || 1);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative bg-black rounded-lg overflow-hidden group",
        className
      )}
      style={{ maxWidth, maxHeight }}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onLoadStart={() => setIsLoading(true)}
        className="w-full h-full object-contain"
        playsInline
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Play/Pause overlay button */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-all pointer-events-auto",
            "opacity-0 group-hover:opacity-100",
            showControlsOverlay && "opacity-100"
          )}
          onClick={togglePlay}
        >
          {isPlaying ? (
            <Pause className="w-8 h-8" />
          ) : (
            <Play className="w-8 h-8 ml-1" />
          )}
        </Button>
      </div>

      {/* Controls bar */}
      {showControls && (
        <div className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity",
          "opacity-0 group-hover:opacity-100",
          showControlsOverlay && "opacity-100"
        )}>
          {/* Progress bar */}
          <div className="mb-3">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-white/80 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" />
              )}
            </Button>

            {/* Volume control */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={toggleMute}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.1}
                onValueChange={handleVolumeChange}
                className="w-20"
              />
            </div>

            <div className="flex-1" />

            {/* Fullscreen button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
