/**
 * Dual-Layer Encryption Library for DM Messages
 * Layer 1: End-to-End Encryption (E2E) - Client-side AES-GCM with key exchange
 * Layer 2: Server-side encryption handled by edge function
 */

// Crypto constants
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM
const SALT_LENGTH = 16;

/**
 * Generate a random encryption key for a conversation
 */
export async function generateConversationKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Export a CryptoKey to a base64 string for storage
 */
export async function exportKey(key: CryptoKey): Promise<string> {
  const rawKey = await crypto.subtle.exportKey('raw', key);
  return arrayBufferToBase64(rawKey);
}

/**
 * Import a base64 key string back to a CryptoKey
 */
export async function importKey(keyString: string): Promise<CryptoKey> {
  const rawKey = base64ToArrayBuffer(keyString);
  return await crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Derive a shared key from user passwords/secrets using PBKDF2
 * This is used for deriving conversation keys from a shared secret
 */
export async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(passwordBuffer.buffer),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive AES key
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.slice().buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt text content using AES-GCM
 * Returns base64-encoded ciphertext with IV prepended
 */
export async function encryptText(
  plaintext: string,
  key: CryptoKey
): Promise<string> {
  const encoder = new TextEncoder();
  const plaintextBuffer = encoder.encode(plaintext);
  
  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  
  // Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    plaintextBuffer
  );
  
  // Combine IV + ciphertext
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  
  return arrayBufferToBase64(combined.buffer);
}

/**
 * Decrypt text content using AES-GCM
 * Expects base64-encoded ciphertext with IV prepended
 */
export async function decryptText(
  encryptedData: string,
  key: CryptoKey
): Promise<string> {
  const combined = base64ToArrayBuffer(encryptedData);
  const combinedArray = new Uint8Array(combined);
  
  // Extract IV and ciphertext
  const iv = combinedArray.slice(0, IV_LENGTH);
  const ciphertext = combinedArray.slice(IV_LENGTH);
  
  // Decrypt
  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(plaintextBuffer);
}

/**
 * Encrypt a file/blob using AES-GCM
 * Returns encrypted blob with IV prepended
 */
export async function encryptFile(
  file: File | Blob,
  key: CryptoKey
): Promise<Blob> {
  const fileBuffer = await file.arrayBuffer();
  
  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  
  // Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    fileBuffer
  );
  
  // Combine IV + ciphertext
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  
  return new Blob([combined], { type: 'application/octet-stream' });
}

/**
 * Decrypt a file/blob using AES-GCM
 * Expects encrypted blob with IV prepended
 */
export async function decryptFile(
  encryptedBlob: Blob,
  key: CryptoKey,
  originalType: string
): Promise<Blob> {
  const combined = await encryptedBlob.arrayBuffer();
  const combinedArray = new Uint8Array(combined);
  
  // Extract IV and ciphertext
  const iv = combinedArray.slice(0, IV_LENGTH);
  const ciphertext = combinedArray.slice(IV_LENGTH);
  
  // Decrypt
  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  );
  
  return new Blob([plaintextBuffer], { type: originalType });
}

/**
 * Generate a conversation-specific encryption key based on conversation ID and user IDs
 * This creates a deterministic key that both participants can derive
 */
export async function getConversationKey(
  conversationId: string,
  userId1: string,
  userId2: string
): Promise<CryptoKey> {
  // Sort user IDs to ensure consistent key regardless of order
  const sortedUserIds = [userId1, userId2].sort().join(':');
  const keyMaterial = `${conversationId}:${sortedUserIds}`;
  
  // Create a salt from the conversation ID
  const encoder = new TextEncoder();
  const saltSource = encoder.encode(conversationId);
  const salt = new Uint8Array(SALT_LENGTH);
  for (let i = 0; i < SALT_LENGTH; i++) {
    salt[i] = saltSource[i % saltSource.length];
  }
  
  return await deriveKey(keyMaterial, salt);
}

/**
 * Create an encrypted message payload
 */
export interface EncryptedPayload {
  encrypted: true;
  version: 1;
  ciphertext: string;
  mediaEncrypted?: boolean;
  originalMediaType?: string;
}

/**
 * Check if a message content is encrypted
 */
export function isEncryptedMessage(content: string): boolean {
  try {
    const parsed = JSON.parse(content);
    return parsed.encrypted === true && parsed.version === 1;
  } catch {
    return false;
  }
}

/**
 * Parse an encrypted message payload
 */
export function parseEncryptedPayload(content: string): EncryptedPayload | null {
  try {
    const parsed = JSON.parse(content);
    if (parsed.encrypted === true && parsed.version === 1) {
      return parsed as EncryptedPayload;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Create an encrypted message content string
 */
export function createEncryptedPayload(
  ciphertext: string,
  mediaEncrypted?: boolean,
  originalMediaType?: string
): string {
  const payload: EncryptedPayload = {
    encrypted: true,
    version: 1,
    ciphertext,
    mediaEncrypted,
    originalMediaType,
  };
  return JSON.stringify(payload);
}

// Utility functions
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Convert a File to base64 string
 */
export async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert base64 string back to Blob
 */
export function base64ToBlob(base64: string, type: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type });
}

/**
 * Encrypt media file and return base64 encrypted data
 */
export async function encryptMediaToBase64(
  file: File | Blob,
  key: CryptoKey
): Promise<string> {
  const encryptedBlob = await encryptFile(file, key);
  return await fileToBase64(encryptedBlob);
}

/**
 * Decrypt base64 encrypted media data
 */
export async function decryptMediaFromBase64(
  encryptedBase64: string,
  key: CryptoKey,
  originalType: string
): Promise<Blob> {
  const encryptedBlob = base64ToBlob(encryptedBase64, 'application/octet-stream');
  return await decryptFile(encryptedBlob, key, originalType);
}
