import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { getSmtpSettingsFromDO, getEmailTemplateFromDO } from "../_shared/do-smtp.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailPayload {
  to: string;
  template_name: string;
  variables: Record<string, string>;
  language?: "en" | "ar";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Fetch SMTP settings from DigitalOcean
    const smtpSettings = await getSmtpSettingsFromDO();

    if (!smtpSettings) {
      console.error("No active SMTP settings configured in DigitalOcean");
      return new Response(
        JSON.stringify({ error: "Email service not configured. Please configure SMTP settings in admin panel." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: EmailPayload = await req.json();
    const { to, template_name, variables, language = "en" } = payload;

    if (!to || !template_name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, template_name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for test template
    let subject: string;
    let bodyHtml: string;

    if (template_name === "test") {
      subject = language === "ar" ? "بريد تجريبي من تحويل" : "Test Email from Tahweel";
      bodyHtml = language === "ar" 
        ? `<h1>مرحباً ${variables.name || ""}!</h1><p>هذا بريد تجريبي للتحقق من إعدادات البريد الإلكتروني.</p><p>إذا وصلك هذا البريد، فإن الإعدادات تعمل بشكل صحيح.</p>`
        : `<h1>Hello ${variables.name || ""}!</h1><p>This is a test email to verify email settings.</p><p>If you received this, your settings are working correctly.</p>`;
    } else {
      // Fetch email template from DigitalOcean
      const template = await getEmailTemplateFromDO(template_name);

      if (!template) {
        console.error("Template not found in DigitalOcean:", template_name);
        return new Response(
          JSON.stringify({ error: `Template '${template_name}' not found` }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get subject and body based on language
      subject = language === "ar" && template.subject_ar ? template.subject_ar : template.subject;
      bodyHtml = language === "ar" && template.body_html_ar ? template.body_html_ar : template.body_html;

      // Replace variables in template (support both snake_case and other common formats)
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, "g");
        subject = subject.replace(regex, value || '');
        bodyHtml = bodyHtml.replace(regex, value || '');
      }
      
      // Also replace common alias variables
      if (variables.reset_link) {
        bodyHtml = bodyHtml.replace(/\{\{confirmation_link\}\}/g, variables.reset_link);
      }
      if (variables.confirmation_link) {
        bodyHtml = bodyHtml.replace(/\{\{reset_link\}\}/g, variables.confirmation_link);
      }
      if (variables.verification_url) {
        bodyHtml = bodyHtml.replace(/\{\{verification_link\}\}/g, variables.verification_url);
        bodyHtml = bodyHtml.replace(/\{\{confirmation_link\}\}/g, variables.verification_url);
      }
    }

    console.log(`Sending email via SMTP to: ${to}`);
    console.log(`SMTP Host: ${smtpSettings.host}, Port: ${smtpSettings.port}, TLS: ${smtpSettings.use_tls}`);

    // Create SMTP client with proper TLS configuration
    // Port 465 = implicit TLS (tls: true)
    // Port 587 = STARTTLS (tls: false, then upgrade)
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
        to: to,
        subject: subject,
        content: "auto",
        html: bodyHtml,
      });

      await client.close();

      console.log("Email sent successfully via SMTP to:", to);

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
    console.error("Error in send-email:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
