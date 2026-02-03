import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { getSmtpSettingsFromDO, getEmailTemplateFromDO } from "../_shared/do-smtp.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationRequest {
  email: string;
  userId: string;
  redirectUrl: string;
  language?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, userId, redirectUrl, language = 'en' }: VerificationRequest = await req.json();

    if (!email || !userId) {
      return new Response(
        JSON.stringify({ error: "Email and userId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing verification request for: ${email}`);

    // Get SMTP settings from DigitalOcean
    const smtpSettings = await getSmtpSettingsFromDO();

    if (!smtpSettings) {
      console.error("SMTP settings not found in DigitalOcean");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate secure token
    const token = crypto.randomUUID() + "-" + crypto.randomUUID();

    // Store token in database (Supabase - auth tokens stay in Supabase)
    const { error: tokenError } = await supabase
      .from("email_verification_tokens")
      .insert({
        user_id: userId,
        email: email,
        token: token,
      });

    if (tokenError) {
      console.error("Error storing token:", tokenError);
      return new Response(
        JSON.stringify({ error: "Failed to generate verification token" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build verification URL
    const verificationUrl = `${redirectUrl}?token=${token}`;

    // Get user's display name from profile (Supabase)
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, username")
      .eq("user_id", userId)
      .maybeSingle();
    
    const displayName = profile?.display_name || profile?.username || email.split('@')[0];

    // Get email template from DigitalOcean
    const template = await getEmailTemplateFromDO("email_verification");

    // Prepare email content
    const isArabic = language === 'ar';
    let subject: string;
    let bodyHtml: string;

    if (template) {
      subject = isArabic && template.subject_ar ? template.subject_ar : template.subject;
      bodyHtml = isArabic && template.body_html_ar ? template.body_html_ar : template.body_html;
      
      // Replace ALL possible template variables
      bodyHtml = bodyHtml.replace(/\{\{verification_url\}\}/g, verificationUrl);
      bodyHtml = bodyHtml.replace(/\{\{verification_link\}\}/g, verificationUrl);
      bodyHtml = bodyHtml.replace(/\{\{confirmation_link\}\}/g, verificationUrl);
      bodyHtml = bodyHtml.replace(/\{\{display_name\}\}/g, displayName);
      bodyHtml = bodyHtml.replace(/\{\{email\}\}/g, email);
      bodyHtml = bodyHtml.replace(/\{\{username\}\}/g, profile?.username || email.split('@')[0]);
    } else {
      // Default template
      if (isArabic) {
        subject = "تأكيد بريدك الإلكتروني - تحويل";
        bodyHtml = `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; text-align: center;">مرحباً بك في تحويل!</h1>
            <p>مرحباً ${displayName}،</p>
            <p style="color: #666; font-size: 16px;">شكراً لتسجيلك. يرجى تأكيد بريدك الإلكتروني بالنقر على الزر أدناه:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">تأكيد البريد الإلكتروني</a>
            </div>
            <p style="color: #999; font-size: 14px;">هذا الرابط صالح لمدة 24 ساعة.</p>
            <p style="color: #999; font-size: 14px;">إذا لم تقم بإنشاء حساب، يمكنك تجاهل هذا البريد.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">© تحويل - منتدى المجتمع</p>
          </div>
        `;
      } else {
        subject = "Verify your email - Tahweel";
        bodyHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; text-align: center;">Welcome to Tahweel!</h1>
            <p>Hi ${displayName},</p>
            <p style="color: #666; font-size: 16px;">Thank you for signing up. Please verify your email by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email</a>
            </div>
            <p style="color: #999; font-size: 14px;">This link is valid for 24 hours.</p>
            <p style="color: #999; font-size: 14px;">If you didn't create an account, you can ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">© Tahweel - Community Forum</p>
          </div>
        `;
      }
    }

    // Send email via SMTP
    console.log(`Connecting to SMTP: ${smtpSettings.host}:${smtpSettings.port}`);

    const client = new SMTPClient({
      connection: {
        hostname: smtpSettings.host,
        port: smtpSettings.port,
        tls: smtpSettings.port === 465,
        auth: {
          username: smtpSettings.username,
          password: smtpSettings.password,
        },
      },
    });

    await client.send({
      from: `${smtpSettings.from_name} <${smtpSettings.from_email}>`,
      to: email,
      subject: subject,
      html: bodyHtml,
    });

    await client.close();

    console.log(`Verification email sent to: ${email}`);

    return new Response(
      JSON.stringify({ success: true, message: "Verification email sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in send-verification-email:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
