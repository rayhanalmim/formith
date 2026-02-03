-- Add privacy settings columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS show_birthday boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_gender boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_birthplace boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_location boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_relationship boolean DEFAULT true;

COMMENT ON COLUMN public.profiles.show_birthday IS 'Controls visibility of birthday to other users';
COMMENT ON COLUMN public.profiles.show_gender IS 'Controls visibility of gender to other users';
COMMENT ON COLUMN public.profiles.show_birthplace IS 'Controls visibility of birthplace to other users';
COMMENT ON COLUMN public.profiles.show_location IS 'Controls visibility of current location to other users';
COMMENT ON COLUMN public.profiles.show_relationship IS 'Controls visibility of relationship status to other users';