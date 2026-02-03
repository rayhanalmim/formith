-- Create function to extract mentions from content and create notifications
CREATE OR REPLACE FUNCTION public.create_mention_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  mention_match text;
  mentioned_username text;
  mentioned_user_id uuid;
  author_name text;
  notification_type text;
  post_id_val uuid;
  comment_id_val uuid;
BEGIN
  -- Determine if this is a post or comment
  IF TG_TABLE_NAME = 'posts' THEN
    notification_type := 'mention_post';
    post_id_val := NEW.id;
    comment_id_val := NULL;
  ELSE
    notification_type := 'mention_comment';
    post_id_val := NEW.post_id;
    comment_id_val := NEW.id;
  END IF;
  
  -- Get author display name
  SELECT COALESCE(display_name, username, 'Someone') INTO author_name 
  FROM public.profiles WHERE user_id = NEW.user_id;
  
  -- Extract all @mentions from content using regex
  FOR mention_match IN 
    SELECT (regexp_matches(NEW.content, '@([a-zA-Z0-9_]+)', 'g'))[1]
  LOOP
    mentioned_username := mention_match;
    
    -- Find the user with this username
    SELECT user_id INTO mentioned_user_id
    FROM public.profiles 
    WHERE LOWER(username) = LOWER(mentioned_username);
    
    -- Only create notification if user exists and it's not the author
    IF mentioned_user_id IS NOT NULL AND mentioned_user_id != NEW.user_id THEN
      INSERT INTO public.notifications (user_id, type, title, title_ar, message, message_ar, data)
      VALUES (
        mentioned_user_id,
        notification_type,
        'You were mentioned',
        'تم ذكرك',
        author_name || ' mentioned you in a ' || CASE WHEN TG_TABLE_NAME = 'posts' THEN 'post' ELSE 'comment' END,
        author_name || ' ذكرك في ' || CASE WHEN TG_TABLE_NAME = 'posts' THEN 'منشور' ELSE 'تعليق' END,
        jsonb_build_object(
          'post_id', post_id_val,
          'comment_id', comment_id_val,
          'user_id', NEW.user_id,
          'mentioned_username', mentioned_username
        )
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for posts mentions
DROP TRIGGER IF EXISTS on_post_mention ON public.posts;
CREATE TRIGGER on_post_mention
  AFTER INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.create_mention_notifications();

-- Create trigger for comments mentions  
DROP TRIGGER IF EXISTS on_comment_mention ON public.comments;
CREATE TRIGGER on_comment_mention
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.create_mention_notifications();