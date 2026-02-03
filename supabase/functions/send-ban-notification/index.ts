import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { getSmtpSettingsFromDO, getEmailTemplateFromDO } from "../_shared/do-smtp.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BanNotificationPayload {
  userId: string;
  isBanned: boolean;
  banReason?: string;
  displayName?: string;
  language?: "en" | "ar";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: BanNotificationPayload = await req.json();
    const { userId, isBanned, banReason, displayName, language = "ar" } = payload;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing required field: userId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user email from auth.users using service role
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !userData?.user?.email) {
      console.error("Error fetching user email:", userError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch user email" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userEmail = userData.user.email;
    console.log(`Sending ${isBanned ? 'ban' : 'reactivation'} notification to:`, userEmail);

    // Fetch SMTP settings from DigitalOcean
    const smtpSettings = await getSmtpSettingsFromDO();

    if (!smtpSettings) {
      console.error("SMTP settings not configured in DigitalOcean");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch email template from DigitalOcean
    const templateName = isBanned ? 'account_banned' : 'account_reactivated';
    const template = await getEmailTemplateFromDO(templateName);

    if (!template) {
      console.error("Template not found in DigitalOcean:", templateName);
      return new Response(
        JSON.stringify({ error: `Template '${templateName}' not found` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get subject and body based on language
    let subject = language === "ar" && template.subject_ar ? template.subject_ar : template.subject;
    let bodyHtml = language === "ar" && template.body_html_ar ? template.body_html_ar : template.body_html;

    // Replace variables in template
    const variables: Record<string, string> = {
      display_name: displayName || 'User',
      ban_reason: banReason || (language === 'ar' ? 'مخالفة إرشادات المجتمع' : 'Violation of community guidelines'),
    };

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, "g");
      subject = subject.replace(regex, value);
      bodyHtml = bodyHtml.replace(regex, value);
    }

    // Create SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: smtpSettings.host,
        port: smtpSettings.port,
        tls: smtpSettings.use_tls && smtpSettings.port === 465,
        auth: {
          username: smtpSettings.username,
          password: smtpSettings.password,
        },
      },
      debug: {
        noStartTLS: !smtpSettings.use_tls,
        allowUnsecure: !smtpSettings.use_tls,
      },
    });

    try {
      await client.send({
        from: `${smtpSettings.from_name} <${smtpSettings.from_email}>`,
        to: userEmail,
        subject: subject,
        content: "auto",
        html: bodyHtml,
      });

      await client.close();

      console.log("Ban notification email sent successfully to:", userEmail);

      return new Response(
        JSON.stringify({ success: true, message: "Email sent successfully" }),
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
    console.error("Error in send-ban-notification:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
