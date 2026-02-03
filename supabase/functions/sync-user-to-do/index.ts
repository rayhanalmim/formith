import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// DigitalOcean CA Certificate for managed PostgreSQL
const DO_CA_CERT = `-----BEGIN CERTIFICATE-----
MIIEUDCCArigAwIBAgIUcZINzAIethnpmS7F9yRibJL7qnwwDQYJKoZIhvcNAQEM
BQAwQDE+MDwGA1UEAww1YWViZWU3YzktMmY0Zi00M2M5LWE1ODQtZWQxMWUwYzBk
MGNkIEdFTiAxIFByb2plY3QgQ0EwHhcNMjYwMTI3MTUyNzI2WhcNMzYwMTI1MTUy
NzI2WjBAMT4wPAYDVQQDDDVhZWJlZTdjOS0yZjRmLTQzYzktYTU4NC1lZDExZTBj
MGQwY2QgR0VOIDEgUHJvamVjdCBDQTCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCC
AYoCggGBALaQyo7GZ1MkBSUSHjyBpLlJymSYhsRGNE7UOap36klTqMK3UzfFGiwC
BJViNPlXXqiHNO7Obcq5doyOPu733bzEl7DZR/hkNzPe6bQKGdlevL8PbsO1VMv7
RCSM0KadYvSnmoScQWW5GoNyi0BYUUbumb9QGOpsa3+c60FKOLqYjx5zTqiRKpMA
9nkcbwLuPOKptmakZSz7iUF4aENJGU0RX//DX41i1HjtTJgJadPG4rLVLl1OJM7h
Sgo17FrY+KaGH/ylqFoNZJWnRvoymBCHjdLFAknQOdnrO3ATNkjsIm9nurpk6JVn
NoIODPeK7XOZCMk9XfcULYPaCJmcbHOmYPSVjA3avQd91I7Wjjc16mpRWfX93/GS
ZmzpQCA8pOjaPzx0TGL6hUme6cHi+Um5OOres307pq89gnI89Sv6XYZhn4JY0yId
gHng+9VyuE0U7v4SupiH4yiKBCw2dUXBO7Jfr/vlbiQnwGpuSmEAttxtgIjSamV3
nYDNmAcxRQIDAQABo0IwQDAdBgNVHQ4EFgQUeGmfsV9f2PUIjRn7cTrz6vFdHOEw
EgYDVR0TAQH/BAgwBgEB/wIBADALBgNVHQ8EBAMCAQYwDQYJKoZIhvcNAQEMBQAD
ggGBAIVGJ/iEQHmitAJ8eVtFcHiaEaeJSqqkwYiORFR8nxU09oklh9vvG1i8NLga
O7eJcDBQvIAgQkCOqr2F98AvnVW0F4BnBVKTg3vcTKuPiyHRu0iiEpzBlpTWIdHS
eYDw8gHQoTZB5FhnYXJSeBjg4BDfOjxmFDw2dcS7fby0Wbh75xBbo8+t4CSyQSqN
MbKhSWDpp/TIfvi8CvQNsK3xeldjaXbyPkVKZ7MWCX0DY6sA2x194RdTI44+NzB5
mCgUMtMAuem2FoPKOJIsez1VTVpNwAK7OLpPF/k6Un57a/5AYyLDKeLaG9SMusW3
KQ3UQbOKEjQ+wKl9i8RKi1u8b9axaJaRVakx2MBLyII0n0qWKyHs4z0PT599nCYx
XXYXZDeL8s1HGWNOknvckvezD4yPllnrzerQGGuUawaPzKBWXQpPlC/AA4g/foAv
7r2/V4Lt/ims2AP/Kp1L8sBV3exosWOg53VIR0ZigE2ujiqa6wOS0jjL6hYQOrOK
mibBTQ==
-----END CERTIFICATE-----`;

function parseConnectionString(connectionString: string) {
  const url = new URL(connectionString.replace(/^postgres:/, 'postgresql:'));
  
  const sslmode = url.searchParams.get('sslmode');
  const requireSSL = sslmode === 'require' || sslmode === 'verify-ca' || sslmode === 'verify-full';
  
  const config: Record<string, unknown> = {
    hostname: url.hostname,
    port: parseInt(url.port) || 5432,
    user: url.username,
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
  };

  if (requireSSL) {
    config.tls = {
      enabled: true,
      enforce: true,
      caCertificates: [DO_CA_CERT],
    };
    config.connection = {
      attempts: 3,
    };
  }
  
  return config;
}

// Hash password using SHA-256 with salt (for DO backup)
async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = crypto.randomUUID();
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return { hash, salt };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, email, password, display_name } = await req.json();

    if (!user_id || !email) {
      return new Response(
        JSON.stringify({ error: 'user_id and email are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Connect to DigitalOcean PostgreSQL
    const doPostgresUrl = Deno.env.get('DO_POSTGRES_URL');
    if (!doPostgresUrl) {
      throw new Error('DO_POSTGRES_URL not configured');
    }

    const connectionConfig = parseConnectionString(doPostgresUrl);
    const client = new Client(connectionConfig);
    await client.connect();

    try {
      // Ensure do_users table exists
      await client.queryObject(`
        CREATE TABLE IF NOT EXISTS do_users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID UNIQUE NOT NULL,
          email TEXT NOT NULL,
          password_hash TEXT,
          password_salt TEXT,
          display_name TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_do_users_user_id ON do_users(user_id);
        CREATE INDEX IF NOT EXISTS idx_do_users_email ON do_users(email);
      `);

      // Hash the password for storage
      let passwordHash = null;
      let passwordSalt = null;
      
      if (password) {
        const { hash, salt } = await hashPassword(password);
        passwordHash = hash;
        passwordSalt = salt;
      }

      // Insert or update user in do_users table
      const result = await client.queryObject`
        INSERT INTO do_users (user_id, email, password_hash, password_salt, display_name, created_at, updated_at)
        VALUES (${user_id}, ${email}, ${passwordHash}, ${passwordSalt}, ${display_name || null}, NOW(), NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          email = EXCLUDED.email,
          password_hash = COALESCE(EXCLUDED.password_hash, do_users.password_hash),
          password_salt = COALESCE(EXCLUDED.password_salt, do_users.password_salt),
          display_name = COALESCE(EXCLUDED.display_name, do_users.display_name),
          updated_at = NOW()
        RETURNING id, user_id, email, created_at
      `;

      console.log('User synced to DO:', result.rows[0]);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'User synced to DigitalOcean',
          user: result.rows[0]
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } finally {
      await client.end();
    }
  } catch (error: unknown) {
    console.error('Error syncing user to DO:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to sync user';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
