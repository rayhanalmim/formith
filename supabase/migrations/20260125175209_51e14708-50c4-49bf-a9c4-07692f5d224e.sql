-- Create function to send notification when someone reposts a post
CREATE OR REPLACE FUNCTION public.create_repost_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  original_post_owner_id uuid;
  original_post_slug text;
  reposter_name text;
BEGIN
  -- Only process reposts (posts with repost_of_id)
  IF NEW.repost_of_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get the original post owner and slug
  SELECT user_id, slug INTO original_post_owner_id, original_post_slug 
  FROM public.posts WHERE id = NEW.repost_of_id;
  
  -- Don't notify if reposting own post
  IF original_post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get reposter display name
  SELECT COALESCE(display_name, username, 'Someone') INTO reposter_name 
  FROM public.profiles WHERE user_id = NEW.user_id;
  
  -- Create notification with post_slug for proper routing
  INSERT INTO public.notifications (user_id, type, title, title_ar, message, message_ar, data)
  VALUES (
    original_post_owner_id,
    'repost',
    'Post Reposted',
    'تمت إعادة نشر منشورك',
    reposter_name || ' reposted your post',
    reposter_name || ' أعاد نشر منشورك',
    jsonb_build_object(
      'post_id', NEW.repost_of_id, 
      'post_slug', original_post_slug, 
      'repost_id', NEW.id,
      'user_id', NEW.user_id,
      'is_quote', NEW.quote_content IS NOT NULL
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for repost notifications
DROP TRIGGER IF EXISTS on_repost_created ON public.posts;
CREATE TRIGGER on_repost_created
  AFTER INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.create_repost_notification();