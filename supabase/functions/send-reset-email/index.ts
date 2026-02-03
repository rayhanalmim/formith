import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { getSmtpSettingsFromDO, getEmailTemplateFromDO } from "../_shared/do-smtp.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetEmailRequest {
  email: string;
  redirectUrl: string;
  language?: 'en' | 'ar';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, redirectUrl, language = 'en' }: ResetEmailRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Password reset requested for: ${email}`);

    // Check if user exists
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    const user = userData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Don't reveal if user exists or not for security
      console.log("User not found, but returning success for security");
      return new Response(
        JSON.stringify({ success: true, message: "If an account exists, a reset email will be sent" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a secure token
    const token = crypto.randomUUID() + "-" + crypto.randomUUID();

    // Delete any existing tokens for this email
    await supabase
      .from("password_reset_tokens")
      .delete()
      .eq("email", email.toLowerCase());

    // Store the token
    const { error: insertError } = await supabase
      .from("password_reset_tokens")
      .insert({
        user_id: user.id,
        email: email.toLowerCase(),
        token: token,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
      });

    if (insertError) {
      console.error("Error storing token:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to generate reset token" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch SMTP settings from DigitalOcean
    const smtpSettings = await getSmtpSettingsFromDO();

    if (!smtpSettings) {
      console.error("SMTP settings not found in DigitalOcean");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build reset link
    const resetLink = `${redirectUrl}?token=${token}`;

    // Get user's display name from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, username")
      .eq("user_id", user.id)
      .maybeSingle();
    
    const displayName = profile?.display_name || profile?.username || email.split('@')[0];

    // Fetch custom template from DigitalOcean
    let subject: string;
    let bodyHtml: string;

    const template = await getEmailTemplateFromDO("password_reset");

    if (template) {
      subject = language === 'ar' && template.subject_ar ? template.subject_ar : template.subject;
      bodyHtml = language === 'ar' && template.body_html_ar ? template.body_html_ar : template.body_html;
      
      // Replace ALL possible template variables
      bodyHtml = bodyHtml.replace(/\{\{reset_link\}\}/g, resetLink);
      bodyHtml = bodyHtml.replace(/\{\{confirmation_link\}\}/g, resetLink);
      bodyHtml = bodyHtml.replace(/\{\{display_name\}\}/g, displayName);
      bodyHtml = bodyHtml.replace(/\{\{email\}\}/g, email);
      bodyHtml = bodyHtml.replace(/\{\{username\}\}/g, profile?.username || email.split('@')[0]);
    } else {
      // Default templates
      if (language === 'ar') {
        subject = "إعادة تعيين كلمة المرور - تحويل";
        bodyHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; direction: rtl;">
            <h1 style="color: #8B5CF6; text-align: center;">إعادة تعيين كلمة المرور</h1>
            <p>مرحباً ${displayName}،</p>
            <p>طلبت إعادة تعيين كلمة المرور. انقر على الزر أدناه لتعيين كلمة مرور جديدة:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background: linear-gradient(135deg, #8B5CF6, #06B6D4); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">إعادة تعيين كلمة المرور</a>
            </div>
            <p style="color: #666; font-size: 14px;">أو انسخ والصق هذا الرابط في متصفحك:</p>
            <p style="color: #8B5CF6; word-break: break-all; font-size: 12px;">${resetLink}</p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">هذا الرابط صالح لمدة ساعة واحدة فقط.</p>
            <p style="color: #666; font-size: 12px;">إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد بأمان.</p>
          </div>
        `;
      } else {
        subject = "Reset your password - Tahweel";
        bodyHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #8B5CF6; text-align: center;">Password Reset</h1>
            <p>Hi ${displayName},</p>
            <p>You requested to reset your password. Click the button below to set a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background: linear-gradient(135deg, #8B5CF6, #06B6D4); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
            </div>
            <p style="color: #666; font-size: 14px;">Or copy and paste this link in your browser:</p>
            <p style="color: #8B5CF6; word-break: break-all; font-size: 12px;">${resetLink}</p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">This link is valid for 1 hour only.</p>
            <p style="color: #666; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `;
      }
    }

    console.log(`Sending password reset email via SMTP to: ${email}`);

    // Create SMTP client
    const isImplicitTLS = smtpSettings.port === 465;
    
    const client = new SMTPClient({
      connection: {
        hostname: smtpSettings.host,
        port: smtpSettings.port,
        tls: isImplicitTLS,
        auth: {
          username: smtpSettings.username,
          password: smtpSettings.password,
        },
      },
      debug: {
        noStartTLS: !smtpSettings.use_tls || isImplicitTLS,
        allowUnsecure: !smtpSettings.use_tls,
      },
    });

    try {
      await client.send({
        from: `${smtpSettings.from_name} <${smtpSettings.from_email}>`,
        to: email,
        subject: subject,
        content: "auto",
        html: bodyHtml,
      });

      await client.close();
      console.log("Password reset email sent successfully to:", email);

      return new Response(
        JSON.stringify({ success: true, message: "Reset email sent" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (sendError: unknown) {
      await client.close();
      const errorMessage = sendError instanceof Error ? sendError.message : 'Unknown SMTP error';
      console.error("SMTP send error:", sendError);
      return new Response(
        JSON.stringify({ error: `Failed to send email: ${errorMessage}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in send-reset-email:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
