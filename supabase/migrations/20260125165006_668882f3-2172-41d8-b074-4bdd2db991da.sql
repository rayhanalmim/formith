-- Create table to track unique post views
CREATE TABLE public.post_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

-- Anyone can view post views (for counting)
CREATE POLICY "Post views are viewable by everyone"
ON public.post_views FOR SELECT
USING (true);

-- Authenticated users can create views
CREATE POLICY "Authenticated users can track views"
ON public.post_views FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Create index for faster lookups
CREATE INDEX idx_post_views_post_id ON public.post_views(post_id);
CREATE INDEX idx_post_views_user_id ON public.post_views(user_id);

-- Enable realtime for post_views
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_views;