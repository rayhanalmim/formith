-- Create function to update profile posts count
CREATE OR REPLACE FUNCTION public.update_profile_posts_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.profiles 
        SET posts_count = posts_count + 1 
        WHERE user_id = NEW.user_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.profiles 
        SET posts_count = GREATEST(0, posts_count - 1) 
        WHERE user_id = OLD.user_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle approval/visibility changes
        IF (OLD.is_approved = false OR OLD.is_hidden = true) AND (NEW.is_approved = true AND NEW.is_hidden = false) THEN
            UPDATE public.profiles SET posts_count = posts_count + 1 WHERE user_id = NEW.user_id;
        ELSIF (OLD.is_approved = true AND OLD.is_hidden = false) AND (NEW.is_approved = false OR NEW.is_hidden = true) THEN
            UPDATE public.profiles SET posts_count = GREATEST(0, posts_count - 1) WHERE user_id = NEW.user_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$;

-- Create trigger for posts count
CREATE TRIGGER update_profile_posts_count_trigger
AFTER INSERT OR DELETE OR UPDATE OF is_approved, is_hidden ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.update_profile_posts_count();