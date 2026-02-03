import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyTokenRequest {
  token: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token }: VerifyTokenRequest = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Verifying email token:", token);

    // Find the token - first check if it exists at all
    const { data: anyToken, error: findError } = await supabase
      .from("email_verification_tokens")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (findError) {
      console.error("Error finding token:", findError);
      return new Response(
        JSON.stringify({ error: "Failed to verify token" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!anyToken) {
      console.error("Token not found in database:", token);
      return new Response(
        JSON.stringify({ error: "Invalid verification link. Please request a new one." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already verified
    if (anyToken.verified_at) {
      console.log("Token already verified:", token);
      return new Response(
        JSON.stringify({ success: true, message: "Email already verified", already_verified: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if expired
    if (new Date(anyToken.expires_at) < new Date()) {
      console.error("Token expired:", token);
      return new Response(
        JSON.stringify({ error: "Verification link has expired. Please request a new one." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokenData = anyToken;

    console.log(`Token valid for user: ${tokenData.user_id}`);

    // Update profile to mark email as verified (this is our custom verification system)
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ is_email_verified: true })
      .eq("user_id", tokenData.user_id);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      return new Response(
        JSON.stringify({ error: "Failed to verify email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark token as verified
    const { error: tokenUpdateError } = await supabase
      .from("email_verification_tokens")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", tokenData.id);

    if (tokenUpdateError) {
      console.error("Error updating token:", tokenUpdateError);
      // Don't fail - profile is already verified
    }

    console.log("Email verified successfully for user:", tokenData.user_id);

    return new Response(
      JSON.stringify({ success: true, message: "Email verified successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in verify-email-token:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});