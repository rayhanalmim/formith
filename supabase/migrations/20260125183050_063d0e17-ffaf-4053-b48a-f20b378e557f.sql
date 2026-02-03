-- Create function to update category posts count
CREATE OR REPLACE FUNCTION public.update_category_posts_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Only count approved and visible posts
        IF NEW.category_id IS NOT NULL AND NEW.is_approved = true AND NEW.is_hidden = false THEN
            UPDATE public.categories SET posts_count = posts_count + 1 WHERE id = NEW.category_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.category_id IS NOT NULL AND OLD.is_approved = true AND OLD.is_hidden = false THEN
            UPDATE public.categories SET posts_count = GREATEST(0, posts_count - 1) WHERE id = OLD.category_id;
        END IF;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle category change
        IF OLD.category_id IS DISTINCT FROM NEW.category_id THEN
            -- Decrement old category if post was visible
            IF OLD.category_id IS NOT NULL AND OLD.is_approved = true AND OLD.is_hidden = false THEN
                UPDATE public.categories SET posts_count = GREATEST(0, posts_count - 1) WHERE id = OLD.category_id;
            END IF;
            -- Increment new category if post is visible
            IF NEW.category_id IS NOT NULL AND NEW.is_approved = true AND NEW.is_hidden = false THEN
                UPDATE public.categories SET posts_count = posts_count + 1 WHERE id = NEW.category_id;
            END IF;
        -- Handle visibility/approval changes within same category
        ELSIF NEW.category_id IS NOT NULL THEN
            IF (OLD.is_approved = false OR OLD.is_hidden = true) AND (NEW.is_approved = true AND NEW.is_hidden = false) THEN
                UPDATE public.categories SET posts_count = posts_count + 1 WHERE id = NEW.category_id;
            ELSIF (OLD.is_approved = true AND OLD.is_hidden = false) AND (NEW.is_approved = false OR NEW.is_hidden = true) THEN
                UPDATE public.categories SET posts_count = GREATEST(0, posts_count - 1) WHERE id = NEW.category_id;
            END IF;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$;

-- Create trigger for category posts count
CREATE TRIGGER update_category_posts_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.update_category_posts_count();

-- Sync existing category posts counts
UPDATE public.categories c
SET posts_count = (
    SELECT COUNT(*) FROM public.posts p 
    WHERE p.category_id = c.id 
    AND p.is_approved = true 
    AND p.is_hidden = false
);