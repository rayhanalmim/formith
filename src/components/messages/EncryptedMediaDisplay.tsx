import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Conversation } from '@/hooks/useMessages';
import { api } from '@/lib/api';
import {
  getConversationKey,
  decryptFile,
  parseEncryptedPayload,
} from '@/lib/encryption';
import { Loader2, Lock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VideoPlayer } from '@/components/ui/video-player';
import {
  getCachedMediaUrl,
  setCachedMediaUrl,
  getCachedKey,
  setCachedKey,
  getMediaCacheKey,
} from '@/lib/decryption-cache';

interface EncryptedMediaDisplayProps {
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'voice' | 'file' | null;
  content: string; // The encrypted content JSON containing originalMediaType
  conversation: Conversation;
  className?: string;
  onImageClick?: (decryptedUrl: string) => void;
}

/**
 * Component that handles decryption and display of encrypted media
 * Uses global cache to prevent re-decryption
 */
export const EncryptedMediaDisplay = memo(function EncryptedMediaDisplay({
  mediaUrl,
  mediaType,
  content,
  conversation,
  className,
  onImageClick,
}: EncryptedMediaDisplayProps) {
  const { user } = useAuth();
  const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const decryptingRef = useRef(false);

  // Check if media is encrypted based on content payload
  const payload = parseEncryptedPayload(content);
  const isEncrypted = payload?.mediaEncrypted === true;
  const originalMediaType = payload?.originalMediaType || mediaType;

  const decryptMedia = useCallback(async () => {
    if (!mediaUrl || !user || !conversation || decryptingRef.current) return;

    // Generate cache key
    const cacheKey = getMediaCacheKey(conversation.id, mediaUrl);
    
    // Check global cache first
    const cachedUrl = getCachedMediaUrl(cacheKey);
    if (cachedUrl) {
      setDecryptedUrl(cachedUrl);
      return;
    }

    // If not encrypted, just use the URL directly and cache it
    if (!isEncrypted) {
      setDecryptedUrl(mediaUrl);
      setCachedMediaUrl(cacheKey, mediaUrl);
      return;
    }

    decryptingRef.current = true;
    setIsDecrypting(true);
    setError(null);

    try {
      // Get or derive the conversation key (cached)
      let key = getCachedKey(conversation.id);
      if (!key) {
        key = await getConversationKey(
          conversation.id,
          user.id,
          conversation.other_user.user_id
        );
        setCachedKey(conversation.id, key);
      }

      // Fetch encrypted media via Node.js proxy (streams binary directly, cached in Redis)
      console.log('[EncryptedMediaDisplay] Fetching encrypted media via proxy:', mediaUrl);
      
      const encryptedBlob = await api.fetchProxyMedia(mediaUrl);
      console.log('[EncryptedMediaDisplay] Encrypted blob size:', encryptedBlob.size);

      // Decrypt with E2E key (single layer - matching useEncryptedSendMessage)
      const decryptedBlob = await decryptFile(
        encryptedBlob,
        key,
        originalMediaType || 'application/octet-stream'
      );
      console.log('[EncryptedMediaDisplay] Decrypted blob size:', decryptedBlob.size);

      // Create object URL and cache it globally
      const objectUrl = URL.createObjectURL(decryptedBlob);
      setCachedMediaUrl(cacheKey, objectUrl);
      setDecryptedUrl(objectUrl);
    } catch (err) {
      console.error('[EncryptedMediaDisplay] Decryption failed:', err);
      setError('Failed to decrypt media');
      // Fallback to original URL
      setDecryptedUrl(mediaUrl);
    } finally {
      setIsDecrypting(false);
      decryptingRef.current = false;
    }
  }, [mediaUrl, user, conversation, isEncrypted, originalMediaType]);

  useEffect(() => {
    decryptMedia();
  }, [decryptMedia]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      // Note: Don't revoke cached URLs as they may be used by other components
    };
  }, []);

  if (isDecrypting) {
    return (
      <div className={cn(
        "flex items-center justify-center gap-2 p-4 bg-muted/50 rounded-lg",
        className
      )}>
        <Lock className="h-4 w-4 text-primary animate-pulse" />
        {/* <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-xs text-muted-foreground">Decrypting...</span> */}
      </div>
    );
  }

  if (error && !decryptedUrl) {
    return (
      <div className={cn(
        "flex items-center justify-center gap-2 p-4 bg-destructive/10 rounded-lg",
        className
      )}>
        <AlertCircle className="h-4 w-4 text-destructive" />
        <span className="text-xs text-destructive">{error}</span>
      </div>
    );
  }

  if (!decryptedUrl) {
    return null;
  }

  // Determine actual media type from URL or content
  const actualMediaType = originalMediaType?.startsWith('video/') || mediaType === 'video'
    ? 'video'
    : originalMediaType?.startsWith('audio/') || mediaType === 'voice'
    ? 'voice'
    : originalMediaType?.startsWith('image/') || mediaType === 'image'
    ? 'image'
    : 'file';

  if (actualMediaType === 'voice') {
    return (
      <audio src={decryptedUrl} controls className={cn("max-w-full", className)} />
    );
  }

  if (actualMediaType === 'video') {
    return (
      <VideoPlayer
        src={decryptedUrl}
        className={cn("max-w-full rounded-lg", className)}
        maxHeight="15rem"
        showControls={true}
      />
    );
  }

  if (actualMediaType === 'image') {
    return (
      <button onClick={() => onImageClick?.(decryptedUrl)} className="block relative">
        <img
          src={decryptedUrl}
          alt=""
          className={cn(
            "max-w-full rounded-lg max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity",
            className
          )}
        />
      </button>
    );
  }

  // File download
  return (
    <a
      href={decryptedUrl}
      download
      className={cn("flex items-center gap-2 p-2 rounded-lg bg-background", className)}
    >
      <span className="text-sm underline">Download File</span>
    </a>
  );
});

/**
 * Clear the media decryption cache (call when switching conversations)
 * Re-exported from centralized cache
 */
export { clearAllDecryptionCaches as clearMediaDecryptionCache } from '@/lib/decryption-cache';
