/**
 * Global cache for decrypted DM content and media
 * Prevents re-decryption on re-renders or navigation
 */

interface CachedDecryption {
  content: string;
  mediaUrl?: string;
  timestamp: number;
}

// In-memory cache for decrypted messages
const messageCache = new Map<string, CachedDecryption>();

// In-memory cache for decrypted media URLs
const mediaUrlCache = new Map<string, string>();

// Cache for conversation encryption keys
const keyCache = new Map<string, CryptoKey>();

// Max cache age (30 minutes)
const MAX_CACHE_AGE = 30 * 60 * 1000;

/**
 * Get cached decrypted message
 */
export function getCachedMessage(messageId: string): CachedDecryption | null {
  const cached = messageCache.get(messageId);
  if (!cached) return null;
  
  // Check if cache is still valid
  if (Date.now() - cached.timestamp > MAX_CACHE_AGE) {
    messageCache.delete(messageId);
    return null;
  }
  
  return cached;
}

/**
 * Cache a decrypted message
 */
export function setCachedMessage(
  messageId: string,
  content: string,
  mediaUrl?: string
): void {
  messageCache.set(messageId, {
    content,
    mediaUrl,
    timestamp: Date.now(),
  });
}

/**
 * Get cached media URL
 */
export function getCachedMediaUrl(cacheKey: string): string | null {
  return mediaUrlCache.get(cacheKey) || null;
}

/**
 * Cache a decrypted media URL
 */
export function setCachedMediaUrl(cacheKey: string, url: string): void {
  mediaUrlCache.set(cacheKey, url);
}

/**
 * Get cached conversation key
 */
export function getCachedKey(conversationId: string): CryptoKey | null {
  return keyCache.get(conversationId) || null;
}

/**
 * Cache a conversation key
 */
export function setCachedKey(conversationId: string, key: CryptoKey): void {
  keyCache.set(conversationId, key);
}

/**
 * Clear message cache for a specific conversation
 * If no conversationId is provided, clears all message caches
 */
export function clearConversationCache(_conversationId?: string): void {
  // Find and remove all messages for this conversation
  // Messages are keyed by message ID, so we can't easily filter by conversation
  // For now, just clear all - this is called when switching conversations
  messageCache.clear();
}

/**
 * Clear all caches (call on logout)
 */
export function clearAllDecryptionCaches(): void {
  // Revoke all blob URLs
  mediaUrlCache.forEach((url) => {
    if (url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    }
  });
  
  messageCache.clear();
  mediaUrlCache.clear();
  keyCache.clear();
}

/**
 * Generate a cache key for media
 */
export function getMediaCacheKey(conversationId: string, mediaUrl: string): string {
  return `${conversationId}:${mediaUrl}`;
}
