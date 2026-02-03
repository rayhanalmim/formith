import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MigrationRequest {
  sourceUrls: string[];
  folder: string;
}

interface MigrationResult {
  originalUrl: string;
  newUrl: string;
  success: boolean;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication - must be admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authError } = await supabase.auth.getClaims(token);
    
    if (authError || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claims.claims.sub;

    // Check if user is admin
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (!userRole || !["admin", "manager"].includes(userRole.role)) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[migrate-to-spaces] Admin user: ${userId}`);

    // Parse request body
    const body: MigrationRequest = await req.json();
    const { sourceUrls, folder } = body;

    if (!sourceUrls || !Array.isArray(sourceUrls) || !folder) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: sourceUrls (array), folder" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate folder
    const validFolders = ["avatars", "covers", "posts", "rooms", "messages"];
    if (!validFolders.includes(folder)) {
      return new Response(
        JSON.stringify({ error: `Invalid folder. Must be one of: ${validFolders.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get DigitalOcean Spaces credentials
    const spacesKey = Deno.env.get("DO_SPACES_KEY");
    const spacesSecret = Deno.env.get("DO_SPACES_SECRET");
    const spacesBucket = Deno.env.get("DO_SPACES_BUCKET");
    const spacesRegion = Deno.env.get("DO_SPACES_REGION");
    const spacesEndpoint = Deno.env.get("DO_SPACES_ENDPOINT");

    if (!spacesKey || !spacesSecret || !spacesBucket || !spacesRegion || !spacesEndpoint) {
      console.error("[migrate-to-spaces] Missing DigitalOcean Spaces configuration");
      return new Response(
        JSON.stringify({ error: "Storage not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: MigrationResult[] = [];
    const encoder = new TextEncoder();
    const endpoint = spacesEndpoint.replace("https://", "").replace("http://", "");
    const host = `${spacesBucket}.${endpoint}`;

    for (const sourceUrl of sourceUrls) {
      try {
        console.log(`[migrate-to-spaces] Processing: ${sourceUrl}`);

        // Download the file from the source URL
        const downloadResponse = await fetch(sourceUrl);
        if (!downloadResponse.ok) {
          results.push({
            originalUrl: sourceUrl,
            newUrl: "",
            success: false,
            error: `Failed to download: ${downloadResponse.status}`,
          });
          continue;
        }

        const fileData = await downloadResponse.arrayBuffer();
        const binaryData = new Uint8Array(fileData);
        const contentType = downloadResponse.headers.get("content-type") || "application/octet-stream";

        // Extract filename from URL
        const urlParts = sourceUrl.split("/");
        const originalFileName = urlParts[urlParts.length - 1];
        const ext = originalFileName.split(".").pop() || "bin";

        // Generate new file path
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const filePath = `${folder}/migrated/${timestamp}-${randomSuffix}.${ext}`;

        console.log(`[migrate-to-spaces] Uploading: ${filePath}, type: ${contentType}, size: ${binaryData.length}`);

        // Create AWS Signature v4
        const date = new Date();
        const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
        const dateStamp = amzDate.substring(0, 8);

        const url = `https://${host}/${filePath}`;
        const method = "PUT";
        const canonicalUri = `/${filePath}`;
        const canonicalQueryString = "";

        // Calculate content hash
        const contentHash = await crypto.subtle.digest("SHA-256", binaryData);
        const contentHashHex = Array.from(new Uint8Array(contentHash))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
        const canonicalHeaders =
          `content-type:${contentType}\n` +
          `host:${host}\n` +
          `x-amz-content-sha256:${contentHashHex}\n` +
          `x-amz-date:${amzDate}\n`;

        const canonicalRequest =
          `${method}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${contentHashHex}`;

        // Create string to sign
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

        // Calculate signing key
        const getSignatureKey = async (
          key: string,
          dateStamp: string,
          regionName: string,
          serviceName: string
        ) => {
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
        };

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

        // Upload to DigitalOcean Spaces
        const uploadResponse = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": contentType,
            "x-amz-content-sha256": contentHashHex,
            "x-amz-date": amzDate,
            "Authorization": authorizationHeader,
            "x-amz-acl": "public-read",
          },
          body: binaryData,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error(`[migrate-to-spaces] Upload failed: ${uploadResponse.status} - ${errorText}`);
          results.push({
            originalUrl: sourceUrl,
            newUrl: "",
            success: false,
            error: `Upload failed: ${uploadResponse.status}`,
          });
          continue;
        }

        const publicUrl = `https://${host}/${filePath}`;
        console.log(`[migrate-to-spaces] Success: ${publicUrl}`);

        results.push({
          originalUrl: sourceUrl,
          newUrl: publicUrl,
          success: true,
        });

      } catch (error) {
        console.error(`[migrate-to-spaces] Error processing ${sourceUrl}:`, error);
        results.push({
          originalUrl: sourceUrl,
          newUrl: "",
          success: false,
          error: String(error),
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`[migrate-to-spaces] Completed: ${successCount}/${sourceUrls.length} files migrated`);

    return new Response(
      JSON.stringify({
        success: true,
        totalFiles: sourceUrls.length,
        migratedCount: successCount,
        failedCount: sourceUrls.length - successCount,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[migrate-to-spaces] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
