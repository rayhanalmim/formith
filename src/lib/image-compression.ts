/**
 * Utility functions for image compression and WebP conversion
 */

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputType?: 'webp' | 'jpeg' | 'png';
}

// Image size variants for responsive images
export interface ImageVariants {
  original: Blob;
  large: Blob;
  medium: Blob;
  thumbnail: Blob;
}

export interface ImageVariantFiles {
  original: File;
  large: File;
  medium: File;
  thumbnail: File;
}

// LQIP (Low-Quality Image Placeholder) configuration
const LQIP_SIZE = 20; // 20px wide tiny image
const LQIP_QUALITY = 0.3; // Low quality for minimal size

// Size configurations for variants
const VARIANT_SIZES = {
  thumbnail: { width: 150, height: 150, quality: 0.7 },
  medium: { width: 640, height: 640, quality: 0.8 },
  large: { width: 1280, height: 1280, quality: 0.85 },
};

/**
 * Compress and convert an image file to WebP format
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.8,
    outputType = 'webp',
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

      const mimeType = `image/${outputType}`;
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load image from file
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Generate multiple size variants of an image
 */
export async function generateImageVariants(file: File): Promise<ImageVariants> {
  // Load image once
  const img = await loadImage(file);
  
  const [thumbnail, medium, large, original] = await Promise.all([
    resizeToBlob(img, VARIANT_SIZES.thumbnail.width, VARIANT_SIZES.thumbnail.height, VARIANT_SIZES.thumbnail.quality),
    resizeToBlob(img, VARIANT_SIZES.medium.width, VARIANT_SIZES.medium.height, VARIANT_SIZES.medium.quality),
    resizeToBlob(img, VARIANT_SIZES.large.width, VARIANT_SIZES.large.height, VARIANT_SIZES.large.quality),
    compressImage(file, { maxWidth: 1920, maxHeight: 1920, quality: 0.85, outputType: 'webp' }),
  ]);

  return { original, large, medium, thumbnail };
}

/**
 * Generate image variants as Files with proper naming
 */
export async function generateImageVariantFiles(
  file: File,
  baseName: string = 'image'
): Promise<ImageVariantFiles> {
  const variants = await generateImageVariants(file);
  
  return {
    original: blobToFile(variants.original, `${baseName}.webp`),
    large: blobToFile(variants.large, `${baseName}-large.webp`),
    medium: blobToFile(variants.medium, `${baseName}-medium.webp`),
    thumbnail: blobToFile(variants.thumbnail, `${baseName}-thumb.webp`),
  };
}

/**
 * Load an image from a File
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    
    reader.onload = (e) => {
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Resize image to blob with max dimensions
 */
function resizeToBlob(
  img: HTMLImageElement,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    let { width, height } = img;
    
    // Calculate new dimensions maintaining aspect ratio
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }
    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      'image/webp',
      quality
    );
  });
}

/**
 * Generate LQIP (Low-Quality Image Placeholder) as base64 data URL
 * Creates a tiny, blurred version of the image for smooth loading transitions
 */
export async function generateLQIP(file: File): Promise<string> {
  const img = await loadImage(file);
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    // Calculate dimensions maintaining aspect ratio
    let { width, height } = img;
    const aspectRatio = width / height;
    
    if (aspectRatio > 1) {
      // Landscape
      width = LQIP_SIZE;
      height = Math.round(LQIP_SIZE / aspectRatio);
    } else {
      // Portrait or square
      height = LQIP_SIZE;
      width = Math.round(LQIP_SIZE * aspectRatio);
    }

    canvas.width = width;
    canvas.height = height;
    
    // Apply slight blur for smoother placeholder
    ctx.filter = 'blur(1px)';
    ctx.drawImage(img, 0, 0, width, height);

    // Convert to base64 data URL
    const dataUrl = canvas.toDataURL('image/webp', LQIP_QUALITY);
    resolve(dataUrl);
  });
}

/**
 * Generate LQIP from an HTMLImageElement (already loaded)
 */
export function generateLQIPFromImage(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    return '';
  }

  // Calculate dimensions maintaining aspect ratio
  let { width, height } = img;
  const aspectRatio = width / height;
  
  if (aspectRatio > 1) {
    width = LQIP_SIZE;
    height = Math.round(LQIP_SIZE / aspectRatio);
  } else {
    height = LQIP_SIZE;
    width = Math.round(LQIP_SIZE * aspectRatio);
  }

  canvas.width = width;
  canvas.height = height;
  ctx.filter = 'blur(1px)';
  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL('image/webp', LQIP_QUALITY);
}

/**
 * Compress multiple images
 */
export async function compressImages(
  files: File[],
  options: CompressOptions = {}
): Promise<Blob[]> {
  return Promise.all(files.map((file) => compressImage(file, options)));
}

/**
 * Convert a Blob to a File with a new name
 * Only changes extension to .webp if the blob type is webp
 */
export function blobToFile(blob: Blob, fileName: string): File {
  // Only replace extension with .webp if the blob is actually webp
  const isWebpBlob = blob.type === 'image/webp';
  const newFileName = isWebpBlob 
    ? fileName.replace(/\.[^.]+$/, '.webp')
    : fileName;
  return new File([blob], newFileName, { type: blob.type });
}

/**
 * Get file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Check if a file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Check if a file is a GIF (should not be compressed to preserve animation)
 */
export function isGifFile(file: File | Blob): boolean {
  // Check MIME type first
  const hasGifMimeType = file.type === 'image/gif';
  // Safely check file extension only if file has a name property
  const hasGifExtension = 'name' in file && typeof file.name === 'string' 
    ? file.name.toLowerCase().endsWith('.gif') 
    : false;
  return hasGifMimeType || hasGifExtension;
}

/**
 * Check if browser supports WebP
 */
export function supportsWebP(): boolean {
  const canvas = document.createElement('canvas');
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

/**
 * Get srcset string for responsive image variants
 */
export function getVariantSrcSet(baseUrl: string): string {
  // Extract path without extension
  const urlParts = baseUrl.split('.');
  urlParts.pop(); // Remove extension
  const basePath = urlParts.join('.');
  
  return [
    `${basePath}-thumb.webp 150w`,
    `${basePath}-medium.webp 640w`,
    `${basePath}-large.webp 1280w`,
    `${baseUrl} 1920w`,
  ].join(', ');
}

/**
 * Get appropriate image URL based on container size
 */
export function getResponsiveImageUrl(baseUrl: string, containerWidth: number): string {
  if (!baseUrl || !baseUrl.includes('.webp')) return baseUrl;
  
  const urlParts = baseUrl.split('.');
  urlParts.pop();
  const basePath = urlParts.join('.');
  
  if (containerWidth <= 150) return `${basePath}-thumb.webp`;
  if (containerWidth <= 640) return `${basePath}-medium.webp`;
  if (containerWidth <= 1280) return `${basePath}-large.webp`;
  return baseUrl;
}

/**
 * Create a CSS blur filter data URL for LQIP
 */
export function createBlurDataURL(dataUrl: string): string {
  return dataUrl;
}

/**
 * Check if a string is a valid LQIP data URL
 */
export function isValidLQIP(lqip: string | undefined | null): boolean {
  return typeof lqip === 'string' && lqip.startsWith('data:image/');
}
