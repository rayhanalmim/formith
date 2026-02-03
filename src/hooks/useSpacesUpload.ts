/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { 
  compressImage, 
  blobToFile, 
  isImageFile, 
  isGifFile, 
  formatFileSize,
  generateLQIP 
} from '@/lib/image-compression';
import {
  isVideoFile,
  compressVideo,
  videoToFile,
  validateVideoFile,
  generateVideoThumbnail,
} from '@/lib/video-compression';

interface UploadResult {
  url: string;
  path: string;
  lqip?: string; // LQIP data URL for blur placeholder
  thumbnail?: string; // Video thumbnail URL
  mediaType?: 'image' | 'video' | 'voice' | 'file';
}

type UploadFolder = 'avatars' | 'covers' | 'posts' | 'rooms' | 'messages';

// Node.js API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Generic upload function for DigitalOcean Spaces via Node.js backend
async function uploadToSpaces(
  file: File,
  folder: UploadFolder,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  onProgress?.(10);

  // Validate file properties
  if (!file || file.size === 0) {
    throw new Error('Invalid file: file is empty or undefined');
  }
  
  const fileName = file.name || `upload-${Date.now()}.bin`;
  
  console.log(`[uploadToSpaces] Uploading file: ${fileName}, type: ${file.type}, size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

  onProgress?.(20);

  // Get auth token
  const token = localStorage.getItem('auth_token');
  if (!token) {
    throw new Error('Must be logged in to upload');
  }

  // Create FormData for file upload
  const formData = new FormData();
  formData.append('file', file, fileName);
  formData.append('folder', folder);

  onProgress?.(40);

  // Upload via Node.js backend with auth
  const response = await fetch(`${API_BASE_URL}/storage/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  onProgress?.(80);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
    console.error('[uploadToSpaces] Error:', errorData);
    throw new Error(errorData.error || 'Upload failed');
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Upload failed');
  }

  onProgress?.(100);

  return result.data as UploadResult;
}

export function useSpacesAvatarUpload() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: async (file: File): Promise<UploadResult> => {
      if (!user) throw new Error('Must be logged in to upload');

      // Validate file
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File too large. Maximum size is 5MB.');
      }

      // Compress image - NEVER compress GIFs to preserve animation
      let fileToUpload = file;
      if (isImageFile(file) && !isGifFile(file)) {
        console.log('Avatar Upload - Compressing non-GIF image to WebP');
        try {
          const compressedBlob = await compressImage(file, {
            maxWidth: 400,
            maxHeight: 400,
            quality: 0.85,
            outputType: 'webp',
          });
          fileToUpload = blobToFile(compressedBlob, 'avatar.webp');
        } catch (e) {
          console.warn('Compression failed, using original file:', e);
        }
      } else if (isGifFile(file)) {
        console.log('Avatar Upload - Preserving GIF animation, skipping compression');
      }

      const result = await uploadToSpaces(fileToUpload, 'avatars', setProgress);
      
      // Update profile with new avatar URL
      await api.updateProfile(user.id, { avatar_url: result.url });
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setProgress(0);
    },
    onError: () => {
      setProgress(0);
    },
  });

  return {
    ...mutation,
    progress,
  };
}

export function useSpacesCoverUpload() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: async (file: File): Promise<UploadResult> => {
      if (!user) throw new Error('Must be logged in to upload');

      // Validate file
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File too large. Maximum size is 10MB.');
      }

      // Compress image to WebP
      let fileToUpload = file;
      try {
        const compressedBlob = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 600,
          quality: 0.85,
          outputType: 'webp',
        });
        fileToUpload = blobToFile(compressedBlob, 'cover.webp');
      } catch (e) {
        console.warn('Compression failed, using original file:', e);
      }

      const result = await uploadToSpaces(fileToUpload, 'covers', setProgress);
      
      // Update profile with new cover URL
      await api.updateProfile(user.id, { cover_url: result.url });
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setProgress(0);
    },
    onError: () => {
      setProgress(0);
    },
  });

  return {
    ...mutation,
    progress,
  };
}

