-- Create poll_types enum
CREATE TYPE public.poll_type AS ENUM ('single', 'multiple');

-- Create post_polls table
CREATE TABLE public.post_polls (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    question text NOT NULL,
    poll_type poll_type NOT NULL DEFAULT 'single',
    goal text,
    ends_at timestamp with time zone,
    allow_add_options boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(post_id)
);

-- Create poll_options table  
CREATE TABLE public.poll_options (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id uuid NOT NULL REFERENCES public.post_polls(id) ON DELETE CASCADE,
    text text NOT NULL,
    emoji text,
    sort_order integer DEFAULT 0,
    votes_count integer DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create poll_votes table
CREATE TABLE public.poll_votes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id uuid NOT NULL REFERENCES public.post_polls(id) ON DELETE CASCADE,
    option_id uuid NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(poll_id, option_id, user_id)
);

-- Enable RLS
ALTER TABLE public.post_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_polls
CREATE POLICY "Polls are viewable by everyone" ON public.post_polls
FOR SELECT USING (true);

CREATE POLICY "Users can create polls for their posts" ON public.post_polls
FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM posts WHERE id = post_id AND user_id = auth.uid())
);

CREATE POLICY "Users can update their own polls" ON public.post_polls
FOR UPDATE USING (
    EXISTS (SELECT 1 FROM posts WHERE id = post_id AND user_id = auth.uid())
    OR is_admin_or_manager(auth.uid())
);

CREATE POLICY "Users can delete their own polls" ON public.post_polls
FOR DELETE USING (
    EXISTS (SELECT 1 FROM posts WHERE id = post_id AND user_id = auth.uid())
    OR is_admin_or_manager(auth.uid())
);

-- RLS Policies for poll_options
CREATE POLICY "Poll options are viewable by everyone" ON public.poll_options
FOR SELECT USING (true);

CREATE POLICY "Users can create options for their polls" ON public.poll_options
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM post_polls pp
        JOIN posts p ON p.id = pp.post_id
        WHERE pp.id = poll_id AND p.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their own poll options" ON public.poll_options
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM post_polls pp
        JOIN posts p ON p.id = pp.post_id
        WHERE pp.id = poll_id AND p.user_id = auth.uid()
    )
    OR is_admin_or_manager(auth.uid())
);

CREATE POLICY "Users can delete their own poll options" ON public.poll_options
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM post_polls pp
        JOIN posts p ON p.id = pp.post_id
        WHERE pp.id = poll_id AND p.user_id = auth.uid()
    )
    OR is_admin_or_manager(auth.uid())
);

-- RLS Policies for poll_votes
CREATE POLICY "Votes are viewable by everyone" ON public.poll_votes
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote" ON public.poll_votes
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own votes" ON public.poll_votes
FOR DELETE USING (auth.uid() = user_id);

-- Trigger to update votes count
CREATE OR REPLACE FUNCTION public.update_poll_option_votes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.poll_options SET votes_count = votes_count + 1 WHERE id = NEW.option_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.poll_options SET votes_count = GREATEST(0, votes_count - 1) WHERE id = OLD.option_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER update_poll_votes_count_trigger
AFTER INSERT OR DELETE ON public.poll_votes
FOR EACH ROW EXECUTE FUNCTION public.update_poll_option_votes_count();

-- Enable realtime for poll tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_options;