import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StorageStats {
  folder: string;
  totalSize: number;
  fileCount: number;
  formattedSize: string;
}

interface StatsResponse {
  stats: StorageStats[];
  totalSize: number;
  formattedTotal: string;
  lastUpdated: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication - must be admin/manager
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify user is admin or manager
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin or manager
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleError || !roleData || !["admin", "manager"].includes(roleData.role)) {
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get DigitalOcean Spaces credentials
    const spacesKey = Deno.env.get("DO_SPACES_KEY");
    const spacesSecret = Deno.env.get("DO_SPACES_SECRET");
    const spacesBucket = Deno.env.get("DO_SPACES_BUCKET");
    const spacesRegion = Deno.env.get("DO_SPACES_REGION");
    const spacesEndpoint = Deno.env.get("DO_SPACES_ENDPOINT");

    if (!spacesKey || !spacesSecret || !spacesBucket || !spacesRegion || !spacesEndpoint) {
      console.error("[storage-stats] Missing DigitalOcean Spaces configuration");
      return new Response(
        JSON.stringify({ error: "Storage not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const folders = ["avatars", "covers", "posts", "rooms", "messages"];
    const statsPromises = folders.map(folder => listFolderStats(
      folder,
      spacesKey,
      spacesSecret,
      spacesBucket,
      spacesRegion,
      spacesEndpoint
    ));

    const folderStats = await Promise.all(statsPromises);
    const totalSize = folderStats.reduce((sum, stat) => sum + stat.totalSize, 0);

    const response: StatsResponse = {
      stats: folderStats,
      totalSize,
      formattedTotal: formatBytes(totalSize),
      lastUpdated: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[storage-stats] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function listFolderStats(
  folder: string,
  spacesKey: string,
  spacesSecret: string,
  spacesBucket: string,
  spacesRegion: string,
  spacesEndpoint: string
): Promise<StorageStats> {
  const encoder = new TextEncoder();
  const endpoint = spacesEndpoint.replace("https://", "").replace("http://", "");
  const host = `${spacesBucket}.${endpoint}`;
  
  let totalSize = 0;
  let fileCount = 0;
  let continuationToken: string | undefined;
  
  do {
    const date = new Date();
    const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const dateStamp = amzDate.substring(0, 8);
    
    // Build query string
    let queryParams = `list-type=2&prefix=${encodeURIComponent(folder + "/")}`;
    if (continuationToken) {
      queryParams += `&continuation-token=${encodeURIComponent(continuationToken)}`;
    }
    
    const url = `https://${host}/?${queryParams}`;
    const canonicalUri = "/";
    const canonicalQueryString = queryParams.split("&").sort().join("&");
    
    // Create empty payload hash for GET request
    const emptyPayloadHash = await crypto.subtle.digest("SHA-256", new Uint8Array(0));
    const payloadHashHex = Array.from(new Uint8Array(emptyPayloadHash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    
    const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
    const canonicalHeaders = 
      `host:${host}\n` +
      `x-amz-content-sha256:${payloadHashHex}\n` +
      `x-amz-date:${amzDate}\n`;

    const canonicalRequest = 
      `GET\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHashHex}`;

    const algorithm = "AWS4-HMAC-SHA256";
    const credentialScope = `${dateStamp}/${spacesRegion}/s3/aws4_request`;
    
    const canonicalRequestHash = await crypto.subtle.digest(
      "SHA-256",
      encoder.encode(canonicalRequest)
    );
    const canonicalRequestHashHex = Array.from(new Uint8Array(canonicalRequestHash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const stringToSign = 
      `${algorithm}\n${amzDate}\n${credentialScope}\n${canonicalRequestHashHex}`;

    const signingKey = await getSignatureKey(spacesSecret, dateStamp, spacesRegion, "s3");
    
    const signature = await crypto.subtle.sign(
      "HMAC",
      await crypto.subtle.importKey(
        "raw",
        new Uint8Array(signingKey),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      ),
      encoder.encode(stringToSign)
    );
    
    const signatureHex = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const authorizationHeader = 
      `${algorithm} Credential=${spacesKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signatureHex}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-amz-content-sha256": payloadHashHex,
        "x-amz-date": amzDate,
        "Authorization": authorizationHeader,
      },
    });

    if (!response.ok) {
      console.error(`[storage-stats] Failed to list ${folder}:`, await response.text());
      break;
    }

    const xmlText = await response.text();
    
    // Parse XML response to extract sizes
    const sizeMatches = xmlText.matchAll(/<Size>(\d+)<\/Size>/g);
    for (const match of sizeMatches) {
      totalSize += parseInt(match[1], 10);
      fileCount++;
    }
    
    // Check for continuation token
    const tokenMatch = xmlText.match(/<NextContinuationToken>([^<]+)<\/NextContinuationToken>/);
    continuationToken = tokenMatch ? tokenMatch[1] : undefined;
    
    const isTruncatedMatch = xmlText.match(/<IsTruncated>(\w+)<\/IsTruncated>/);
    if (!isTruncatedMatch || isTruncatedMatch[1] !== "true") {
      break;
    }
    
  } while (continuationToken);

  return {
    folder,
    totalSize,
    fileCount,
    formattedSize: formatBytes(totalSize),
  };
}

async function getSignatureKey(
  key: string,
  dateStamp: string,
  regionName: string,
  serviceName: string
): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  
  const kDate = await crypto.subtle.sign(
    "HMAC",
    await crypto.subtle.importKey(
      "raw",
      encoder.encode(`AWS4${key}`),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    ),
    encoder.encode(dateStamp)
  );
  
  const kRegion = await crypto.subtle.sign(
    "HMAC",
    await crypto.subtle.importKey(
      "raw",
      new Uint8Array(kDate),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    ),
    encoder.encode(regionName)
  );
  
  const kService = await crypto.subtle.sign(
    "HMAC",
    await crypto.subtle.importKey(
      "raw",
      new Uint8Array(kRegion),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    ),
    encoder.encode(serviceName)
  );
  
  const kSigning = await crypto.subtle.sign(
    "HMAC",
    await crypto.subtle.importKey(
      "raw",
      new Uint8Array(kService),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    ),
    encoder.encode("aws4_request")
  );
  
  return kSigning;
}
