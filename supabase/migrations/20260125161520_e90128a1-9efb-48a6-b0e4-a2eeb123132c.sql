-- Update the follow notification trigger to include username in the data
CREATE OR REPLACE FUNCTION public.create_follow_notification()
RETURNS TRIGGER AS $$
DECLARE
  follower_name text;
  follower_username text;
BEGIN
  -- Get follower display name and username
  SELECT COALESCE(display_name, username, 'Someone'), username 
  INTO follower_name, follower_username 
  FROM public.profiles WHERE user_id = NEW.follower_id;
  
  -- Create notification with username for proper routing
  INSERT INTO public.notifications (user_id, type, title, title_ar, message, message_ar, data)
  VALUES (
    NEW.following_id,
    'follow',
    'New Follower',
    'متابع جديد',
    follower_name || ' started following you',
    follower_name || ' بدأ بمتابعتك',
    jsonb_build_object('user_id', NEW.follower_id, 'username', follower_username)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;