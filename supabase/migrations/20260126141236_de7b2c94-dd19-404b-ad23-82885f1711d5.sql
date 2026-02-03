-- Create email verification tokens table
CREATE TABLE public.email_verification_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Policy for service role access
CREATE POLICY "Service role can manage all tokens"
  ON public.email_verification_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create trigger to cleanup expired tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_tokens()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.email_verification_tokens 
  WHERE expires_at < now() OR verified_at IS NOT NULL;
  RETURN NEW;
END;
$$;

CREATE TRIGGER cleanup_verification_tokens_trigger
  AFTER INSERT ON public.email_verification_tokens
  EXECUTE FUNCTION public.cleanup_expired_verification_tokens();