export function useSpacesPostMediaUpload() {
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: async (files: File[]): Promise<UploadResult[]> => {
      if (!user) throw new Error('Must be logged in to upload');

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
      const results: UploadResult[] = [];
      const totalFiles = files.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file
        if (!allowedTypes.includes(file.type)) {
          throw new Error(`Invalid file type: ${file.name}. Please upload images or videos only.`);
        }

        if (file.size > 500 * 1024 * 1024) {
          throw new Error(`File too large: ${file.name}. Maximum size is 500MB.`);
        }

        // Check if it's a GIF or video
        const isGif = isGifFile(file);
        const isVideo = file.type.startsWith('video/');

        console.log(`Post Media Upload [${i + 1}/${totalFiles}] - File info:`, {
          name: file.name,
          type: file.type,
          isGif: isGif,
          size: formatFileSize(file.size)
        });

        if (isImageFile(file) && !isGif && !isVideo) {
          console.log('Compressing image to WebP...');
          try {
            // Generate LQIP before compression (from original for best quality)
            let lqip: string | undefined;
            try {
              lqip = await generateLQIP(file);
              console.log('Generated LQIP placeholder');
            } catch (e) {
              console.warn('Failed to generate LQIP:', e);
            }

            const compressedBlob = await compressImage(file, {
              maxWidth: 1920,
              maxHeight: 1920,
              quality: 0.85,
              outputType: 'webp',
            });
            const fileToUpload = blobToFile(compressedBlob, `post-${i}.webp`);
            console.log(`Compressed: ${formatFileSize(file.size)} → ${formatFileSize(fileToUpload.size)}`);
            
            // Upload main file
            const result = await uploadToSpaces(
              fileToUpload, 
              'posts', 
              (p) => setProgress(Math.round(((i + p / 100) / totalFiles) * 100))
            );
            results.push({ ...result, lqip });
          } catch (e) {
            console.warn('Compression failed, using original file:', e);
            const result = await uploadToSpaces(
              file, 
              'posts', 
              (p) => setProgress(Math.round(((i + p / 100) / totalFiles) * 100))
            );
            results.push(result);
          }
        } else if (isVideo) {
          console.log('Processing video file...');
          try {
            // Validate video
            const validation = await validateVideoFile(file, 100, 300);
            if (!validation.valid) {
              throw new Error(validation.error);
            }

            // Generate thumbnail
            let thumbnail: string | undefined;
            try {
              thumbnail = await generateVideoThumbnail(file);
              console.log('Generated video thumbnail');
            } catch (e) {
              console.warn('Failed to generate video thumbnail:', e);
            }

            // Compress video if needed (over 25MB)
            let fileToUpload = file;
            if (file.size > 25 * 1024 * 1024) {
              console.log('Compressing video...');
              const compressedBlob = await compressVideo(file, {
                maxWidth: 1280,
                maxHeight: 720,
                videoBitrate: 2000,
              }, (p) => setProgress(Math.round(((i + p / 200) / totalFiles) * 100)));
              
              fileToUpload = videoToFile(compressedBlob, file.name);
              console.log(`Video compressed: ${formatFileSize(file.size)} → ${formatFileSize(fileToUpload.size)}`);
            }

            const result = await uploadToSpaces(
              fileToUpload, 
              'posts', 
              (p) => setProgress(Math.round(((i + 0.5 + p / 200) / totalFiles) * 100))
            );
            results.push({ ...result, thumbnail, mediaType: 'video' });
          } catch (e: any) {
            console.warn('Video processing failed:', e);
            throw new Error(e.message || 'Failed to process video');
          }
        } else {
          if (isGif) {
            console.log('Skipping compression - GIF detected');
          }
          // Upload original for GIFs
          const result = await uploadToSpaces(
            file, 
            'posts', 
            (p) => setProgress(Math.round(((i + p / 100) / totalFiles) * 100))
          );
          results.push({ ...result, mediaType: 'image' });
        }
      }

      return results;
    },
    onSettled: () => {
      setProgress(0);
    },
  });

  return {
    ...mutation,
    progress,
  };
}

