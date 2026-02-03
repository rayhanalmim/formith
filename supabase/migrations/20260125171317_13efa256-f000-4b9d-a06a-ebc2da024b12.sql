-- Create function to update views count
CREATE OR REPLACE FUNCTION public.update_post_views_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts SET views_count = views_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts SET views_count = GREATEST(0, views_count - 1) WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for views
DROP TRIGGER IF EXISTS update_post_views_count_trigger ON public.post_views;
CREATE TRIGGER update_post_views_count_trigger
AFTER INSERT OR DELETE ON public.post_views
FOR EACH ROW
EXECUTE FUNCTION public.update_post_views_count();

-- Fix existing views counts
UPDATE public.posts p
SET views_count = (SELECT COUNT(*) FROM public.post_views v WHERE v.post_id = p.id);