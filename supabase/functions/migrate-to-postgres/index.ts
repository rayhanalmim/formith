import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

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
  // Handle postgresql:// or postgres:// URLs
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

  // For DigitalOcean managed databases with sslmode=require
  // Use the CA certificate for proper TLS verification
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

interface ConnectionConfig {
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  sslmode: string;
}

function buildConnectionUrl(config: ConnectionConfig): string {
  const password = encodeURIComponent(config.password);
  return `postgresql://${config.username}:${password}@${config.host}:${config.port}/${config.database}?sslmode=${config.sslmode}`;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tables to migrate to DigitalOcean - CONTENT ONLY
// CRITICAL: profiles and user_settings MUST stay on Supabase for auth triggers
const TABLES_TO_MIGRATE = [
  'categories',
  'posts',
  'post_media',
  'post_polls',
  'poll_options',
  'poll_votes',
  'comments',
  'likes',
  'bookmarks',
  'follows',
  'notifications',
  'rooms',
  'room_members',
  'room_invites',
  'room_activity_log',
  'messages',
  'message_reactions',
  'message_reads',
  'conversations',
  'conversation_participants',
  'direct_messages',
  'dm_reactions',
  'dm_hidden_messages',
  'reports',
  'banners',
  'email_templates',
  'smtp_settings',
  'post_views',
  'profiles',
  'user_settings',
  'stories',
  'story_views',
  'story_reactions',
  'story_replies',
  'story_highlights',
  'story_highlight_items',
];

// Tables that MUST stay on Supabase (auth + user identity)
// These are managed by Supabase triggers and auth system
const AUTH_TABLES = [
  'user_roles',           // Role-based access control
  'push_subscriptions',   // Push notification tokens
  'password_reset_tokens',
  'email_verification_tokens'
];

interface MigrationResult {
  table: string;
  success: boolean;
  rowsMigrated: number;
  error?: string;
}

// Table schemas for creating empty tables in DigitalOcean
const TABLE_SCHEMAS: Record<string, string> = {
  categories: `
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    slug TEXT NOT NULL UNIQUE,
    icon_url TEXT,
    cover_url TEXT,
    is_active BOOLEAN DEFAULT true,
    allow_posting BOOLEAN DEFAULT true,
    allow_comments BOOLEAN DEFAULT true,
    require_approval BOOLEAN DEFAULT false,
    posts_count INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  `,
  posts: `
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    slug TEXT,
    category_id UUID,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    is_approved BOOLEAN DEFAULT true,
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    is_hidden BOOLEAN DEFAULT false,
    repost_of_id UUID,
    quote_content TEXT,
    location TEXT,
    feeling TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  `,
  post_media: `
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL,
    media_url TEXT NOT NULL,
    media_type TEXT DEFAULT 'image',
    thumbnail_url TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
  `,
  post_polls: `
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL,
    question TEXT NOT NULL,
    poll_type TEXT DEFAULT 'single',
    ends_at TIMESTAMPTZ,
    allow_add_options BOOLEAN DEFAULT false,
    goal TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
  `,
  poll_options: `
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL,
    text TEXT NOT NULL,
    emoji TEXT,
    votes_count INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
  `,
  poll_votes: `
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL,
    option_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
  `,
  comments: `
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL,
    user_id UUID NOT NULL,
    parent_id UUID,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    is_hidden BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  `,
  likes: `
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    post_id UUID,
    comment_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
  `,
  bookmarks: `
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    post_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
  `,
  follows: `
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL,
    following_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
  `,
  notifications: `
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    title_ar TEXT,
    message TEXT,
    message_ar TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
  `,
  rooms: `
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_ar TEXT,
    description TEXT,
    description_ar TEXT,
    slug TEXT,
    is_public BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    members_count INTEGER DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  `,
  room_members: `
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role TEXT DEFAULT 'member',
    is_muted BOOLEAN DEFAULT false,
    muted_until TIMESTAMPTZ,
    muted_by UUID,
    joined_at TIMESTAMPTZ DEFAULT now()
  `,
  room_invites: `
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL,
    invited_user_id UUID NOT NULL,
    invited_by UUID NOT NULL,
    status TEXT DEFAULT 'pending',
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
  `,
  room_activity_log: `
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL,
    user_id UUID NOT NULL,
    target_user_id UUID,
    action_type TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
  `,
  messages: `
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    media_url TEXT,
    media_type TEXT,
    is_deleted BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    pinned_at TIMESTAMPTZ,
    pinned_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
  `,
  message_reactions: `
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL,
    user_id UUID NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
  `,
  message_reads: `
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL,
    user_id UUID NOT NULL,
    read_at TIMESTAMPTZ DEFAULT now()
  `,
  conversations: `
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    last_message_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  `,
  conversation_participants: `
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    user_id UUID NOT NULL,
    last_read_at TIMESTAMPTZ DEFAULT now(),
    is_pinned BOOLEAN DEFAULT false,
    pinned_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ DEFAULT now()
  `,
  direct_messages: `
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    content TEXT NOT NULL,
    media_url TEXT,
    media_type TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT false,
    edited_at TIMESTAMPTZ,
    reply_to_id UUID,
    reply_content TEXT,
    reply_sender_id UUID,
    reply_sender_username TEXT,
    reply_sender_display_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
  `,
  dm_reactions: `
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL,
    user_id UUID NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
  `,
  dm_hidden_messages: `
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL,
    user_id UUID NOT NULL,
    hidden_at TIMESTAMPTZ DEFAULT now()
  `,
  reports: `
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL,
    post_id UUID,
    comment_id UUID,
    user_id UUID,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
  `,
  banners: `
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    title_ar TEXT,
    image_url TEXT NOT NULL,
    link_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  `,
  email_templates: `
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    subject_ar TEXT,
    body_html TEXT NOT NULL,
    body_html_ar TEXT,
    variables TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  `,
  smtp_settings: `
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host TEXT NOT NULL,
    port INTEGER DEFAULT 587,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    from_email TEXT NOT NULL,
    from_name TEXT DEFAULT 'Tahweel',
    use_tls BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  `,
  post_views: `
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
  `,
  profiles: `
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    username TEXT UNIQUE,
    display_name TEXT,
    display_name_ar TEXT,
    bio TEXT,
    avatar_url TEXT,
    cover_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    is_banned BOOLEAN DEFAULT false,
    is_email_verified BOOLEAN DEFAULT false,
    ban_reason TEXT,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'online',
    last_seen_at TIMESTAMPTZ DEFAULT now(),
    birthday DATE,
    gender TEXT,
    birthplace TEXT,
    current_location TEXT,
    relationship_status TEXT,
    show_birthday BOOLEAN DEFAULT true,
    show_gender BOOLEAN DEFAULT true,
    show_birthplace BOOLEAN DEFAULT true,
    show_location BOOLEAN DEFAULT true,
    show_relationship BOOLEAN DEFAULT true,
    show_joined_date BOOLEAN DEFAULT true,
    show_followers_count BOOLEAN DEFAULT true,
    show_following_count BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  `,
  user_settings: `
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    notify_likes BOOLEAN DEFAULT true,
    notify_comments BOOLEAN DEFAULT true,
    notify_follows BOOLEAN DEFAULT true,
    notify_messages BOOLEAN DEFAULT true,
    show_online_status BOOLEAN DEFAULT true,
    allow_messages_from TEXT DEFAULT 'everyone',
    profile_visibility TEXT DEFAULT 'public',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  `,
  stories: `
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    media_url TEXT NOT NULL,
    media_type TEXT DEFAULT 'image',
    thumbnail_url TEXT,
    text_overlay JSONB,
    stickers JSONB DEFAULT '[]',
    filter TEXT,
    views_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours'),
    created_at TIMESTAMPTZ DEFAULT now()
  `,
  story_views: `
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL,
    viewer_id UUID NOT NULL,
    viewed_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(story_id, viewer_id)
  `,
  story_reactions: `
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL,
    user_id UUID NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(story_id, user_id)
  `,
  story_replies: `
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
  `,
  story_highlights: `
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    cover_url TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  `,
  story_highlight_items: `
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    highlight_id UUID NOT NULL,
    story_id UUID NOT NULL,
    sort_order INTEGER DEFAULT 0,
    added_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(highlight_id, story_id)
  `,
};

// Tables that need schema fix (drop and recreate)
const TABLES_NEEDING_SCHEMA_FIX = ['profiles', 'user_settings'];

// Helper function to create tables in DigitalOcean (drops first if schema fix needed)
async function createTableInDO(connection: any, tableName: string): Promise<void> {
  const schema = TABLE_SCHEMAS[tableName];
  if (schema) {
    // For tables with known schema issues, drop and recreate
    if (TABLES_NEEDING_SCHEMA_FIX.includes(tableName)) {
      console.log(`Dropping and recreating ${tableName} to fix schema...`);
      await connection.queryArray(`DROP TABLE IF EXISTS public.${tableName} CASCADE`);
    }
    
    console.log(`Creating table ${tableName} in DigitalOcean...`);
    await connection.queryArray(`CREATE TABLE IF NOT EXISTS public.${tableName} (${schema})`);
    console.log(`Created table ${tableName}`);
  } else {
    console.log(`No schema defined for ${tableName}, skipping...`);
  }
}

// Alias for backward compatibility
async function createEmptyTableInDO(connection: any, tableName: string): Promise<void> {
  return createTableInDO(connection, tableName);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    // Check if user is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "manager"])
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, connectionConfig } = await req.json();

    // Get DO PostgreSQL connection string - either from config or env
    let doPostgresUrl: string | undefined;
    
    if (connectionConfig && connectionConfig.host) {
      // Build URL from individual config fields
      doPostgresUrl = buildConnectionUrl(connectionConfig as ConnectionConfig);
      console.log("Using connection config from request");
    } else {
      // Fall back to environment variable
      doPostgresUrl = Deno.env.get("DO_POSTGRES_URL");
    }
    
    if (!doPostgresUrl) {
      return new Response(JSON.stringify({ error: "Connection not configured. Provide connection details or set DO_POSTGRES_URL" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service role client for reading all data
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (action === "get-status") {
      const tableStats: { table: string; rowCount: number; category: 'migrate' | 'auth' }[] = [];
      
      for (const tableName of TABLES_TO_MIGRATE) {
        const { count } = await serviceClient
          .from(tableName)
          .select("*", { count: "exact", head: true });
        tableStats.push({ table: tableName, rowCount: count || 0, category: 'migrate' });
      }

      for (const tableName of AUTH_TABLES) {
        const { count } = await serviceClient
          .from(tableName)
          .select("*", { count: "exact", head: true });
        tableStats.push({ table: tableName, rowCount: count || 0, category: 'auth' });
      }

      return new Response(JSON.stringify({
        tables: tableStats,
        totalMigrateTables: TABLES_TO_MIGRATE.length,
        totalAuthTables: AUTH_TABLES.length,
        targetDatabase: "DigitalOcean PostgreSQL 18",
        connectionConfigured: !!doPostgresUrl,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "test-connection") {
      try {
        const poolConfig = parseConnectionString(doPostgresUrl);
        const pool = new Pool(poolConfig, 1);
        const connection = await pool.connect();
        const result = await connection.queryObject`SELECT version()`;
        connection.release();
        await pool.end();
        
        return new Response(JSON.stringify({
          success: true,
          version: result.rows[0],
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Connection test error:", error);
        return new Response(JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Connection failed",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (action === "migrate") {
      const results: MigrationResult[] = [];
      let pool: Pool | null = null;

      try {
        // Connect to DigitalOcean PostgreSQL
        const poolConfig = parseConnectionString(doPostgresUrl);
        pool = new Pool(poolConfig, 3);
        console.log("Connected to DigitalOcean PostgreSQL");

        // Migrate each table
        for (const tableName of TABLES_TO_MIGRATE) {
          const connection = await pool.connect();
          try {
            console.log(`Migrating table: ${tableName}`);
            
            // Get all data from Supabase
            const { data, error } = await serviceClient
              .from(tableName)
              .select("*");

            if (error) {
              // Table might not exist in Supabase or other error
              // Still try to create the table in DO with basic schema
              console.log(`Error fetching ${tableName} from Supabase: ${error.message}`);
              results.push({ table: tableName, success: false, rowsMigrated: 0, error: error.message });
              connection.release();
              continue;
            }

            // For tables with defined schemas, always use our schema (fixes type mismatches)
            const hasDefinedSchema = !!TABLE_SCHEMAS[tableName];
            
            // Even if no data, create the table with schema from Supabase types
            if (!data || data.length === 0) {
              // Create empty table with known schema
              await createTableInDO(connection, tableName);
              results.push({ table: tableName, success: true, rowsMigrated: 0 });
              connection.release();
              continue;
            }

            // For tables with predefined schemas, use those (drops and recreates if needed)
            if (hasDefinedSchema) {
              await createTableInDO(connection, tableName);
            } else {
              // Create table by inferring schema from data
              const columns = Object.keys(data[0]);
              const columnDefs = columns.map(col => {
                const sampleValue = data[0][col];
                let type = "TEXT";
                if (col === "id") type = "UUID PRIMARY KEY";
                else if (col.endsWith("_id")) type = "UUID";
                else if (col.endsWith("_at") || col === "created_at" || col === "updated_at") type = "TIMESTAMPTZ";
                else if (col.endsWith("_count") || col === "sort_order" || col === "port") type = "INTEGER DEFAULT 0";
                else if (typeof sampleValue === "boolean" || col.startsWith("is_") || col.startsWith("allow_") || col.startsWith("show_") || col.startsWith("notify_") || col.startsWith("use_")) type = "BOOLEAN DEFAULT FALSE";
                else if (typeof sampleValue === "number") type = Number.isInteger(sampleValue) ? "INTEGER" : "DECIMAL";
                else if (typeof sampleValue === "object" && sampleValue !== null) type = "JSONB";
                return `${col} ${type}`;
              });

              await connection.queryArray(`CREATE TABLE IF NOT EXISTS public.${tableName} (${columnDefs.join(", ")})`);
            }

            // Clear existing data to avoid duplicates
            await connection.queryArray(`DELETE FROM public.${tableName}`);

            // Insert data in batches
            let migratedCount = 0;
            const batchSize = 100;
            const dataColumns = Object.keys(data[0]);
            
            for (let i = 0; i < data.length; i += batchSize) {
              const batch = data.slice(i, i + batchSize);
              
              for (const row of batch) {
                const values = dataColumns.map((col: string) => {
                  const val = row[col];
                  if (val === null || val === undefined) return null;
                  if (typeof val === "object") return JSON.stringify(val);
                  return val;
                });

                const placeholders = dataColumns.map((_: string, idx: number) => `$${idx + 1}`).join(", ");
                const insertQuery = `INSERT INTO public.${tableName} (${dataColumns.join(", ")}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
                
                await connection.queryArray(insertQuery, values);
                migratedCount++;
              }
            }

            connection.release();
            results.push({ table: tableName, success: true, rowsMigrated: migratedCount });
            console.log(`Migrated ${migratedCount} rows from ${tableName}`);
          } catch (tableError) {
            connection.release();
            console.error(`Error migrating ${tableName}:`, tableError);
            results.push({
              table: tableName,
              success: false,
              rowsMigrated: 0,
              error: tableError instanceof Error ? tableError.message : "Unknown error",
            });
          }
        }

        return new Response(JSON.stringify({
          success: true,
          results,
          totalMigrated: results.reduce((sum, r) => sum + r.rowsMigrated, 0),
          successCount: results.filter(r => r.success).length,
          failedCount: results.filter(r => !r.success).length,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Migration error:", error);
        return new Response(JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Migration failed",
          results,
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } finally {
        if (pool) {
          try {
            await pool.end();
          } catch (e) {
            console.error("Error closing pool:", e);
          }
        }
      }
    }

    // Cleanup action - remove migrated data from Supabase
    if (action === "cleanup-supabase") {
      const results: { table: string; success: boolean; rowsDeleted: number; error?: string }[] = [];

      try {
        console.log("Starting cleanup of migrated tables from Supabase...");

        // Delete data from migrated tables in reverse order (to handle foreign keys)
        const tablesToCleanup = [...TABLES_TO_MIGRATE].reverse();

        for (const tableName of tablesToCleanup) {
          try {
            console.log(`Cleaning up table: ${tableName}`);
            
            // Get count before delete
            const { count: beforeCount } = await serviceClient
              .from(tableName)
              .select("*", { count: "exact", head: true });

            // Delete all data from the table
            const { error } = await serviceClient
              .from(tableName)
              .delete()
              .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

            if (error) {
              console.error(`Error cleaning ${tableName}:`, error);
              results.push({ table: tableName, success: false, rowsDeleted: 0, error: error.message });
            } else {
              results.push({ table: tableName, success: true, rowsDeleted: beforeCount || 0 });
              console.log(`Cleaned ${beforeCount || 0} rows from ${tableName}`);
            }
          } catch (tableError) {
            console.error(`Error cleaning ${tableName}:`, tableError);
            results.push({
              table: tableName,
              success: false,
              rowsDeleted: 0,
              error: tableError instanceof Error ? tableError.message : "Unknown error",
            });
          }
        }

        return new Response(JSON.stringify({
          success: results.every(r => r.success),
          results,
          totalDeleted: results.reduce((sum, r) => sum + r.rowsDeleted, 0),
          successCount: results.filter(r => r.success).length,
          failedCount: results.filter(r => !r.success).length,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Cleanup error:", error);
        return new Response(JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Cleanup failed",
          results,
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Migration error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Migration failed" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
