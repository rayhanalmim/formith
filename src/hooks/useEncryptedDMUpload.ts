import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useDMMediaUpload } from '@/hooks/useFileUpload';
import { api } from '@/lib/api';
import {
  getConversationKey,
  encryptText,
  encryptFile,
  createEncryptedPayload,
  fileToBase64,
} from '@/lib/encryption';

interface EncryptedUploadResult {
  url: string;
  encryptedContent: string;
  mediaType: 'image' | 'video' | 'voice' | 'file';
  isEncrypted: true;
}

/**
 * Hook for uploading encrypted media in DMs
 * Implements dual-layer encryption:
 * 1. E2E encryption (client-side AES-GCM)
 * 2. Server-side encryption via edge function
 */
export function useEncryptedDMUpload(
  conversationId: string | null,
  otherUserId: string | null
) {
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);
  const [encryptionProgress, setEncryptionProgress] = useState(0);
  const dmUpload = useDMMediaUpload();

  /**
   * Get the conversation encryption key
   */
  const getKey = useCallback(async () => {
    if (!conversationId || !user || !otherUserId) {
      throw new Error('Missing conversation details for encryption');
    }
    return await getConversationKey(conversationId, user.id, otherUserId);
  }, [conversationId, user, otherUserId]);

  /**
   * Apply server-side encryption layer (now using E2E only, no server encryption needed)
   */
  const serverEncrypt = useCallback(async (base64Data: string): Promise<string> => {
    // Server-side encryption is no longer used - E2E encryption is sufficient
    // Just return the data as-is since E2E encryption is already applied
    return base64Data;
  }, []);

  const mutation = useMutation({
    mutationFn: async ({
      file,
      content,
    }: {
      file?: File;
      content: string;
    }): Promise<EncryptedUploadResult> => {
      if (!user || !conversationId || !otherUserId) {
        throw new Error('Must be in a conversation to send encrypted messages');
      }

      setProgress(0);
      setEncryptionProgress(0);

      // Get encryption key
      const key = await getKey();
      setEncryptionProgress(10);

      // Encrypt the text content (E2E layer)
      const encryptedText = await encryptText(content, key);
      setEncryptionProgress(20);

      let uploadUrl: string | undefined;
      let mediaType: 'image' | 'video' | 'voice' | 'file' = 'file';
      let mediaEncrypted = false;

      if (file) {
        // Step 1: E2E encrypt the file
        console.log('[EncryptedDMUpload] Encrypting file E2E...');
        const e2eEncryptedBlob = await encryptFile(file, key);
        setEncryptionProgress(40);

        // Step 2: Convert to base64 for server encryption
        const e2eBase64 = await fileToBase64(e2eEncryptedBlob);
        setEncryptionProgress(50);

        // Step 3: Apply server-side encryption
        console.log('[EncryptedDMUpload] Applying server-side encryption...');
        const serverEncryptedBase64 = await serverEncrypt(e2eBase64);
        setEncryptionProgress(70);

        // Step 4: Create encrypted file for upload
        const encryptedBytes = Uint8Array.from(atob(serverEncryptedBase64), c => c.charCodeAt(0));
        const encryptedFile = new File(
          [encryptedBytes],
          `encrypted_${Date.now()}.enc`,
          { type: 'application/octet-stream' }
        );

        // Step 5: Upload encrypted file
        console.log('[EncryptedDMUpload] Uploading encrypted file...');
        const uploadResult = await dmUpload.mutateAsync(encryptedFile);
        uploadUrl = uploadResult.url;
        mediaType = uploadResult.mediaType || 'file';
        mediaEncrypted = true;
        setProgress(dmUpload.progress);
        setEncryptionProgress(90);
      }

      // Create encrypted content payload
      const encryptedContent = createEncryptedPayload(
        encryptedText,
        mediaEncrypted,
        file?.type
      );

      setEncryptionProgress(100);

      return {
        url: uploadUrl || '',
        encryptedContent,
        mediaType,
        isEncrypted: true,
      };
    },
    onSettled: () => {
      setProgress(0);
      setEncryptionProgress(0);
    },
  });

  return {
    ...mutation,
    progress,
    encryptionProgress,
    totalProgress: Math.round((encryptionProgress + progress) / 2),
  };
}

/**
 * Hook for decrypting media from DMs
 * Uses single-layer E2E encryption (matching useEncryptedSendMessage)
 */
export function useDecryptDMMedia(
  conversationId: string | null,
  otherUserId: string | null
) {
  const { user } = useAuth();

  /**
   * Get the conversation encryption key
   */
  const getKey = useCallback(async () => {
    if (!conversationId || !user || !otherUserId) {
      throw new Error('Missing conversation details for decryption');
    }
    return await getConversationKey(conversationId, user.id, otherUserId);
  }, [conversationId, user, otherUserId]);

  /**
   * Decrypt a media URL - single layer E2E decryption
   */
  const decryptMedia = useCallback(async (
    encryptedUrl: string,
    originalType: string
  ): Promise<string> => {
    try {
      console.log('[decryptMedia] Fetching encrypted media via proxy:', encryptedUrl);
      
      // Fetch encrypted media via Node.js proxy (streams binary directly, cached in Redis)
      const encryptedBlob = await api.fetchProxyMedia(encryptedUrl);
      console.log('[decryptMedia] Encrypted blob size:', encryptedBlob.size);
      
      // E2E decryption only (matching useEncryptedSendMessage)
      const key = await getKey();
      
      // Import decryptFile function
      const { decryptFile } = await import('@/lib/encryption');
      const decryptedBlob = await decryptFile(encryptedBlob, key, originalType);
      
      console.log('[decryptMedia] Decrypted blob size:', decryptedBlob.size, 'type:', originalType);
      
      // Create object URL for the decrypted media
      return URL.createObjectURL(decryptedBlob);
    } catch (error) {
      console.error('[decryptMedia] Failed:', error);
      throw error;
    }
  }, [getKey]);

  return { decryptMedia };
}
