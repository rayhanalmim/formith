import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AuthEmailHookPayload {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the webhook payload
    const payload: AuthEmailHookPayload = await req.json();
    const { user, email_data } = payload;
    
    console.log("Auth email hook received:", {
      email: user.email,
      action_type: email_data.email_action_type,
    });

    // Fetch SMTP settings from database
    const { data: smtpSettings, error: smtpError } = await supabase
      .from("smtp_settings")
      .select("*")
      .eq("is_active", true)
      .maybeSingle();

    if (smtpError || !smtpSettings) {
      console.error("SMTP settings not found:", smtpError);
      return new Response(
        JSON.stringify({ error: "SMTP not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine template and subject based on action type
    let templateName = "";
    let defaultSubjectEn = "";
    let defaultSubjectAr = "";
    let defaultBodyEn = "";
    let defaultBodyAr = "";

    const confirmationLink = `${supabaseUrl}/auth/v1/verify?token=${email_data.token_hash}&type=${email_data.email_action_type}&redirect_to=${email_data.redirect_to || email_data.site_url}`;

    switch (email_data.email_action_type) {
      case "signup":
        templateName = "email_verification";
        defaultSubjectEn = "Verify your email - Tahweel";
        defaultSubjectAr = "تأكيد بريدك الإلكتروني - تحويل";
        defaultBodyEn = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #8B5CF6; text-align: center;">Welcome to Tahweel!</h1>
            <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationLink}" style="background: linear-gradient(135deg, #8B5CF6, #06B6D4); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Verify Email</a>
            </div>
            <p style="color: #666; font-size: 14px;">Or copy and paste this link in your browser:</p>
            <p style="color: #8B5CF6; word-break: break-all; font-size: 12px;">${confirmationLink}</p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">If you didn't create an account, you can safely ignore this email.</p>
          </div>
        `;
        defaultBodyAr = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; direction: rtl;">
            <h1 style="color: #8B5CF6; text-align: center;">مرحباً بك في تحويل!</h1>
            <p>شكراً لتسجيلك. يرجى تأكيد بريدك الإلكتروني بالنقر على الزر أدناه:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationLink}" style="background: linear-gradient(135deg, #8B5CF6, #06B6D4); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">تأكيد البريد</a>
            </div>
            <p style="color: #666; font-size: 14px;">أو انسخ والصق هذا الرابط في متصفحك:</p>
            <p style="color: #8B5CF6; word-break: break-all; font-size: 12px;">${confirmationLink}</p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">إذا لم تقم بإنشاء حساب، يمكنك تجاهل هذا البريد بأمان.</p>
          </div>
        `;
        break;
      
      case "recovery":
      case "magiclink":
        templateName = "password_reset";
        defaultSubjectEn = "Reset your password - Tahweel";
        defaultSubjectAr = "إعادة تعيين كلمة المرور - تحويل";
        defaultBodyEn = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #8B5CF6; text-align: center;">Password Reset</h1>
            <p>You requested to reset your password. Click the button below to set a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationLink}" style="background: linear-gradient(135deg, #8B5CF6, #06B6D4); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
            </div>
            <p style="color: #666; font-size: 14px;">Or copy and paste this link in your browser:</p>
            <p style="color: #8B5CF6; word-break: break-all; font-size: 12px;">${confirmationLink}</p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `;
        defaultBodyAr = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; direction: rtl;">
            <h1 style="color: #8B5CF6; text-align: center;">إعادة تعيين كلمة المرور</h1>
            <p>طلبت إعادة تعيين كلمة المرور. انقر على الزر أدناه لتعيين كلمة مرور جديدة:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationLink}" style="background: linear-gradient(135deg, #8B5CF6, #06B6D4); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">إعادة تعيين</a>
            </div>
            <p style="color: #666; font-size: 14px;">أو انسخ والصق هذا الرابط في متصفحك:</p>
            <p style="color: #8B5CF6; word-break: break-all; font-size: 12px;">${confirmationLink}</p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">إذا لم تطلب هذا، يمكنك تجاهل هذا البريد بأمان.</p>
          </div>
        `;
        break;
      
      case "email_change":
        templateName = "email_change";
        defaultSubjectEn = "Confirm your email change - Tahweel";
        defaultSubjectAr = "تأكيد تغيير البريد الإلكتروني - تحويل";
        defaultBodyEn = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #8B5CF6; text-align: center;">Email Change Confirmation</h1>
            <p>You requested to change your email address. Click the button below to confirm:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationLink}" style="background: linear-gradient(135deg, #8B5CF6, #06B6D4); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Confirm Email Change</a>
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">If you didn't request this, please contact support immediately.</p>
          </div>
        `;
        defaultBodyAr = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; direction: rtl;">
            <h1 style="color: #8B5CF6; text-align: center;">تأكيد تغيير البريد الإلكتروني</h1>
            <p>طلبت تغيير بريدك الإلكتروني. انقر على الزر أدناه للتأكيد:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationLink}" style="background: linear-gradient(135deg, #8B5CF6, #06B6D4); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">تأكيد التغيير</a>
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">إذا لم تطلب هذا، يرجى التواصل مع الدعم فوراً.</p>
          </div>
        `;
        break;

      default:
        console.log("Unhandled email action type:", email_data.email_action_type);
        return new Response(
          JSON.stringify({ success: true, message: "Unhandled action type" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Fetch user's display name from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, username")
      .eq("user_id", user.id)
      .maybeSingle();
    
    const displayName = profile?.display_name || profile?.username || user.user_metadata?.full_name || user.email.split('@')[0];

    // Try to fetch custom template from database
    let subject = defaultSubjectEn;
    let bodyHtml = defaultBodyEn;

    const { data: template } = await supabase
      .from("email_templates")
      .select("*")
      .eq("name", templateName)
      .eq("is_active", true)
      .maybeSingle();

    if (template) {
      // Use custom template and replace variables
      subject = template.subject;
      bodyHtml = template.body_html;
      
      // Replace ALL possible template variables
      const variables: Record<string, string> = {
        confirmation_link: confirmationLink,
        verification_link: confirmationLink,
        verification_url: confirmationLink,
        reset_link: confirmationLink,
        display_name: displayName,
        email: user.email,
        username: profile?.username || user.email.split('@')[0],
        token: email_data.token,
        site_url: email_data.site_url,
      };

      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, "g");
        subject = subject.replace(regex, value);
        bodyHtml = bodyHtml.replace(regex, value);
      }
    }

    console.log(`Sending ${email_data.email_action_type} email via SMTP to: ${user.email}`);
    console.log(`SMTP Host: ${smtpSettings.host}, Port: ${smtpSettings.port}`);

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
        to: user.email,
        subject: subject,
        content: "auto",
        html: bodyHtml,
      });

      await client.close();
      console.log("Auth email sent successfully via SMTP to:", user.email);

      return new Response(
        JSON.stringify({ success: true }),
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
    console.error("Error in auth-email-hook:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
