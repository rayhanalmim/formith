-- Create function to notify when someone likes a comment
CREATE OR REPLACE FUNCTION public.create_comment_like_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  comment_owner_id uuid;
  comment_post_id uuid;
  post_slug_val text;
  liker_name text;
BEGIN
  -- Only process comment likes (not post likes)
  IF NEW.comment_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get the comment owner and post id
  SELECT user_id, post_id INTO comment_owner_id, comment_post_id 
  FROM public.comments WHERE id = NEW.comment_id;
  
  -- Don't notify if liking own comment
  IF comment_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get the post slug for routing
  SELECT slug INTO post_slug_val FROM public.posts WHERE id = comment_post_id;
  
  -- Get liker display name
  SELECT COALESCE(display_name, username, 'Someone') INTO liker_name 
  FROM public.profiles WHERE user_id = NEW.user_id;
  
  -- Create notification
  INSERT INTO public.notifications (user_id, type, title, title_ar, message, message_ar, data)
  VALUES (
    comment_owner_id,
    'comment_like',
    'Comment Liked',
    'إعجاب بتعليقك',
    liker_name || ' liked your comment',
    liker_name || ' أعجب بتعليقك',
    jsonb_build_object('post_id', comment_post_id, 'post_slug', post_slug_val, 'comment_id', NEW.comment_id, 'user_id', NEW.user_id)
  );
  
  RETURN NEW;
END;
$function$;

-- Create trigger for comment likes
DROP TRIGGER IF EXISTS on_comment_like_created ON public.likes;
CREATE TRIGGER on_comment_like_created
  AFTER INSERT ON public.likes
  FOR EACH ROW
  WHEN (NEW.comment_id IS NOT NULL)
  EXECUTE FUNCTION public.create_comment_like_notification();

-- Create function to notify when someone replies to a comment
CREATE OR REPLACE FUNCTION public.create_reply_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  parent_comment_owner_id uuid;
  post_slug_val text;
  replier_name text;
BEGIN
  -- Only process replies (comments with parent_id)
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get the parent comment owner
  SELECT user_id INTO parent_comment_owner_id 
  FROM public.comments WHERE id = NEW.parent_id;
  
  -- Don't notify if replying to own comment
  IF parent_comment_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get the post slug for routing
  SELECT slug INTO post_slug_val FROM public.posts WHERE id = NEW.post_id;
  
  -- Get replier display name
  SELECT COALESCE(display_name, username, 'Someone') INTO replier_name 
  FROM public.profiles WHERE user_id = NEW.user_id;
  
  -- Create notification
  INSERT INTO public.notifications (user_id, type, title, title_ar, message, message_ar, data)
  VALUES (
    parent_comment_owner_id,
    'reply',
    'New Reply',
    'رد جديد',
    replier_name || ' replied to your comment',
    replier_name || ' رد على تعليقك',
    jsonb_build_object('post_id', NEW.post_id, 'post_slug', post_slug_val, 'comment_id', NEW.id, 'parent_id', NEW.parent_id, 'user_id', NEW.user_id)
  );
  
  RETURN NEW;
END;
$function$;

-- Create trigger for replies
DROP TRIGGER IF EXISTS on_reply_created ON public.comments;
CREATE TRIGGER on_reply_created
  AFTER INSERT ON public.comments
  FOR EACH ROW
  WHEN (NEW.parent_id IS NOT NULL)
  EXECUTE FUNCTION public.create_reply_notification();