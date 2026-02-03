import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

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

export interface SmtpSettings {
  id: string;
  host: string;
  port: number;
  username: string;
  password: string;
  from_email: string;
  from_name: string;
  use_tls: boolean;
  is_active: boolean;
}

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

/**
 * Fetch active SMTP settings from DigitalOcean PostgreSQL
 */
export async function getSmtpSettingsFromDO(): Promise<SmtpSettings | null> {
  const doUrl = Deno.env.get("DO_POSTGRES_URL");
  
  if (!doUrl) {
    console.error("DO_POSTGRES_URL not configured");
    return null;
  }

  const connectionConfig = parseConnectionString(doUrl);
  const client = new Client(connectionConfig);
  
  try {
    await client.connect();
    
    const result = await client.queryObject<SmtpSettings>(
      `SELECT id, host, port, username, password, from_email, from_name, use_tls, is_active 
       FROM smtp_settings 
       WHERE is_active = true 
       LIMIT 1`
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error fetching SMTP settings from DO:", error);
    return null;
  } finally {
    await client.end();
  }
}

/**
 * Fetch email template from DigitalOcean PostgreSQL
 */
export async function getEmailTemplateFromDO(templateName: string): Promise<{
  subject: string;
  subject_ar: string | null;
  body_html: string;
  body_html_ar: string | null;
  is_active: boolean;
} | null> {
  const doUrl = Deno.env.get("DO_POSTGRES_URL");
  
  if (!doUrl) {
    console.error("DO_POSTGRES_URL not configured");
    return null;
  }

  const connectionConfig = parseConnectionString(doUrl);
  const client = new Client(connectionConfig);
  
  try {
    await client.connect();
    
    const result = await client.queryObject<{
      subject: string;
      subject_ar: string | null;
      body_html: string;
      body_html_ar: string | null;
      is_active: boolean;
    }>(
      `SELECT subject, subject_ar, body_html, body_html_ar, is_active 
       FROM email_templates 
       WHERE name = $1 AND is_active = true 
       LIMIT 1`,
      [templateName]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error fetching email template from DO:", error);
    return null;
  } finally {
    await client.end();
  }
}
