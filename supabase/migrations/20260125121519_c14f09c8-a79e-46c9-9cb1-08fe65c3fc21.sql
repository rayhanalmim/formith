-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to notify on new like
CREATE OR REPLACE FUNCTION public.create_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id uuid;
  liker_name text;
BEGIN
  -- Get the post owner
  SELECT user_id INTO post_owner_id FROM public.posts WHERE id = NEW.post_id;
  
  -- Don't notify if liking own post
  IF post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get liker display name
  SELECT COALESCE(display_name, username, 'Someone') INTO liker_name 
  FROM public.profiles WHERE user_id = NEW.user_id;
  
  -- Create notification
  INSERT INTO public.notifications (user_id, type, title, title_ar, message, message_ar, data)
  VALUES (
    post_owner_id,
    'like',
    'New Like',
    'إعجاب جديد',
    liker_name || ' liked your post',
    liker_name || ' أعجب بمنشورك',
    jsonb_build_object('post_id', NEW.post_id, 'user_id', NEW.user_id)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to notify on new comment
CREATE OR REPLACE FUNCTION public.create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id uuid;
  commenter_name text;
BEGIN
  -- Get the post owner
  SELECT user_id INTO post_owner_id FROM public.posts WHERE id = NEW.post_id;
  
  -- Don't notify if commenting on own post
  IF post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get commenter display name
  SELECT COALESCE(display_name, username, 'Someone') INTO commenter_name 
  FROM public.profiles WHERE user_id = NEW.user_id;
  
  -- Create notification
  INSERT INTO public.notifications (user_id, type, title, title_ar, message, message_ar, data)
  VALUES (
    post_owner_id,
    'comment',
    'New Comment',
    'تعليق جديد',
    commenter_name || ' commented on your post',
    commenter_name || ' علق على منشورك',
    jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id, 'user_id', NEW.user_id)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to notify on new follow
CREATE OR REPLACE FUNCTION public.create_follow_notification()
RETURNS TRIGGER AS $$
DECLARE
  follower_name text;
BEGIN
  -- Get follower display name
  SELECT COALESCE(display_name, username, 'Someone') INTO follower_name 
  FROM public.profiles WHERE user_id = NEW.follower_id;
  
  -- Create notification
  INSERT INTO public.notifications (user_id, type, title, title_ar, message, message_ar, data)
  VALUES (
    NEW.following_id,
    'follow',
    'New Follower',
    'متابع جديد',
    follower_name || ' started following you',
    follower_name || ' بدأ بمتابعتك',
    jsonb_build_object('user_id', NEW.follower_id)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers
CREATE TRIGGER on_like_created
  AFTER INSERT ON public.likes
  FOR EACH ROW
  WHEN (NEW.post_id IS NOT NULL)
  EXECUTE FUNCTION public.create_like_notification();

CREATE TRIGGER on_comment_created
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.create_comment_notification();

CREATE TRIGGER on_follow_created
  AFTER INSERT ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.create_follow_notification();