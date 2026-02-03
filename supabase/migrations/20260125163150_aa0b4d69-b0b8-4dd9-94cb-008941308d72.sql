-- Update create_like_notification to include post_slug
CREATE OR REPLACE FUNCTION public.create_like_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  post_owner_id uuid;
  post_slug_val text;
  liker_name text;
BEGIN
  -- Get the post owner and slug
  SELECT user_id, slug INTO post_owner_id, post_slug_val FROM public.posts WHERE id = NEW.post_id;
  
  -- Don't notify if liking own post
  IF post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get liker display name
  SELECT COALESCE(display_name, username, 'Someone') INTO liker_name 
  FROM public.profiles WHERE user_id = NEW.user_id;
  
  -- Create notification with post_slug for proper routing
  INSERT INTO public.notifications (user_id, type, title, title_ar, message, message_ar, data)
  VALUES (
    post_owner_id,
    'like',
    'New Like',
    'إعجاب جديد',
    liker_name || ' liked your post',
    liker_name || ' أعجب بمنشورك',
    jsonb_build_object('post_id', NEW.post_id, 'post_slug', post_slug_val, 'user_id', NEW.user_id)
  );
  
  RETURN NEW;
END;
$function$;

-- Update create_comment_notification to include post_slug
CREATE OR REPLACE FUNCTION public.create_comment_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  post_owner_id uuid;
  post_slug_val text;
  commenter_name text;
BEGIN
  -- Get the post owner and slug
  SELECT user_id, slug INTO post_owner_id, post_slug_val FROM public.posts WHERE id = NEW.post_id;
  
  -- Don't notify if commenting on own post
  IF post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get commenter display name
  SELECT COALESCE(display_name, username, 'Someone') INTO commenter_name 
  FROM public.profiles WHERE user_id = NEW.user_id;
  
  -- Create notification with post_slug for proper routing
  INSERT INTO public.notifications (user_id, type, title, title_ar, message, message_ar, data)
  VALUES (
    post_owner_id,
    'comment',
    'New Comment',
    'تعليق جديد',
    commenter_name || ' commented on your post',
    commenter_name || ' علق على منشورك',
    jsonb_build_object('post_id', NEW.post_id, 'post_slug', post_slug_val, 'comment_id', NEW.id, 'user_id', NEW.user_id)
  );
  
  RETURN NEW;
END;
$function$;

-- Update create_mention_notifications to include post_slug
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
  post_slug_val text;
  comment_id_val uuid;
BEGIN
  -- Determine if this is a post or comment
  IF TG_TABLE_NAME = 'posts' THEN
    notification_type := 'mention_post';
    post_id_val := NEW.id;
    post_slug_val := NEW.slug;
    comment_id_val := NULL;
  ELSE
    notification_type := 'mention_comment';
    post_id_val := NEW.post_id;
    -- Get the post slug
    SELECT slug INTO post_slug_val FROM public.posts WHERE id = NEW.post_id;
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
          'post_slug', post_slug_val,
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