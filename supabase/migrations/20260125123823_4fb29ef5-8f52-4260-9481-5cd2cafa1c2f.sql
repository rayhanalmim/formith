-- Add repost support to posts table
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS repost_of_id uuid REFERENCES public.posts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS quote_content text;

-- Create index for repost queries
CREATE INDEX IF NOT EXISTS idx_posts_repost_of_id ON public.posts(repost_of_id) WHERE repost_of_id IS NOT NULL;

-- Update RLS to allow viewing original posts when viewing reposts
-- (existing policies already handle this since reposts are just posts)