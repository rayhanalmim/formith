-- Add additional profile fields for user information
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS birthday date,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS birthplace text,
ADD COLUMN IF NOT EXISTS current_location text,
ADD COLUMN IF NOT EXISTS relationship_status text;