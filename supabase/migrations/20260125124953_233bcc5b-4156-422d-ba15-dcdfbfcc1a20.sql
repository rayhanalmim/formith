-- Create push_subscriptions table for Web Push notifications
CREATE TABLE public.push_subscriptions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(user_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own subscriptions"
ON public.push_subscriptions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create email_templates table for admin-editable emails
CREATE TABLE public.email_templates (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    subject text NOT NULL,
    subject_ar text,
    body_html text NOT NULL,
    body_html_ar text,
    variables text[] DEFAULT '{}',
    is_active boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_by uuid
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage email templates"
ON public.email_templates FOR ALL
USING (is_admin_or_manager(auth.uid()));

CREATE POLICY "Anyone can view active templates"
ON public.email_templates FOR SELECT
USING (is_active = true);

-- Insert default email templates
INSERT INTO public.email_templates (name, subject, subject_ar, body_html, body_html_ar, variables) VALUES
('welcome', 'Welcome to Tahweel!', 'مرحباً بك في تحويل!', 
'<h1>Welcome {{display_name}}!</h1><p>Thank you for joining Tahweel. We are excited to have you on board.</p><p>Start exploring and connecting with our community!</p>',
'<h1>مرحباً {{display_name}}!</h1><p>شكراً لانضمامك إلى تحويل. نحن متحمسون لوجودك معنا.</p><p>ابدأ في استكشاف مجتمعنا والتواصل معه!</p>',
ARRAY['display_name', 'email']),

('password_reset', 'Reset Your Password', 'إعادة تعيين كلمة المرور',
'<h1>Password Reset</h1><p>Hi {{display_name}},</p><p>You requested to reset your password. Click the link below:</p><a href="{{reset_link}}">Reset Password</a><p>This link expires in 1 hour.</p>',
'<h1>إعادة تعيين كلمة المرور</h1><p>مرحباً {{display_name}},</p><p>لقد طلبت إعادة تعيين كلمة المرور. انقر على الرابط أدناه:</p><a href="{{reset_link}}">إعادة تعيين كلمة المرور</a><p>ينتهي هذا الرابط خلال ساعة.</p>',
ARRAY['display_name', 'email', 'reset_link']),

('new_mention', 'Someone mentioned you!', 'قام شخص ما بذكرك!',
'<h1>You were mentioned!</h1><p>Hi {{display_name}},</p><p>{{mentioner_name}} mentioned you in a {{content_type}}.</p><a href="{{post_link}}">View the post</a>',
'<h1>تم ذكرك!</h1><p>مرحباً {{display_name}},</p><p>قام {{mentioner_name}} بذكرك في {{content_type}}.</p><a href="{{post_link}}">عرض المنشور</a>',
ARRAY['display_name', 'mentioner_name', 'content_type', 'post_link']),

('new_follower', 'You have a new follower!', 'لديك متابع جديد!',
'<h1>New Follower!</h1><p>Hi {{display_name}},</p><p>{{follower_name}} started following you.</p><a href="{{profile_link}}">View their profile</a>',
'<h1>متابع جديد!</h1><p>مرحباً {{display_name}},</p><p>بدأ {{follower_name}} بمتابعتك.</p><a href="{{profile_link}}">عرض ملفه الشخصي</a>',
ARRAY['display_name', 'follower_name', 'profile_link']);

-- Add triggers for updated_at
CREATE TRIGGER update_push_subscriptions_updated_at
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();