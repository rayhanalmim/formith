-- Create user settings table for preferences
CREATE TABLE public.user_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    -- Notification preferences
    email_notifications boolean DEFAULT true,
    push_notifications boolean DEFAULT true,
    notify_likes boolean DEFAULT true,
    notify_comments boolean DEFAULT true,
    notify_follows boolean DEFAULT true,
    notify_messages boolean DEFAULT true,
    -- Privacy settings
    profile_visibility text DEFAULT 'public' CHECK (profile_visibility IN ('public', 'followers', 'private')),
    show_online_status boolean DEFAULT true,
    allow_messages_from text DEFAULT 'everyone' CHECK (allow_messages_from IN ('everyone', 'followers', 'nobody')),
    -- Timestamps
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Users can view their own settings
CREATE POLICY "Users can view their own settings"
ON public.user_settings
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own settings
CREATE POLICY "Users can insert their own settings"
ON public.user_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Users can update their own settings"
ON public.user_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create settings when a new user signs up
CREATE OR REPLACE FUNCTION public.create_user_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_settings
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_user_settings();