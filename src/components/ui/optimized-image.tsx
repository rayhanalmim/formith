import { useState, useRef, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';
import { 
  getOptimizedImageProps, 
  generateSizes,
  getPlaceholderDataUrl,
  isVideoUrl 
} from '@/lib/image-optimization';
import { isValidLQIP } from '@/lib/image-compression';

interface OptimizedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'sizes'> {
  src: string;
  alt: string;
  fallback?: string;
  aspectRatio?: 'square' | 'video' | '4/3' | '3/2' | '16/9' | 'auto';
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  priority?: boolean;
  showSkeleton?: boolean;
  placeholderColor?: string;
  lqip?: string; // Low-Quality Image Placeholder (base64 data URL)
  onLoadComplete?: () => void;
  responsive?: boolean;
  responsiveSizes?: {
    default: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
}

/**
 * Optimized image component with:
 * - Lazy loading with intersection observer
 * - Skeleton placeholder
 * - Error fallback
 * - Priority loading for above-the-fold images
 * - Responsive sizes support
 */
export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  fallback = '/placeholder.svg',
  aspectRatio = 'auto',
  objectFit = 'cover',
  priority = false,
  showSkeleton = true,
  placeholderColor,
  lqip,
  onLoadComplete,
  responsive = false,
  responsiveSizes,
  className,
  style,
  ...props
}: OptimizedImageProps) {
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

  // Intersection observer for lazy loading
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
    onLoadComplete?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  const aspectRatioClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    '4/3': 'aspect-[4/3]',
    '3/2': 'aspect-[3/2]',
    '16/9': 'aspect-[16/9]',
    auto: '',
  }[aspectRatio];

  const objectFitClass = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
    none: 'object-none',
  }[objectFit];

  const imageProps = getOptimizedImageProps(hasError ? fallback : src, { priority });
  const sizesAttr = responsiveSizes ? generateSizes(responsiveSizes) : undefined;
  const hasLQIP = isValidLQIP(lqip);

  // Don't render video files as images
  if (isVideoUrl(src)) {
    return (
      <div 
        ref={imgRef}
        className={cn('relative overflow-hidden bg-muted', aspectRatioClass, className)}
        style={style}
      >
        <video
          src={src}
          className={cn('w-full h-full', objectFitClass)}
          controls
          preload="metadata"
        />
      </div>
    );
  }

  return (
    <div 
      ref={imgRef}
      className={cn('relative overflow-hidden', aspectRatioClass, className)}
      style={{
        ...style,
        backgroundColor: placeholderColor || undefined,
      }}
    >
      {/* LQIP blur placeholder - shows while loading */}
      {hasLQIP && !isLoaded && (
        <img
          src={lqip}
          alt=""
          aria-hidden="true"
          className={cn('absolute inset-0 w-full h-full scale-110 transform', objectFitClass)}
          style={{ filter: 'blur(20px)' }}
        />
      )}

      {/* Skeleton placeholder - only if no LQIP */}
      {showSkeleton && !hasLQIP && !isLoaded && (
        <Skeleton 
          className="absolute inset-0 w-full h-full" 
          style={{ 
            backgroundColor: placeholderColor 
              ? undefined 
              : undefined 
          }}
        />
      )}
      
      {/* Low-quality color placeholder */}
      {!showSkeleton && !hasLQIP && !isLoaded && placeholderColor && (
        <img
          src={getPlaceholderDataUrl(placeholderColor)}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      
      {/* Actual image - only load when in view */}
      {isInView && (
        <img
          {...imageProps}
          {...props}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          sizes={sizesAttr}
          className={cn(
            'w-full h-full transition-opacity duration-300',
            objectFitClass,
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}
    </div>
  );
});

/**
 * Optimized avatar image with circular crop
 */
interface OptimizedAvatarProps {
  src?: string | null;
  alt: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  priority?: boolean;
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

export const OptimizedAvatar = memo(function OptimizedAvatar({
  src,
  alt,
  fallback = '/images/default-avatar.png',
  size = 'md',
  priority = false,
  className,
}: OptimizedAvatarProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Reset on src change
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  const imageUrl = src || fallback;
  const showFallbackInitial = !src || hasError;

  if (showFallbackInitial && !fallback.startsWith('/')) {
    return (
      <div 
        className={cn(
          'rounded-full bg-muted flex items-center justify-center font-medium text-muted-foreground',
          sizeClasses[size],
          className
        )}
      >
        {alt?.charAt(0)?.toUpperCase() || '?'}
      </div>
    );
  }

  const imageProps = getOptimizedImageProps(hasError ? fallback : imageUrl, { priority });

  return (
    <div 
      className={cn(
        'relative rounded-full overflow-hidden bg-muted',
        sizeClasses[size],
        className
      )}
    >
      {!isLoaded && (
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

export default OptimizedImage;