export function useSpacesRoomMediaUpload() {
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: async (file: File): Promise<UploadResult> => {
      if (!user) throw new Error('Must be logged in to upload');

      // Validate file size (max 10MB for images/files, 50MB for videos)
      const isVideo = isVideoFile(file);
      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      
      if (file.size > maxSize) {
        throw new Error(`File too large. Maximum size is ${isVideo ? '50' : '10'}MB.`);
      }

      // Check if it's a GIF
      const isGif = isGifFile(file);
      let fileToUpload = file;
      let lqip: string | undefined;
      let thumbnail: string | undefined;
      let mediaType: 'image' | 'video' | 'file' = 'file';

      // Handle different file types
      if (isVideo) {
        console.log('Room Media - Processing video...');
        mediaType = 'video';
        
        try {
          // Validate video
          const validation = await validateVideoFile(file, 50, 180);
          if (!validation.valid) {
            throw new Error(validation.error);
          }

          // Generate thumbnail
          try {
            thumbnail = await generateVideoThumbnail(file);
            console.log('Generated video thumbnail for room');
          } catch (e) {
            console.warn('Failed to generate video thumbnail:', e);
          }

          // Compress video if over 15MB
          if (file.size > 15 * 1024 * 1024) {
            console.log('Compressing room video...');
            const compressedBlob = await compressVideo(file, {
              maxWidth: 720,
              maxHeight: 720,
              videoBitrate: 1500,
            }, setProgress);
            
            fileToUpload = videoToFile(compressedBlob, file.name);
            console.log(`Room Video compressed: ${formatFileSize(file.size)} → ${formatFileSize(fileToUpload.size)}`);
          }
        } catch (e: any) {
          console.warn('Room Video processing failed:', e);
          throw new Error(e.message || 'Failed to process video');
        }
      } else if (isImageFile(file) && !isGif) {
        console.log('Room Media - Compressing image to WebP...');
        mediaType = 'image';
        
        try {
          // Generate LQIP
          try {
            lqip = await generateLQIP(file);
            console.log('Generated LQIP placeholder for room media');
          } catch (e) {
            console.warn('Failed to generate LQIP:', e);
          }

          const compressedBlob = await compressImage(file, {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 0.85,
            outputType: 'webp',
          });
          fileToUpload = blobToFile(compressedBlob, 'room-media.webp');
        } catch (e) {
          console.warn('Compression failed, using original file:', e);
        }
      } else if (isGif) {
        mediaType = 'image';
      }

      const result = await uploadToSpaces(fileToUpload, 'rooms', setProgress);
      return { ...result, lqip, thumbnail, mediaType };
    },
    onSettled: () => {
      setProgress(0);
    },
  });

  return {
    ...mutation,
    progress,
  };
}

export function useSpacesDMMediaUpload() {
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: async (file: File): Promise<UploadResult> => {
      if (!user) throw new Error('Must be logged in to upload');

      // Validate file size (max 50MB for videos, 25MB for others)
      const isVideo = isVideoFile(file);
      const maxSize = isVideo ? 50 * 1024 * 1024 : 25 * 1024 * 1024;
      
      if (file.size > maxSize) {
        throw new Error(`File too large. Maximum size is ${isVideo ? '50' : '25'}MB.`);
      }

      // Check if it's a GIF
      const isGif = isGifFile(file);
      let fileToUpload = file;
      let lqip: string | undefined;
      let thumbnail: string | undefined;
      let mediaType: 'image' | 'video' | 'voice' | 'file' = 'file';

      // Handle different file types
      if (isVideo) {
        console.log('DM Media - Processing video...');
        mediaType = 'video';
        
        try {
          // Validate video
          const validation = await validateVideoFile(file, 50, 180); // 3 min max for DMs
          if (!validation.valid) {
            throw new Error(validation.error);
          }

          // Generate thumbnail
          try {
            thumbnail = await generateVideoThumbnail(file);
            console.log('Generated video thumbnail for DM');
          } catch (e) {
            console.warn('Failed to generate video thumbnail:', e);
          }

          // Compress video if over 15MB
          if (file.size > 15 * 1024 * 1024) {
            console.log('Compressing DM video...');
            const compressedBlob = await compressVideo(file, {
              maxWidth: 720,
              maxHeight: 720,
              videoBitrate: 1500,
            }, setProgress);
            
            fileToUpload = videoToFile(compressedBlob, file.name);
            console.log(`DM Video compressed: ${formatFileSize(file.size)} → ${formatFileSize(fileToUpload.size)}`);
          }
        } catch (e: any) {
          console.warn('DM Video processing failed:', e);
          throw new Error(e.message || 'Failed to process video');
        }
      } else if (isImageFile(file) && !isGif) {
        console.log('DM Media - Compressing image to WebP...');
        mediaType = 'image';
        
        try {
          // Generate LQIP
          try {
            lqip = await generateLQIP(file);
            console.log('Generated LQIP placeholder for DM media');
          } catch (e) {
            console.warn('Failed to generate LQIP:', e);
          }

          const compressedBlob = await compressImage(file, {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 0.85,
            outputType: 'webp',
          });
          fileToUpload = blobToFile(compressedBlob, 'dm-media.webp');
        } catch (e) {
          console.warn('Compression failed, using original file:', e);
        }
      } else if (isGif) {
        mediaType = 'image';
      } else if (file.type.startsWith('audio/')) {
        mediaType = 'voice';
      }

      const result = await uploadToSpaces(fileToUpload, 'messages', setProgress);
      return { ...result, lqip, thumbnail, mediaType };
    },
    onSettled: () => {
      setProgress(0);
    },
  });

  return {
    ...mutation,
    progress,
  };
}
