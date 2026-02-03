-- Create function to update likes count
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.post_id IS NOT NULL THEN
            UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.post_id IS NOT NULL THEN
            UPDATE public.posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for likes
DROP TRIGGER IF EXISTS update_post_likes_count_trigger ON public.likes;
CREATE TRIGGER update_post_likes_count_trigger
AFTER INSERT OR DELETE ON public.likes
FOR EACH ROW
EXECUTE FUNCTION public.update_post_likes_count();

-- Fix existing counts
UPDATE public.posts p
SET likes_count = (SELECT COUNT(*) FROM public.likes l WHERE l.post_id = p.id);