-- Create function to update comments count
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for comments
DROP TRIGGER IF EXISTS update_post_comments_count_trigger ON public.comments;
CREATE TRIGGER update_post_comments_count_trigger
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.update_post_comments_count();

-- Create function to update shares count (reposts)
CREATE OR REPLACE FUNCTION public.update_post_shares_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.repost_of_id IS NOT NULL THEN
            UPDATE public.posts SET shares_count = shares_count + 1 WHERE id = NEW.repost_of_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.repost_of_id IS NOT NULL THEN
            UPDATE public.posts SET shares_count = GREATEST(0, shares_count - 1) WHERE id = OLD.repost_of_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for shares (reposts)
DROP TRIGGER IF EXISTS update_post_shares_count_trigger ON public.posts;
CREATE TRIGGER update_post_shares_count_trigger
AFTER INSERT OR DELETE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.update_post_shares_count();

-- Fix existing comments counts
UPDATE public.posts p
SET comments_count = (SELECT COUNT(*) FROM public.comments c WHERE c.post_id = p.id);

-- Fix existing shares counts
UPDATE public.posts p
SET shares_count = (SELECT COUNT(*) FROM public.posts r WHERE r.repost_of_id = p.id);