import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UploadResponse {
  url: string;
  path: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
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
    console.log(`[upload-to-spaces] Authenticated user: ${userId}`);

    // Get DigitalOcean Spaces credentials
    const spacesKey = Deno.env.get("DO_SPACES_KEY");
    const spacesSecret = Deno.env.get("DO_SPACES_SECRET");
    const spacesBucket = Deno.env.get("DO_SPACES_BUCKET");
    const spacesRegion = Deno.env.get("DO_SPACES_REGION");
    const spacesEndpoint = Deno.env.get("DO_SPACES_ENDPOINT");

    if (!spacesKey || !spacesSecret || !spacesBucket || !spacesRegion || !spacesEndpoint) {
      console.error("[upload-to-spaces] Missing DigitalOcean Spaces configuration");
      return new Response(
        JSON.stringify({ error: "Storage not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    
    let fileName: string;
    let fileType: string;
    let folder: string;
    let binaryData: Uint8Array;

    // Handle multipart form-data (for large files like videos)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      folder = (formData.get("folder") as string) || "posts";
      
      if (!file) {
        return new Response(
          JSON.stringify({ error: "No file provided in form data" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      fileName = file.name;
      fileType = file.type;
      binaryData = new Uint8Array(await file.arrayBuffer());
      
      console.log(`[upload-to-spaces] Multipart upload - file: ${fileName}, type: ${fileType}, size: ${binaryData.length}`);
    } 
    // Handle JSON body (for smaller files - backward compatible)
    else {
      let body;
      try {
        body = await req.json();
      } catch (e) {
        console.error("[upload-to-spaces] Failed to parse JSON body:", e);
        return new Response(
          JSON.stringify({ error: "Invalid JSON body" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const { fileName: fn, fileType: ft, folder: f, fileData } = body;
      
      console.log(`[upload-to-spaces] JSON body received - fileName: ${fn}, fileType: ${ft}, folder: ${f}, fileDataLength: ${fileData?.length || 0}`);
      
      if (!fn || !ft || !f || !fileData) {
        console.error(`[upload-to-spaces] Missing fields - fileName: ${!!fn}, fileType: ${!!ft}, folder: ${!!f}, fileData: ${!!fileData}`);
        return new Response(
          JSON.stringify({ error: "Missing required fields: fileName, fileType, folder, fileData" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      fileName = fn;
      fileType = ft;
      folder = f;
      binaryData = Uint8Array.from(atob(fileData), (c) => c.charCodeAt(0));
      
      console.log(`[upload-to-spaces] JSON upload - file: ${fileName}, type: ${fileType}, size: ${binaryData.length}`);
    }

    // Validate folder
    const validFolders = ["avatars", "covers", "posts", "rooms", "messages", "stories"];
    if (!validFolders.includes(folder)) {
      console.error(`[upload-to-spaces] Invalid folder: ${folder}`);
      return new Response(
        JSON.stringify({ error: `Invalid folder. Must be one of: ${validFolders.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate unique file path
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    const ext = fileName.split(".").pop() || "bin";
    const filePath = `${folder}/${userId}/${timestamp}-${randomSuffix}.${ext}`;

    console.log(`[upload-to-spaces] Uploading to path: ${filePath}`);

    // Create AWS Signature v4 for S3-compatible API
    const date = new Date();
    const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const dateStamp = amzDate.substring(0, 8);
    
    const endpoint = spacesEndpoint.replace("https://", "").replace("http://", "");
    const host = `${spacesBucket}.${endpoint}`;
    const url = `https://${host}/${filePath}`;

    // Create canonical request
    const method = "PUT";
    const canonicalUri = `/${filePath}`;
    const canonicalQueryString = "";
    
    // Calculate content hash
    const encoder = new TextEncoder();
    const contentHash = await crypto.subtle.digest("SHA-256", binaryData.buffer as ArrayBuffer);
    const contentHashHex = Array.from(new Uint8Array(contentHash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Set cache duration based on folder type (immutable for user content)
    const cacheMaxAge = 31536000; // 1 year in seconds
    const cacheControl = `public, max-age=${cacheMaxAge}, immutable`;

    const signedHeaders = "cache-control;content-type;host;x-amz-content-sha256;x-amz-date";
    const canonicalHeaders = 
      `cache-control:${cacheControl}\n` +
      `content-type:${fileType}\n` +
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

    // Upload to DigitalOcean Spaces with caching headers
    const uploadResponse = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": fileType,
        "Cache-Control": cacheControl,
        "x-amz-content-sha256": contentHashHex,
        "x-amz-date": amzDate,
        "Authorization": authorizationHeader,
        "x-amz-acl": "public-read",
      },
      body: binaryData.buffer as ArrayBuffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error(`[upload-to-spaces] Upload failed: ${uploadResponse.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: "Upload failed", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Construct public URL
    const publicUrl = `https://${host}/${filePath}`;
    
    console.log(`[upload-to-spaces] Upload successful: ${publicUrl}`);

    const response: UploadResponse = {
      url: publicUrl,
      path: filePath,
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[upload-to-spaces] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
