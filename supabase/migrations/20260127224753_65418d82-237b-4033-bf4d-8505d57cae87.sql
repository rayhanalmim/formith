-- Create stories table
CREATE TABLE public.stories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image', -- 'image' or 'video'
  thumbnail_url text,
  text_overlay jsonb, -- {text, position, font, color, size}
  stickers jsonb DEFAULT '[]'::jsonb, -- [{type, data, position, size}]
  filter text, -- filter name applied
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours'),
  views_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  
  CONSTRAINT stories_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE
);

-- Create story views table
CREATE TABLE public.story_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id uuid NOT NULL,
  viewer_id uuid NOT NULL,
  viewed_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT story_views_story_id_fkey FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  CONSTRAINT story_views_unique UNIQUE (story_id, viewer_id)
);

-- Create story reactions table
CREATE TABLE public.story_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id uuid NOT NULL,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT story_reactions_story_id_fkey FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  CONSTRAINT story_reactions_unique UNIQUE (story_id, user_id)
);

-- Create story replies table (links to DM)
CREATE TABLE public.story_replies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT story_replies_story_id_fkey FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_stories_user_id ON public.stories(user_id);
CREATE INDEX idx_stories_expires_at ON public.stories(expires_at);
CREATE INDEX idx_stories_active ON public.stories(is_active, expires_at);
CREATE INDEX idx_story_views_story_id ON public.story_views(story_id);
CREATE INDEX idx_story_reactions_story_id ON public.story_reactions(story_id);

-- Enable RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_replies ENABLE ROW LEVEL SECURITY;

-- Stories policies
CREATE POLICY "Users can view stories from people they follow or their own"
  ON public.stories FOR SELECT
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM follows 
      WHERE follower_id = auth.uid() 
      AND following_id = stories.user_id
    )
    OR is_admin_or_manager(auth.uid())
  );

CREATE POLICY "Users can create their own stories"
  ON public.stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories"
  ON public.stories FOR DELETE
  USING (auth.uid() = user_id OR is_admin_or_manager(auth.uid()));

CREATE POLICY "Users can update their own stories"
  ON public.stories FOR UPDATE
  USING (auth.uid() = user_id OR is_admin_or_manager(auth.uid()));

-- Story views policies
CREATE POLICY "Story owners can view all views"
  ON public.story_views FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM stories WHERE id = story_id AND user_id = auth.uid())
    OR viewer_id = auth.uid()
  );

CREATE POLICY "Authenticated users can add views"
  ON public.story_views FOR INSERT
  WITH CHECK (auth.uid() = viewer_id);

-- Story reactions policies
CREATE POLICY "Users can view reactions on stories they can see"
  ON public.story_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stories s 
      WHERE s.id = story_id 
      AND (s.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM follows WHERE follower_id = auth.uid() AND following_id = s.user_id
      ))
    )
  );

CREATE POLICY "Users can add reactions"
  ON public.story_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their reactions"
  ON public.story_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Story replies policies
CREATE POLICY "Story owners can view replies"
  ON public.story_replies FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM stories WHERE id = story_id AND user_id = auth.uid())
    OR sender_id = auth.uid()
  );

CREATE POLICY "Authenticated users can send replies"
  ON public.story_replies FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Function to update story views count
CREATE OR REPLACE FUNCTION public.update_story_views_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE stories SET views_count = views_count + 1 WHERE id = NEW.story_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE stories SET views_count = GREATEST(0, views_count - 1) WHERE id = OLD.story_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger for story views count
CREATE TRIGGER update_story_views_count_trigger
  AFTER INSERT OR DELETE ON public.story_views
  FOR EACH ROW
  EXECUTE FUNCTION public.update_story_views_count();

-- Enable realtime for stories
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_views;
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_reactions;