-- Ensure story highlight tables have proper ownership policies and safe cascading deletes

-- Enable RLS (no-op if already enabled)
ALTER TABLE public.story_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_highlight_items ENABLE ROW LEVEL SECURITY;

-- Policies: story_highlights
DO $$
BEGIN
  -- SELECT: highlights are viewable by everyone (profile feature)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'story_highlights' AND policyname = 'Highlights are viewable by everyone'
  ) THEN
    CREATE POLICY "Highlights are viewable by everyone"
    ON public.story_highlights
    FOR SELECT
    USING (true);
  END IF;

  -- INSERT: owners can create
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'story_highlights' AND policyname = 'Users can create their own highlights'
  ) THEN
    CREATE POLICY "Users can create their own highlights"
    ON public.story_highlights
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  -- UPDATE: owners can update
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'story_highlights' AND policyname = 'Users can update their own highlights'
  ) THEN
    CREATE POLICY "Users can update their own highlights"
    ON public.story_highlights
    FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;

  -- DELETE: owners can delete
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'story_highlights' AND policyname = 'Users can delete their own highlights'
  ) THEN
    CREATE POLICY "Users can delete their own highlights"
    ON public.story_highlights
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Policies: story_highlight_items
DO $$
BEGIN
  -- SELECT: highlight items are viewable by everyone
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'story_highlight_items' AND policyname = 'Highlight items are viewable by everyone'
  ) THEN
    CREATE POLICY "Highlight items are viewable by everyone"
    ON public.story_highlight_items
    FOR SELECT
    USING (true);
  END IF;

  -- INSERT: only owner of highlight can add
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'story_highlight_items' AND policyname = 'Users can add items to their highlights'
  ) THEN
    CREATE POLICY "Users can add items to their highlights"
    ON public.story_highlight_items
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.story_highlights h
        WHERE h.id = story_highlight_items.highlight_id
          AND h.user_id = auth.uid()
      )
    );
  END IF;

  -- UPDATE: only owner of highlight can update ordering
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'story_highlight_items' AND policyname = 'Users can update items in their highlights'
  ) THEN
    CREATE POLICY "Users can update items in their highlights"
    ON public.story_highlight_items
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1
        FROM public.story_highlights h
        WHERE h.id = story_highlight_items.highlight_id
          AND h.user_id = auth.uid()
      )
    );
  END IF;

  -- DELETE: only owner of highlight can remove
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'story_highlight_items' AND policyname = 'Users can delete items from their highlights'
  ) THEN
    CREATE POLICY "Users can delete items from their highlights"
    ON public.story_highlight_items
    FOR DELETE
    USING (
      EXISTS (
        SELECT 1
        FROM public.story_highlights h
        WHERE h.id = story_highlight_items.highlight_id
          AND h.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Make highlight deletion remove all items automatically
ALTER TABLE public.story_highlight_items
  DROP CONSTRAINT IF EXISTS story_highlight_items_highlight_id_fkey;

ALTER TABLE public.story_highlight_items
  ADD CONSTRAINT story_highlight_items_highlight_id_fkey
  FOREIGN KEY (highlight_id)
  REFERENCES public.story_highlights(id)
  ON DELETE CASCADE;