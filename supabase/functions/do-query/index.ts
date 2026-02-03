import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

// Tables that exist on DigitalOcean
const DO_TABLES = [
  'banners', 'categories', 'posts', 'post_media', 'post_polls', 'poll_options', 
  'poll_votes', 'post_views', 'comments', 'likes', 'bookmarks', 'follows',
  'rooms', 'room_members', 'room_invites', 'room_activity_log', 'messages', 
  'message_reactions', 'message_reads', 'conversations', 'conversation_participants', 
  'direct_messages', 'dm_reactions', 'dm_hidden_messages', 'reports', 'notifications',
  'smtp_settings', 'email_templates', 'profiles', 'user_settings', 'user_roles',
  'stories', 'story_views', 'story_reactions', 'story_replies', 
  'story_highlights', 'story_highlight_items',
  'do_users' // User auth backup table
];

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    // Allow anonymous access for public data, but track user if authenticated
    const userId = claimsData?.claims?.sub || null;

    const { action, table, query, data, filters, options } = await req.json();

    // Validate table name
    if (table && !DO_TABLES.includes(table)) {
      return new Response(JSON.stringify({ error: `Table ${table} not available on DigitalOcean` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const doUrl = Deno.env.get("DO_POSTGRES_URL");
    if (!doUrl) {
      return new Response(JSON.stringify({ error: "DigitalOcean PostgreSQL not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const connectionConfig = parseConnectionString(doUrl);
    const client = new Client(connectionConfig);
    await client.connect();

    let result;

    try {
      switch (action) {
        case "select": {
          const columns = options?.columns || "*";
          let sql = `SELECT ${columns} FROM ${table}`;
          const params: any[] = [];
          let paramIndex = 1;

          // Build WHERE clause from filters
          if (filters && Object.keys(filters).length > 0) {
            const whereClauses: string[] = [];
            for (const [key, value] of Object.entries(filters)) {
              // Support Supabase-style OR filter strings.
              // Example: "username.ilike.%foo%,display_name.ilike.%foo%"
              if (key === "_or" && typeof value === "string" && value.trim().length > 0) {
                const orParts = value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);

                const orClauses: string[] = [];
                for (const part of orParts) {
                  // Split only on the first 2 dots: col.op.value (value may include dots)
                  const firstDot = part.indexOf(".");
                  const secondDot = firstDot >= 0 ? part.indexOf(".", firstDot + 1) : -1;
                  if (firstDot < 0 || secondDot < 0) continue;

                  const col = part.slice(0, firstDot);
                  const op = part.slice(firstDot + 1, secondDot);
                  const rawVal = part.slice(secondDot + 1);

                  // Map operators
                  const opMap: Record<string, string> = {
                    eq: "=",
                    neq: "!=",
                    gt: ">",
                    gte: ">=",
                    lt: "<",
                    lte: "<=",
                    like: "LIKE",
                    ilike: "ILIKE",
                  };

                  const sqlOp = opMap[op];
                  if (!sqlOp) continue;

                  // Note: we parameterize values; rawVal can include % wildcards
                  orClauses.push(`${col} ${sqlOp} $${paramIndex++}`);
                  params.push(rawVal);
                }

                if (orClauses.length > 0) {
                  whereClauses.push(`(${orClauses.join(" OR ")})`);
                }
                continue;
              }

              if (value === null) {
                whereClauses.push(`${key} IS NULL`);
              } else if (typeof value === "object" && value !== null) {
                const filterObj = value as any;
                if (filterObj.eq !== undefined) {
                  whereClauses.push(`${key} = $${paramIndex++}`);
                  params.push(filterObj.eq);
                } else if (filterObj.neq !== undefined) {
                  whereClauses.push(`${key} != $${paramIndex++}`);
                  params.push(filterObj.neq);
                } else if (filterObj.gt !== undefined) {
                  whereClauses.push(`${key} > $${paramIndex++}`);
                  params.push(filterObj.gt);
                } else if (filterObj.gte !== undefined) {
                  whereClauses.push(`${key} >= $${paramIndex++}`);
                  params.push(filterObj.gte);
                } else if (filterObj.lt !== undefined) {
                  whereClauses.push(`${key} < $${paramIndex++}`);
                  params.push(filterObj.lt);
                } else if (filterObj.lte !== undefined) {
                  whereClauses.push(`${key} <= $${paramIndex++}`);
                  params.push(filterObj.lte);
                } else if (filterObj.like !== undefined) {
                  whereClauses.push(`${key} LIKE $${paramIndex++}`);
                  params.push(filterObj.like);
                } else if (filterObj.ilike !== undefined) {
                  whereClauses.push(`${key} ILIKE $${paramIndex++}`);
                  params.push(filterObj.ilike);
                } else if (filterObj.in !== undefined) {
                  const placeholders = filterObj.in.map(() => `$${paramIndex++}`).join(", ");
                  whereClauses.push(`${key} IN (${placeholders})`);
                  params.push(...filterObj.in);
                } else if (filterObj.is !== undefined) {
                  if (filterObj.is === null) {
                    whereClauses.push(`${key} IS NULL`);
                  } else if (filterObj.is === true) {
                    whereClauses.push(`${key} IS TRUE`);
                  } else if (filterObj.is === false) {
                    whereClauses.push(`${key} IS FALSE`);
                  }
                } else if (filterObj.not !== undefined) {
                  if (filterObj.not === null) {
                    whereClauses.push(`${key} IS NOT NULL`);
                  }
                }
              } else {
                whereClauses.push(`${key} = $${paramIndex++}`);
                params.push(value);
              }
            }
            if (whereClauses.length > 0) {
              sql += ` WHERE ${whereClauses.join(" AND ")}`;
            }
          }

          // Add ORDER BY
          if (options?.order) {
            const orderClauses = options.order.map((o: any) => 
              `${o.column} ${o.ascending === false ? 'DESC' : 'ASC'}`
            );
            sql += ` ORDER BY ${orderClauses.join(", ")}`;
          }

          // Add LIMIT
          if (options?.limit) {
            sql += ` LIMIT ${options.limit}`;
          }

          // Add OFFSET
          if (options?.offset) {
            sql += ` OFFSET ${options.offset}`;
          }

          console.log("Executing SELECT:", sql, params);
          const queryResult = await client.queryObject(sql, params);
          result = { data: queryResult.rows, error: null };
          break;
        }

        case "insert": {
          if (!data) {
            throw new Error("No data provided for insert");
          }
          const rows = Array.isArray(data) ? data : [data];
          const insertedRows = [];

          for (const row of rows) {
            const columns = Object.keys(row);
            const values = Object.values(row);
            const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
            
            const sql = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders}) RETURNING *`;
            console.log("Executing INSERT:", sql, values);
            const queryResult = await client.queryObject(sql, values);
            insertedRows.push(...queryResult.rows);
          }

          result = { data: insertedRows, error: null };
          break;
        }

        case "update": {
          if (!data || !filters) {
            throw new Error("No data or filters provided for update");
          }

          const setClauses: string[] = [];
          const params: any[] = [];
          let paramIndex = 1;

          for (const [key, value] of Object.entries(data)) {
            setClauses.push(`${key} = $${paramIndex++}`);
            params.push(value);
          }

          let sql = `UPDATE ${table} SET ${setClauses.join(", ")}`;

          // Build WHERE clause
          const whereClauses: string[] = [];
          for (const [key, value] of Object.entries(filters)) {
            if (typeof value === "object" && value !== null) {
              const filterObj = value as any;
              if (filterObj.eq !== undefined) {
                whereClauses.push(`${key} = $${paramIndex++}`);
                params.push(filterObj.eq);
              }
            } else {
              whereClauses.push(`${key} = $${paramIndex++}`);
              params.push(value);
            }
          }

          if (whereClauses.length > 0) {
            sql += ` WHERE ${whereClauses.join(" AND ")}`;
          }

          sql += " RETURNING *";
          console.log("Executing UPDATE:", sql, params);
          const queryResult = await client.queryObject(sql, params);
          result = { data: queryResult.rows, error: null };
          break;
        }

        case "delete": {
          if (!filters) {
            throw new Error("No filters provided for delete");
          }

          let sql = `DELETE FROM ${table}`;
          const params: any[] = [];
          let paramIndex = 1;

          const whereClauses: string[] = [];
          for (const [key, value] of Object.entries(filters)) {
            if (typeof value === "object" && value !== null) {
              const filterObj = value as any;
              if (filterObj.eq !== undefined) {
                whereClauses.push(`${key} = $${paramIndex++}`);
                params.push(filterObj.eq);
              }
            } else {
              whereClauses.push(`${key} = $${paramIndex++}`);
              params.push(value);
            }
          }

          if (whereClauses.length > 0) {
            sql += ` WHERE ${whereClauses.join(" AND ")}`;
          }

          sql += " RETURNING *";
          console.log("Executing DELETE:", sql, params);
          const queryResult = await client.queryObject(sql, params);
          result = { data: queryResult.rows, error: null };
          break;
        }

        case "raw": {
          if (!query) {
            throw new Error("No query provided for raw execution");
          }
          console.log("Executing RAW:", query);
          const queryResult = await client.queryObject(query);
          result = { data: queryResult.rows, error: null };
          break;
        }

        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } finally {
      await client.end();
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("DO Query error:", errorMessage);
    return new Response(
      JSON.stringify({ data: null, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
