import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Server-side encryption layer for DM media files
 * This adds an additional encryption layer on top of E2E encryption
 */

// Encryption configuration
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;

// Server-side encryption key (derived from secret)
async function getServerKey(): Promise<CryptoKey> {
  const secret = Deno.env.get('DM_ENCRYPTION_SECRET') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!secret) {
    throw new Error('Encryption secret not configured');
  }

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret.slice(0, 32)), // Use first 32 chars as key material
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  const salt = encoder.encode('dm-media-encryption-salt');
  
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt data with server key
async function serverEncrypt(data: ArrayBuffer): Promise<ArrayBuffer> {
  const key = await getServerKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    data
  );

  // Combine IV + ciphertext
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  
  return combined.buffer;
}

// Decrypt data with server key
async function serverDecrypt(data: ArrayBuffer): Promise<ArrayBuffer> {
  const key = await getServerKey();
  const combined = new Uint8Array(data);
  
  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);
  
  return await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  );
}

// Convert base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data, conversationId, messageId } = await req.json();

    // Validate auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claims.claims.sub;
    console.log(`[encrypt-media] User ${userId} requested ${action}`);

    // Verify user is participant in conversation if provided
    if (conversationId) {
      const { data: participant, error: participantError } = await supabase
        .from('conversation_participants')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .single();

      if (participantError || !participant) {
        return new Response(
          JSON.stringify({ error: 'Not a participant in this conversation' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (action === 'encrypt') {
      // Encrypt the data with server-side key
      const inputBuffer = base64ToArrayBuffer(data);
      const encryptedBuffer = await serverEncrypt(inputBuffer);
      const encryptedBase64 = arrayBufferToBase64(encryptedBuffer);

      console.log(`[encrypt-media] Encrypted ${inputBuffer.byteLength} bytes -> ${encryptedBuffer.byteLength} bytes`);

      return new Response(
        JSON.stringify({
          success: true,
          encryptedData: encryptedBase64,
          originalSize: inputBuffer.byteLength,
          encryptedSize: encryptedBuffer.byteLength,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } 
    
    if (action === 'decrypt') {
      // Decrypt the data with server-side key
      const inputBuffer = base64ToArrayBuffer(data);
      const decryptedBuffer = await serverDecrypt(inputBuffer);
      const decryptedBase64 = arrayBufferToBase64(decryptedBuffer);

      console.log(`[encrypt-media] Decrypted ${inputBuffer.byteLength} bytes -> ${decryptedBuffer.byteLength} bytes`);

      return new Response(
        JSON.stringify({
          success: true,
          decryptedData: decryptedBase64,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[encrypt-media] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
