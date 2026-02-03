import { useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getConversationKey,
  encryptText,
  decryptText,
  encryptFile,
  decryptFile,
  isEncryptedMessage,
  parseEncryptedPayload,
  createEncryptedPayload,
  fileToBase64,
  base64ToBlob,
} from '@/lib/encryption';
import type { Conversation, DirectMessage } from '@/hooks/useMessages';

// Cache for conversation keys to avoid repeated derivation
const keyCache = new Map<string, CryptoKey>();

export function useConversationEncryption(conversation: Conversation | null) {
  const { user } = useAuth();

  /**
   * Get or derive the encryption key for this conversation
   */
  const getKey = useCallback(async (): Promise<CryptoKey | null> => {
    if (!conversation || !user) return null;

    const cacheKey = conversation.id;
    
    // Check cache first
    if (keyCache.has(cacheKey)) {
      return keyCache.get(cacheKey)!;
    }

    // Derive key from conversation and participants
    const key = await getConversationKey(
      conversation.id,
      user.id,
      conversation.other_user.user_id
    );

    // Cache the key
    keyCache.set(cacheKey, key);

    return key;
  }, [conversation, user]);

  /**
   * Encrypt a message before sending
   */
  const encryptMessage = useCallback(async (
    content: string,
    mediaFile?: File | null,
    mediaType?: string | null
  ): Promise<{
    encryptedContent: string;
    encryptedMediaBase64?: string;
    originalMediaType?: string;
  }> => {
    const key = await getKey();
    if (!key) {
      throw new Error('Unable to get encryption key');
    }

    // Encrypt text content
    const encryptedText = await encryptText(content, key);

    // Encrypt media if present
    let encryptedMediaBase64: string | undefined;
    let originalMediaType: string | undefined;

    if (mediaFile) {
      const encryptedBlob = await encryptFile(mediaFile, key);
      encryptedMediaBase64 = await fileToBase64(encryptedBlob);
      originalMediaType = mediaType || mediaFile.type;
    }

    // Create encrypted payload
    const encryptedContent = createEncryptedPayload(
      encryptedText,
      !!encryptedMediaBase64,
      originalMediaType
    );

    return {
      encryptedContent,
      encryptedMediaBase64,
      originalMediaType,
    };
  }, [getKey]);

  /**
   * Decrypt a message for display
   */
  const decryptMessage = useCallback(async (
    message: DirectMessage
  ): Promise<{
    content: string;
    mediaBlob?: Blob;
    mediaUrl?: string;
  }> => {
    // Check if message is encrypted
    if (!isEncryptedMessage(message.content)) {
      // Return as-is for non-encrypted messages (backward compatibility)
      return {
        content: message.content,
        mediaUrl: message.media_url || undefined,
      };
    }

    const key = await getKey();
    if (!key) {
      return {
        content: '[Unable to decrypt - encryption key unavailable]',
      };
    }

    const payload = parseEncryptedPayload(message.content);
    if (!payload) {
      return {
        content: '[Invalid encrypted message format]',
      };
    }

    try {
      // Decrypt text content
      const decryptedText = await decryptText(payload.ciphertext, key);

      // Handle media decryption if present
      let mediaBlob: Blob | undefined;
      let mediaUrl: string | undefined;

      if (payload.mediaEncrypted && message.media_url) {
        // For encrypted media, we need to fetch and decrypt
        // The media_url points to encrypted data
        try {
          const response = await fetch(message.media_url);
          const encryptedBlob = await response.blob();
          mediaBlob = await decryptFile(
            encryptedBlob,
            key,
            payload.originalMediaType || 'application/octet-stream'
          );
          mediaUrl = URL.createObjectURL(mediaBlob);
        } catch (mediaError) {
          console.error('Failed to decrypt media:', mediaError);
          mediaUrl = undefined;
        }
      } else if (message.media_url) {
        // Non-encrypted media (backward compatibility)
        mediaUrl = message.media_url;
      }

      return {
        content: decryptedText,
        mediaBlob,
        mediaUrl,
      };
    } catch (error) {
      console.error('Decryption failed:', error);
      return {
        content: '[Decryption failed]',
      };
    }
  }, [getKey]);

  /**
   * Batch decrypt multiple messages
   */
  const decryptMessages = useCallback(async (
    messages: DirectMessage[]
  ): Promise<Map<string, { content: string; mediaUrl?: string }>> => {
    const results = new Map<string, { content: string; mediaUrl?: string }>();

    // Process in parallel for better performance
    await Promise.all(
      messages.map(async (message) => {
        const decrypted = await decryptMessage(message);
        results.set(message.id, {
          content: decrypted.content,
          mediaUrl: decrypted.mediaUrl,
        });
      })
    );

    return results;
  }, [decryptMessage]);

  /**
   * Check if encryption is available for this conversation
   */
  const isEncryptionAvailable = useMemo(() => {
    return !!conversation && !!user;
  }, [conversation, user]);

  return {
    encryptMessage,
    decryptMessage,
    decryptMessages,
    isEncryptionAvailable,
    getKey,
  };
}

/**
 * Hook to get decrypted content for a single message
 */
export function useDecryptedMessage(
  message: DirectMessage | null,
  conversation: Conversation | null
) {
  const { decryptMessage } = useConversationEncryption(conversation);

  const decrypt = useCallback(async () => {
    if (!message) return null;
    return await decryptMessage(message);
  }, [message, decryptMessage]);

  return { decrypt };
}
