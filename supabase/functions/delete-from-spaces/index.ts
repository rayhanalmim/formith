import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeleteRequest {
  urls: string[]; // Array of URLs to delete
}

interface DeleteResponse {
  success: boolean;
  deleted: string[];
  failed: string[];
}

// Extract the file path from a DigitalOcean Spaces URL
function extractPathFromUrl(url: string, bucket: string, endpoint: string): string | null {
  try {
    // URL format: https://{bucket}.{endpoint}/{path}
    const cleanEndpoint = endpoint.replace("https://", "").replace("http://", "");
    const expectedPrefix = `https://${bucket}.${cleanEndpoint}/`;
    
    if (url.startsWith(expectedPrefix)) {
      return url.substring(expectedPrefix.length);
    }
    
    // Also try without bucket in subdomain (some URLs might be different format)
    const altPrefix = `https://${cleanEndpoint}/${bucket}/`;
    if (url.startsWith(altPrefix)) {
      return url.substring(altPrefix.length);
    }
    
    console.log(`[delete-from-spaces] URL doesn't match expected format: ${url}`);
    return null;
  } catch (e) {
    console.error(`[delete-from-spaces] Error extracting path from URL: ${url}`, e);
    return null;
  }
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

    // Validate the user by getting their session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("[delete-from-spaces] Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    console.log(`[delete-from-spaces] Authenticated user: ${userId}`);

    // Parse request body
    const body: DeleteRequest = await req.json();
    const { urls } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing or empty 'urls' array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limit batch size to prevent abuse
    if (urls.length > 50) {
      return new Response(
        JSON.stringify({ error: "Maximum 50 URLs per request" }),
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
      console.error("[delete-from-spaces] Missing DigitalOcean Spaces configuration");
      return new Response(
        JSON.stringify({ error: "Storage not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const deleted: string[] = [];
    const failed: string[] = [];
    const encoder = new TextEncoder();

    // Helper to create AWS Signature v4
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

    // Delete each file
    for (const url of urls) {
      if (!url || typeof url !== 'string') {
        failed.push(url);
        continue;
      }

      const filePath = extractPathFromUrl(url, spacesBucket, spacesEndpoint);
      if (!filePath) {
        console.log(`[delete-from-spaces] Skipping invalid URL: ${url}`);
        failed.push(url);
        continue;
      }

      // Security check: only allow deletion of files in valid folders
      const validFolders = ["avatars/", "covers/", "posts/", "rooms/", "messages/"];
      const isValidFolder = validFolders.some(folder => filePath.startsWith(folder));
      if (!isValidFolder) {
        console.log(`[delete-from-spaces] Invalid folder in path: ${filePath}`);
        failed.push(url);
        continue;
      }

      // Security check: file path should contain the user's ID (unless admin)
      // For now, we allow any authenticated user to delete files they reference
      // The calling code should ensure proper authorization

      try {
        console.log(`[delete-from-spaces] Deleting file: ${filePath}`);

        // Create AWS Signature v4 for DELETE request
        const date = new Date();
        const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
        const dateStamp = amzDate.substring(0, 8);
        
        const endpoint = spacesEndpoint.replace("https://", "").replace("http://", "");
        const host = `${spacesBucket}.${endpoint}`;
        const deleteUrl = `https://${host}/${filePath}`;

        // Create canonical request for DELETE
        const method = "DELETE";
        const canonicalUri = `/${filePath}`;
        const canonicalQueryString = "";
        
        // For DELETE requests, content hash is the hash of empty string
        const emptyHash = await crypto.subtle.digest("SHA-256", new Uint8Array(0));
        const contentHashHex = Array.from(new Uint8Array(emptyHash))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
        const canonicalHeaders = 
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

        // Send DELETE request
        const deleteResponse = await fetch(deleteUrl, {
          method: "DELETE",
          headers: {
            "x-amz-content-sha256": contentHashHex,
            "x-amz-date": amzDate,
            "Authorization": authorizationHeader,
          },
        });

        // 204 No Content is success, 404 means already deleted (also success for our purposes)
        if (deleteResponse.ok || deleteResponse.status === 204 || deleteResponse.status === 404) {
          console.log(`[delete-from-spaces] Successfully deleted: ${filePath}`);
          deleted.push(url);
        } else {
          const errorText = await deleteResponse.text();
          console.error(`[delete-from-spaces] Failed to delete ${filePath}: ${deleteResponse.status} - ${errorText}`);
          failed.push(url);
        }
      } catch (e) {
        console.error(`[delete-from-spaces] Error deleting ${filePath}:`, e);
        failed.push(url);
      }
    }

    console.log(`[delete-from-spaces] Completed. Deleted: ${deleted.length}, Failed: ${failed.length}`);

    const response: DeleteResponse = {
      success: failed.length === 0,
      deleted,
      failed,
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[delete-from-spaces] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
