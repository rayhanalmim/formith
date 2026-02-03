-- Create function to update follower/following counts
CREATE OR REPLACE FUNCTION public.update_profile_follow_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment followers_count for the user being followed
        UPDATE public.profiles 
        SET followers_count = followers_count + 1 
        WHERE user_id = NEW.following_id;
        
        -- Increment following_count for the follower
        UPDATE public.profiles 
        SET following_count = following_count + 1 
        WHERE user_id = NEW.follower_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement followers_count for the user being unfollowed
        UPDATE public.profiles 
        SET followers_count = GREATEST(0, followers_count - 1) 
        WHERE user_id = OLD.following_id;
        
        -- Decrement following_count for the unfollower
        UPDATE public.profiles 
        SET following_count = GREATEST(0, following_count - 1) 
        WHERE user_id = OLD.follower_id;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Create trigger for follow counts
CREATE TRIGGER update_profile_follow_counts_trigger
AFTER INSERT OR DELETE ON public.follows
FOR EACH ROW
EXECUTE FUNCTION public.update_profile_follow_counts();