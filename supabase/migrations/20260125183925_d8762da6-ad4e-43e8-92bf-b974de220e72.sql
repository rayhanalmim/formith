-- Add status column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'online' CHECK (status IN ('online', 'offline', 'busy'));

-- Create index for faster status lookups
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- Add last_seen_at column for more accurate presence tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_seen_at timestamp with time zone DEFAULT now();