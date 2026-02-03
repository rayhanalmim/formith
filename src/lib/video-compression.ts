/**
 * Video compression and conversion utilities
 * Uses browser-native APIs for client-side video processing
 */

export interface VideoCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  videoBitrate?: number; // in kbps
  audioBitrate?: number; // in kbps
  outputFormat?: 'webm' | 'mp4';
}

export interface VideoInfo {
  duration: number;
  width: number;
  height: number;
  size: number;
}

/**
 * Get video information (duration, dimensions)
 */
export function getVideoInfo(file: File): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        size: file.size,
      });
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    };
    
    video.src = URL.createObjectURL(file);
  });
}

/**
 * Check if file is a video
 */
export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/');
}

/**
 * Check if video needs compression based on size
 */
export function videoNeedsCompression(file: File, maxSizeMB: number = 25): boolean {
  return file.size > maxSizeMB * 1024 * 1024;
}

/**
 * Format video duration in MM:SS format
 */
export function formatVideoDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate optimal dimensions maintaining aspect ratio
 */
function calculateOptimalDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = width / height;
  
  let newWidth = width;
  let newHeight = height;
  
  if (width > maxWidth) {
    newWidth = maxWidth;
    newHeight = Math.round(maxWidth / aspectRatio);
  }
  
  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = Math.round(maxHeight * aspectRatio);
  }
  
  // Ensure dimensions are even (required for some codecs)
  return {
    width: Math.floor(newWidth / 2) * 2,
    height: Math.floor(newHeight / 2) * 2,
  };
}

/**
 * Compress video using MediaRecorder API
 * This creates a WebM output with VP9 video codec
 */
export async function compressVideo(
  file: File,
  options: VideoCompressionOptions = {},
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const {
    maxWidth = 1280,
    maxHeight = 720,
    videoBitrate = 2000, // 2 Mbps
    audioBitrate = 128, // 128 kbps
  } = options;

  console.log('Starting video compression:', {
    originalSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    maxWidth,
    maxHeight,
    videoBitrate: `${videoBitrate} kbps`,
  });

  onProgress?.(5);

  // Get video info
  const videoInfo = await getVideoInfo(file);
  console.log('Video info:', videoInfo);

  // If video is already small enough and correct format, return as-is
  if (file.size < 10 * 1024 * 1024 && 
      videoInfo.width <= maxWidth && 
      videoInfo.height <= maxHeight) {
    console.log('Video already optimized, skipping compression');
    onProgress?.(100);
    return file;
  }

  onProgress?.(10);

  // Create video element.
  // IMPORTANT: must be muted for programmatic play() to work reliably (autoplay policy).
  // We'll capture audio separately via captureStream() when available.
  const video = document.createElement('video');
  video.muted = true;
  video.volume = 0;
  video.playsInline = true;
  video.src = URL.createObjectURL(file);
  
  await new Promise<void>((resolve, reject) => {
    video.onloadeddata = () => resolve();
    video.onerror = () => reject(new Error('Failed to load video'));
    video.load();
  });

  onProgress?.(20);

  // Calculate output dimensions
  const outputDimensions = calculateOptimalDimensions(
    videoInfo.width,
    videoInfo.height,
    maxWidth,
    maxHeight
  );

  console.log('Output dimensions:', outputDimensions);

  // Create canvas for video processing
  const canvas = document.createElement('canvas');
  canvas.width = outputDimensions.width;
  canvas.height = outputDimensions.height;
  const ctx = canvas.getContext('2d')!;

  // Get canvas stream
  const stream = canvas.captureStream(30); // 30 fps

  // Add audio track if present.
  // Prefer captureStream() from the video element: it's the most reliable way to keep original audio
  // while keeping the element muted for autoplay.
  try {
    const videoAny = video as any;
    const mediaStream: MediaStream | undefined =
      typeof videoAny.captureStream === 'function'
        ? (videoAny.captureStream() as MediaStream)
        : typeof videoAny.mozCaptureStream === 'function'
          ? (videoAny.mozCaptureStream() as MediaStream)
          : undefined;

    const audioTrack = mediaStream?.getAudioTracks?.()?.[0];
    if (audioTrack) {
      stream.addTrack(audioTrack);
      console.log('Audio track added to stream via captureStream');
    } else {
      console.log('No audio track detected (captureStream)');
    }
  } catch (e) {
    console.warn('Could not capture audio track:', e);
  }

  // Determine best codec
  const mimeTypes = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];
  
  let mimeType = 'video/webm';
  for (const type of mimeTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      mimeType = type;
      break;
    }
  }

  console.log('Using codec:', mimeType);

  // Create MediaRecorder
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: videoBitrate * 1000,
    audioBitsPerSecond: audioBitrate * 1000,
  });

  const chunks: Blob[] = [];
  
  return new Promise((resolve, reject) => {
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType.split(';')[0] });
      console.log('Compression complete:', {
        originalSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        compressedSize: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
        reduction: `${Math.round((1 - blob.size / file.size) * 100)}%`,
      });
      URL.revokeObjectURL(video.src);
      onProgress?.(100);
      resolve(blob);
    };

    mediaRecorder.onerror = (e) => {
      URL.revokeObjectURL(video.src);
      reject(new Error('MediaRecorder error'));
    };

    // Start recording
    mediaRecorder.start();

    // Play video and render to canvas
    video.currentTime = 0;
    video.play().catch((err) => {
      console.warn('Video play() failed during compression (autoplay policy?):', err);
      // If this ever happens, the recording will stop almost immediately.
      // Keep muted=true (required), but surface a clear failure.
    });

    const renderFrame = () => {
      if (video.ended || video.paused) {
        mediaRecorder.stop();
        return;
      }

      ctx.drawImage(video, 0, 0, outputDimensions.width, outputDimensions.height);
      
      // Update progress
      const progress = Math.min(90, 20 + (video.currentTime / videoInfo.duration) * 70);
      onProgress?.(progress);
      
      requestAnimationFrame(renderFrame);
    };

    video.onended = () => {
      setTimeout(() => mediaRecorder.stop(), 100);
    };

    renderFrame();
  });
}

