/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSendMessage, Conversation } from '@/hooks/useMessages';
import type { DirectMessage } from '@/hooks/useMessages';
import { useDMMediaUpload } from '@/hooks/useFileUpload';
import {
  getConversationKey,
  encryptText,
  encryptFile,
  createEncryptedPayload,
} from '@/lib/encryption';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface UseEncryptedSendMessageOptions {
  conversation: Conversation | null;
  onSuccess?: () => void;
}

// Simple cache for conversation keys to avoid repeated derivation
const keyCache = new Map<string, CryptoKey>();

/**
 * Hook for sending encrypted messages with optional media
 * Uses client-side E2E encryption for both text and media
 */
export function useEncryptedSendMessage({ conversation, onSuccess }: UseEncryptedSendMessageOptions) {
  const { user } = useAuth();
  const sendMessage = useSendMessage();
  const dmUpload = useDMMediaUpload();
  const queryClient = useQueryClient();
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [encryptionProgress, setEncryptionProgress] = useState(0);

  /**
   * Send an encrypted message with optional encrypted media
   */
  const sendEncrypted = useCallback(async ({
    content,
    mediaFile,
    mediaType,
    replyToId,
    replyContent,
    replySenderId,
    replySenderUsername,
    replySenderDisplayName,
  }: {
    content: string;
    mediaFile?: File | null;
    mediaType?: 'image' | 'file' | 'video' | null;
    replyToId?: string;
    replyContent?: string;
    replySenderId?: string;
    replySenderUsername?: string;
    replySenderDisplayName?: string;
  }) => {
    if (!conversation || !user) {
      throw new Error('Must be in a conversation to send messages');
    }

    setIsEncrypting(true);
    setEncryptionProgress(0);

    try {
      // Fetch link previews BEFORE encryption (so server can extract URLs from plain text)
      let linkPreviews: any[] = [];
      try {
        const previewsResponse = await api.fetchLinkPreviews(content);
        if (previewsResponse.success && previewsResponse.data) {
          linkPreviews = previewsResponse.data;
        }
      } catch (err) {
        console.log('[useEncryptedSendMessage] Failed to fetch link previews:', err);
      }
      setEncryptionProgress(5);

      // Get or derive the conversation key
      let key = keyCache.get(conversation.id);
      if (!key) {
        key = await getConversationKey(
          conversation.id,
          user.id,
          conversation.other_user.user_id
        );
        keyCache.set(conversation.id, key);
      }
      setEncryptionProgress(10);

      // Encrypt the text content (E2E layer)
      const encryptedText = await encryptText(content, key);
      setEncryptionProgress(20);

      // Insert an optimistic message immediately (before media encryption/upload)
      const optimisticId = `temp-${Date.now()}`;
      // For instant UX, use plaintext in the optimistic message so it renders immediately
      const optimisticPlainContent = content;
      const nowIso = new Date().toISOString();
      queryClient.setQueryData<DirectMessage[]>(
        ['messages', conversation.id],
        (old) => {
          const list = old || [];
          if (list.some(m => m.id === optimisticId)) return list;
          const optimistic: DirectMessage = {
            id: optimisticId,
            conversation_id: conversation.id,
            sender_id: user.id,
            content: optimisticPlainContent,
            is_read: false,
            read_at: null,
            created_at: nowIso,
            media_url: null,
            media_type: null,
            is_deleted: false,
            edited_at: null,
            reply_to_id: replyToId || null,
            reply_content: replyContent || null,
            reply_sender_id: replySenderId || null,
            reply_sender_username: replySenderUsername || null,
            reply_sender_display_name: replySenderDisplayName || null,
            sender_username: null,
            sender_display_name: null,
            sender_avatar_url: null,
          };
          return [...list, optimistic];
        }
      );

      let uploadedMediaUrl: string | undefined;
      let mediaEncrypted = false;
      let originalMediaType: string | undefined;

      // Encrypt and upload media if provided
      if (mediaFile && mediaType) {
        console.log('[useEncryptedSendMessage] Encrypting media file...');
        originalMediaType = mediaFile.type;
        
        // Encrypt the file with E2E key
        setEncryptionProgress(30);
        const encryptedBlob = await encryptFile(mediaFile, key);
        setEncryptionProgress(50);

        // Create encrypted file for upload
        const encryptedFile = new File(
          [encryptedBlob],
          `encrypted_${Date.now()}.enc`,
          { type: 'application/octet-stream' }
        );

        // Upload encrypted file
        console.log('[useEncryptedSendMessage] Uploading encrypted file...');
        setEncryptionProgress(60);
        const uploadResult = await dmUpload.mutateAsync(encryptedFile);
        uploadedMediaUrl = uploadResult.url;
        mediaEncrypted = true;
        setEncryptionProgress(80);
        console.log('[useEncryptedSendMessage] Encrypted media uploaded:', uploadedMediaUrl);
      }

      // Create encrypted content payload with media info
      const encryptedContent = createEncryptedPayload(
        encryptedText,
        mediaEncrypted,
        originalMediaType
      );
      setEncryptionProgress(90);

      // Encrypt reply content if present
      let encryptedReplyContent = replyContent;
      if (replyContent) {
        const encryptedReply = await encryptText(replyContent, key);
        encryptedReplyContent = createEncryptedPayload(encryptedReply, false);
      }

      // Send the encrypted message with media URL and link previews
      await sendMessage.mutateAsync({
        conversationId: conversation.id,
        content: encryptedContent,
        mediaUrl: uploadedMediaUrl,
        mediaType: mediaEncrypted ? mediaType : undefined,
        replyToId,
        replyContent: encryptedReplyContent,
        replySenderId,
        replySenderUsername,
        replySenderDisplayName,
        isEncrypted: true,
        optimisticId,
        linkPreviews,
      });

      setEncryptionProgress(100);
      onSuccess?.();
    } catch (error) {
      console.error('[useEncryptedSendMessage] Failed:', error);
      toast.error('Failed to send encrypted message');
      throw error;
    } finally {
      setIsEncrypting(false);
      setEncryptionProgress(0);
    }
  }, [conversation, user, sendMessage, dmUpload, onSuccess, queryClient]);

  return {
    sendEncrypted,
    isEncrypting,
    encryptionProgress,
    isPending: sendMessage.isPending || isEncrypting || dmUpload.isPending,
  };
}
