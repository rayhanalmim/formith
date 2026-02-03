import { useState, useRef, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';
import { getOptimizedImageProps, isVideoUrl } from '@/lib/image-optimization';
import { isValidLQIP } from '@/lib/image-compression';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
  showSkeleton?: boolean;
  priority?: boolean;
  sizes?: string;
  lqip?: string; // Low-Quality Image Placeholder (base64 data URL)
}

export const LazyImage = memo(function LazyImage({
  src,
  alt,
  fallback = '/placeholder.svg',
  aspectRatio = 'auto',
  showSkeleton = true,
  priority = false,
  sizes,
  lqip,
  className,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);

  // Reset state when src changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    if (!priority) {
      setIsInView(false);
    }
  }, [src, priority]);

  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px', // Start loading 200px before entering viewport
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  const aspectRatioClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: '',
  }[aspectRatio];

  // Get optimized props (priority, loading, decoding, fetchPriority)
  const imageProps = getOptimizedImageProps(hasError ? fallback : src, { priority });

  // Check if we have a valid LQIP
  const hasLQIP = isValidLQIP(lqip);

  // Handle video URLs
  if (isVideoUrl(src)) {
    return (
      <div 
        ref={imgRef}
        className={cn('relative overflow-hidden bg-muted', aspectRatioClass, className)}
      >
        <video
          src={src}
          className="w-full h-full object-cover"
          controls
          playsInline
          preload="metadata"
        />
      </div>
    );
  }

  return (
    <div 
      ref={imgRef}
      className={cn('relative overflow-hidden', aspectRatioClass, className)}
    >
      {/* LQIP blur placeholder - shows while loading */}
      {hasLQIP && !isLoaded && (
        <img
          src={lqip}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover blur-lg scale-110 transform"
          style={{ filter: 'blur(20px)' }}
        />
      )}

      {/* Skeleton placeholder - only if no LQIP */}
      {showSkeleton && !hasLQIP && !isLoaded && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      
      {/* Actual image - only load when in view */}
      {isInView && (
        <img
          {...imageProps}
          {...props}
          alt={alt}
          sizes={sizes}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}
    </div>
  );
});

// Simple lazy loading for avatar images
interface LazyAvatarProps {
  src?: string | null;
  alt: string;
  fallback?: string;
  className?: string;
  priority?: boolean;
  lqip?: string;
}

export const LazyAvatar = memo(function LazyAvatar({ 
  src, 
  alt, 
  fallback = '/images/default-avatar.png',
  className,
  priority = false,
  lqip,
}: LazyAvatarProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Reset on src change
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  const imageUrl = src || fallback;
  const hasLQIP = isValidLQIP(lqip);

  if (!imageUrl || hasError) {
    return (
      <div className={cn('bg-muted flex items-center justify-center', className)}>
        <span className="text-muted-foreground text-xs font-medium">
          {alt?.charAt(0)?.toUpperCase() || '?'}
        </span>
      </div>
    );
  }

  const imageProps = getOptimizedImageProps(imageUrl, { priority });

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* LQIP blur placeholder */}
      {hasLQIP && !isLoaded && (
        <img
          src={lqip}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover rounded-full blur-md scale-110"
          style={{ filter: 'blur(10px)' }}
        />
      )}

      {/* Skeleton placeholder - only if no LQIP */}
      {!hasLQIP && !isLoaded && (
        <Skeleton className="absolute inset-0 w-full h-full rounded-full" />
      )}

      <img
        {...imageProps}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-200',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  );
});

// Re-export for backwards compatibility
export { LazyImage as default };