/**
 * Generate video thumbnail
 */
export async function generateVideoThumbnail(
  file: File,
  timeOffset: number = 1
): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    
    video.onloadedmetadata = () => {
      // Seek to the specified time or 10% of duration
      video.currentTime = Math.min(timeOffset, video.duration * 0.1);
    };
    
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      // Thumbnail at 320px width maintaining aspect ratio
      const aspectRatio = video.videoWidth / video.videoHeight;
      canvas.width = 320;
      canvas.height = Math.round(320 / aspectRatio);
      
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      URL.revokeObjectURL(video.src);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to generate thumbnail'));
    };
    
    video.src = URL.createObjectURL(file);
  });
}

/**
 * Validate video file
 */
export interface VideoValidationResult {
  valid: boolean;
  error?: string;
}

export function validateVideoFile(
  file: File,
  maxSizeMB: number = 100,
  maxDurationSeconds: number = 300 // 5 minutes
): Promise<VideoValidationResult> {
  return new Promise(async (resolve) => {
    // Check file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedTypes.includes(file.type)) {
      resolve({
        valid: false,
        error: 'Unsupported video format. Please use MP4, WebM, or MOV.',
      });
      return;
    }

    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      resolve({
        valid: false,
        error: `Video too large. Maximum size is ${maxSizeMB}MB.`,
      });
      return;
    }

    // Check duration
    try {
      const info = await getVideoInfo(file);
      if (info.duration > maxDurationSeconds) {
        resolve({
          valid: false,
          error: `Video too long. Maximum duration is ${Math.floor(maxDurationSeconds / 60)} minutes.`,
        });
        return;
      }
    } catch (e) {
      resolve({
        valid: false,
        error: 'Could not read video file.',
      });
      return;
    }

    resolve({ valid: true });
  });
}

/**
 * Convert File to optimized Blob with extension
 */
export function videoToFile(blob: Blob, originalName: string): File {
  const extension = blob.type.includes('webm') ? 'webm' : 'mp4';
  const baseName = originalName.replace(/\.[^/.]+$/, '');
  return new File([blob], `${baseName}.${extension}`, { type: blob.type });
}
