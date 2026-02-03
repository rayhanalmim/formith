const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get URL from request body
    const body = await req.json();
    const { url } = body;

    if (!url) {
      return new Response(
        JSON.stringify({ error: "Missing 'url' in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[proxy-media] Fetching: ${url}`);

    // Fetch the media file from DO Spaces
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`[proxy-media] Failed to fetch: ${response.status}`);
      return new Response(
        JSON.stringify({ error: `Failed to fetch media: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the blob data
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    
    // Convert to base64
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    console.log(`[proxy-media] Success, size: ${arrayBuffer.byteLength} bytes`);

    return new Response(
      JSON.stringify({ 
        data: base64,
        contentType: response.headers.get("content-type") || "application/octet-stream",
        size: arrayBuffer.byteLength,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("[proxy-media] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
