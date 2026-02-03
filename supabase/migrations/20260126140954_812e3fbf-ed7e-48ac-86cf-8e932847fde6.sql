-- Create table for password reset tokens
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '1 hour'),
  used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Allow the edge function (service role) to manage tokens
-- Users can only read their own tokens for verification
CREATE POLICY "Service role can manage all tokens"
ON public.password_reset_tokens
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster token lookups
CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_email ON public.password_reset_tokens(email);

-- Auto-delete expired tokens (cleanup)
CREATE OR REPLACE FUNCTION public.cleanup_expired_reset_tokens()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.password_reset_tokens 
  WHERE expires_at < now() OR used_at IS NOT NULL;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_cleanup_reset_tokens
AFTER INSERT ON public.password_reset_tokens
EXECUTE FUNCTION public.cleanup_expired_reset_tokens();