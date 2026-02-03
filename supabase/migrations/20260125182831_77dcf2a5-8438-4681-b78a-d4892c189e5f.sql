-- Create function to update comment likes count
CREATE OR REPLACE FUNCTION public.update_comment_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.comment_id IS NOT NULL THEN
            UPDATE public.comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.comment_id IS NOT NULL THEN
            UPDATE public.comments SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.comment_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Create trigger for comment likes count
CREATE TRIGGER update_comment_likes_count_trigger
AFTER INSERT OR DELETE ON public.likes
FOR EACH ROW
EXECUTE FUNCTION public.update_comment_likes_count();

-- Sync existing comment likes counts
UPDATE public.comments c
SET likes_count = (
    SELECT COUNT(*) FROM public.likes l WHERE l.comment_id = c.id
);