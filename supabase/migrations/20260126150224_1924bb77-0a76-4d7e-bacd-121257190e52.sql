-- Add is_email_verified column to track custom email verification
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_email_verified boolean DEFAULT false;

-- Update existing users who have verified their email via tokens
UPDATE public.profiles p
SET is_email_verified = true
WHERE EXISTS (
  SELECT 1 FROM public.email_verification_tokens evt
  WHERE evt.user_id = p.user_id
  AND evt.verified_at IS NOT NULL
);

-- Also mark admin users as verified
UPDATE public.profiles
SET is_email_verified = true
WHERE user_id IN (
  SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'manager')
);