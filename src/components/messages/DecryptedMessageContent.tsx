import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { DirectMessage, Conversation } from '@/hooks/useMessages';
import { 
  isEncryptedMessage, 
  parseEncryptedPayload,
  decryptText,
  getConversationKey,
} from '@/lib/encryption';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Lock, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { decryptFile } from '@/lib/encryption';
import {
  getCachedMessage,
  setCachedMessage,
  getCachedMediaUrl,
  setCachedMediaUrl,
  getCachedKey,
  setCachedKey,
  getMediaCacheKey,
} from '@/lib/decryption-cache';

interface DecryptedMessageContentProps {
  message: DirectMessage;
  conversation: Conversation;
  renderContent: (content: string, mediaUrl?: string) => React.ReactNode;
}

/**
 * Component that handles decryption and display of encrypted messages
 * Uses global cache to prevent re-decryption on re-renders
 */
export const DecryptedMessageContent = memo(function DecryptedMessageContent({
  message,
  conversation,
  renderContent,
}: DecryptedMessageContentProps) {
  const { user } = useAuth();
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [decryptedMediaUrl, setDecryptedMediaUrl] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const decryptingRef = useRef(false);

  const decryptMessage = useCallback(async () => {
    if (!user || decryptingRef.current) return;

    // Check global cache first
    const cached = getCachedMessage(message.id);
    if (cached) {
      setDecryptedContent(cached.content);
      setDecryptedMediaUrl(cached.mediaUrl || null);
      return;
    }

    // Check if message is encrypted
    if (!isEncryptedMessage(message.content)) {
      // Not encrypted - use as-is
      setDecryptedContent(message.content);
      setDecryptedMediaUrl(message.media_url || null);
      setCachedMessage(message.id, message.content, message.media_url || undefined);
      return;
    }

    decryptingRef.current = true;
    setIsDecrypting(true);
    setError(null);

    try {
      const payload = parseEncryptedPayload(message.content);
      if (!payload) {
        setError('Invalid encrypted message');
        return;
      }

      // Get or derive conversation key (cached)
      let key = getCachedKey(conversation.id);
      if (!key) {
        key = await getConversationKey(
          conversation.id,
          user.id,
          conversation.other_user.user_id
        );
        setCachedKey(conversation.id, key);
      }

      // Decrypt text content
      const content = await decryptText(payload.ciphertext, key);
      setDecryptedContent(content);

      // Handle media
      let finalMediaUrl = message.media_url || null;
      
      if (message.media_url && payload.mediaEncrypted) {
        // Check media cache first
        const mediaCacheKey = getMediaCacheKey(conversation.id, message.media_url);
        const cachedMedia = getCachedMediaUrl(mediaCacheKey);
        
        if (cachedMedia) {
          finalMediaUrl = cachedMedia;
        } else {
          // Decrypt media - fetch via proxy and decrypt with E2E key
          try {
            console.log('[DecryptedMessageContent] Fetching encrypted media...');
            const encryptedBlob = await api.fetchProxyMedia(message.media_url);

            // Decrypt with E2E key
            const decryptedBlob = await decryptFile(
              encryptedBlob,
              key,
              payload.originalMediaType || 'application/octet-stream'
            );

            const objectUrl = URL.createObjectURL(decryptedBlob);
            setCachedMediaUrl(mediaCacheKey, objectUrl);
            finalMediaUrl = objectUrl;
            console.log('[DecryptedMessageContent] Media decrypted and cached');
          } catch (mediaError) {
            console.error('[DecryptedMessageContent] Failed to decrypt media:', mediaError);
            // Still show the message content even if media fails
          }
        }
      } else if (message.media_url) {
        // Non-encrypted media - use directly
        finalMediaUrl = message.media_url;
      }
      
      setDecryptedMediaUrl(finalMediaUrl);

      // Cache the result
      setCachedMessage(message.id, content, finalMediaUrl || undefined);
    } catch (err) {
      console.error('[DecryptedMessageContent] Decryption failed:', err);
      setError('Failed to decrypt message');
    } finally {
      setIsDecrypting(false);
      decryptingRef.current = false;
    }
  }, [message.id, message.content, message.media_url, conversation.id, conversation.other_user.user_id, user]);

  // Decrypt on mount
  useEffect(() => {
    decryptMessage();
  }, [decryptMessage]);

  if (isDecrypting) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        {/* <Lock className="h-3 w-3" />
        <span className="text-xs">Decrypting...</span> */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="h-3 w-3" />
        <span className="text-xs">{error}</span>
      </div>
    );
  }

  if (decryptedContent === null) {
    return null;
  }

  return <>{renderContent(decryptedContent, decryptedMediaUrl || undefined)}</>;
});

/**
 * Check if a message is encrypted
 */
export function isMessageEncrypted(message: DirectMessage): boolean {
  return isEncryptedMessage(message.content);
}

/**
 * Get the encryption indicator for a message
 */
export function EncryptionIndicator({ message }: { message: DirectMessage }) {
  if (!isEncryptedMessage(message.content)) {
    return null;
  }

  return (
    <span title="End-to-end encrypted">
      <Lock className="h-3 w-3 text-muted-foreground" />
    </span>
  );
}

/**
 * Clear the decryption cache (call when conversation changes)
 * Re-exported from centralized cache
 */
export { clearConversationCache as clearDecryptionCache } from '@/lib/decryption-cache';
