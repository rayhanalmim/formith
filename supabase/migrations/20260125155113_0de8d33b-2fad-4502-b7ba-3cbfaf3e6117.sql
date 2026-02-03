-- Create SMTP settings table for email configuration
CREATE TABLE public.smtp_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host text NOT NULL,
  port integer NOT NULL DEFAULT 587,
  username text NOT NULL,
  password text NOT NULL,
  from_email text NOT NULL,
  from_name text NOT NULL DEFAULT 'Tahweel',
  use_tls boolean DEFAULT true,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.smtp_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage SMTP settings
CREATE POLICY "Admins can manage SMTP settings"
  ON public.smtp_settings
  FOR ALL
  USING (is_admin_or_manager(auth.uid()));

-- Only one active SMTP config at a time (singleton pattern)
CREATE UNIQUE INDEX smtp_settings_singleton ON public.smtp_settings ((true)) WHERE is_active = true;

-- Add trigger for updated_at
CREATE TRIGGER update_smtp_settings_updated_at
  BEFORE UPDATE ON public.smtp_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();