/**
 * Image optimization utilities for responsive images and format detection
 */

// Responsive breakpoints for srcset
export const IMAGE_BREAKPOINTS = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// Common image sizes for different use cases
export const IMAGE_SIZES = {
  avatar: { xs: 40, sm: 64, md: 96, lg: 128 },
  thumbnail: { xs: 150, sm: 200, md: 300, lg: 400 },
  card: { xs: 320, sm: 480, md: 640, lg: 768 },
  hero: { xs: 640, sm: 1024, md: 1280, lg: 1920 },
} as const;

/**
 * Check if browser supports WebP format
 */
let webpSupported: boolean | null = null;

export async function supportsWebP(): Promise<boolean> {
  if (webpSupported !== null) return webpSupported;
  
  if (typeof window === 'undefined') {
    webpSupported = true;
    return true;
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    webpSupported = canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    webpSupported = false;
  }
  
  return webpSupported;
}

/**
 * Check if browser supports AVIF format
 */
let avifSupported: boolean | null = null;

export async function supportsAVIF(): Promise<boolean> {
  if (avifSupported !== null) return avifSupported;
  
  if (typeof window === 'undefined') {
    avifSupported = false;
    return false;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      avifSupported = img.width === 1;
      resolve(avifSupported);
    };
    img.onerror = () => {
      avifSupported = false;
      resolve(false);
    };
    // Tiny AVIF test image
    img.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKBxgABokYAwA8AAAADAAA';
  });
}

/**
 * Get the best supported image format
 */
export async function getBestFormat(): Promise<'avif' | 'webp' | 'jpeg'> {
  if (await supportsAVIF()) return 'avif';
  if (await supportsWebP()) return 'webp';
  return 'jpeg';
}

/**
 * Check if a URL is from DigitalOcean Spaces
 */
export function isSpacesUrl(url: string): boolean {
  return url.includes('digitaloceanspaces.com');
}

/**
 * Check if a URL is from Supabase Storage
 */
export function isSupabaseStorageUrl(url: string): boolean {
  return url.includes('supabase.co/storage');
}

/**
 * Get file extension from URL
 */
export function getFileExtension(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const ext = pathname.split('.').pop()?.toLowerCase() || '';
    return ext;
  } catch {
    return '';
  }
}

/**
 * Check if URL points to an image
 */
export function isImageUrl(url: string): boolean {
  const ext = getFileExtension(url);
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg', 'bmp'].includes(ext);
}

/**
 * Check if URL points to a video
 */
export function isVideoUrl(url: string): boolean {
  const ext = getFileExtension(url);
  return ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext);
}

/**
 * Generate srcset for responsive images
 * Currently returns original URL since CDN doesn't support on-the-fly resizing
 * Can be extended to support image transformation services
 */
export function generateSrcSet(
  url: string, 
  sizes: number[] = [320, 640, 768, 1024, 1280]
): string {
  // For now, return the original URL
  // Can be extended to support image CDN with resizing (Cloudinary, imgix, etc.)
  return sizes.map(size => `${url} ${size}w`).join(', ');
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizes(config: {
  default: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
}): string {
  const parts: string[] = [];
  
  if (config.xl) parts.push(`(min-width: 1280px) ${config.xl}`);
  if (config.lg) parts.push(`(min-width: 1024px) ${config.lg}`);
  if (config.md) parts.push(`(min-width: 768px) ${config.md}`);
  if (config.sm) parts.push(`(min-width: 640px) ${config.sm}`);
  parts.push(config.default);
  
  return parts.join(', ');
}

/**
 * Get optimized image props for use in img tags
 */
export function getOptimizedImageProps(
  src: string,
  options: {
    priority?: boolean;
    sizes?: string;
    quality?: number;
  } = {}
): {
  src: string;
  loading: 'lazy' | 'eager';
  decoding: 'async' | 'sync';
  fetchPriority?: 'high' | 'low' | 'auto';
} {
  const { priority = false } = options;
  
  return {
    src,
    loading: priority ? 'eager' : 'lazy',
    decoding: priority ? 'sync' : 'async',
    ...(priority && { fetchPriority: 'high' as const }),
  };
}

/**
 * Preload critical images
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Preload multiple images
 */
export async function preloadImages(srcs: string[]): Promise<void> {
  await Promise.allSettled(srcs.map(preloadImage));
}

/**
 * Calculate aspect ratio from dimensions
 */
export function calculateAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(width, height);
  return `${width / divisor}/${height / divisor}`;
}

/**
 * Get placeholder data URL for blur effect
 */
export function getPlaceholderDataUrl(color: string = '#e5e7eb'): string {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect fill='${encodeURIComponent(color)}' width='1' height='1'/%3E%3C/svg%3E`;
}
