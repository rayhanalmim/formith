-- Create story highlights table
CREATE TABLE public.story_highlights (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  cover_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  sort_order integer DEFAULT 0,
  
  CONSTRAINT story_highlights_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE
);

-- Create story highlight items (stories added to highlights)
CREATE TABLE public.story_highlight_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  highlight_id uuid NOT NULL,
  story_id uuid NOT NULL,
  added_at timestamp with time zone NOT NULL DEFAULT now(),
  sort_order integer DEFAULT 0,
  
  CONSTRAINT story_highlight_items_highlight_id_fkey FOREIGN KEY (highlight_id) REFERENCES story_highlights(id) ON DELETE CASCADE,
  CONSTRAINT story_highlight_items_story_id_fkey FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  CONSTRAINT story_highlight_items_unique UNIQUE (highlight_id, story_id)
);

-- Create indexes
CREATE INDEX idx_story_highlights_user_id ON public.story_highlights(user_id);
CREATE INDEX idx_story_highlight_items_highlight_id ON public.story_highlight_items(highlight_id);

-- Enable RLS
ALTER TABLE public.story_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_highlight_items ENABLE ROW LEVEL SECURITY;

-- Story highlights policies
CREATE POLICY "Anyone can view highlights"
  ON public.story_highlights FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own highlights"
  ON public.story_highlights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own highlights"
  ON public.story_highlights FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own highlights"
  ON public.story_highlights FOR DELETE
  USING (auth.uid() = user_id);

-- Story highlight items policies
CREATE POLICY "Anyone can view highlight items"
  ON public.story_highlight_items FOR SELECT
  USING (true);

CREATE POLICY "Users can add items to their highlights"
  ON public.story_highlight_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM story_highlights h
      WHERE h.id = highlight_id AND h.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove items from their highlights"
  ON public.story_highlight_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM story_highlights h
      WHERE h.id = highlight_id AND h.user_id = auth.uid()
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_highlights;