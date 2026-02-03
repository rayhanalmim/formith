-- Add privacy columns for followers and following counts
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS show_followers_count boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_following_count boolean DEFAULT true;