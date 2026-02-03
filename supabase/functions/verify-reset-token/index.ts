import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyTokenRequest {
  token: string;
  newPassword: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token, newPassword }: VerifyTokenRequest = await req.json();

    if (!token || !newPassword) {
      return new Response(
        JSON.stringify({ error: "Token and new password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Verifying reset token...");

    // Find the token
    const { data: tokenData, error: tokenError } = await supabase
      .from("password_reset_tokens")
      .select("*")
      .eq("token", token)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (tokenError || !tokenData) {
      console.error("Token not found or expired:", tokenError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired reset link" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Token valid for user: ${tokenData.user_id}`);

    // Update the user's password using admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      tokenData.user_id,
      { password: newPassword }
    );

    if (updateError) {
      console.error("Error updating password:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update password" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark token as used
    await supabase
      .from("password_reset_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", tokenData.id);

    console.log("Password updated successfully for user:", tokenData.user_id);

    return new Response(
      JSON.stringify({ success: true, message: "Password updated successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in verify-reset-token:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
