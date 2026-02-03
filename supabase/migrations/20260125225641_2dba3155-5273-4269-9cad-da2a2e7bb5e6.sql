-- Create function to notify poll owner when someone votes
CREATE OR REPLACE FUNCTION public.create_poll_vote_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  poll_owner_id uuid;
  post_id_val uuid;
  post_slug_val text;
  poll_question text;
  voter_name text;
  option_text text;
BEGIN
  -- Get the poll details and post owner
  SELECT pp.question, p.user_id, p.id, p.slug
  INTO poll_question, poll_owner_id, post_id_val, post_slug_val
  FROM post_polls pp
  JOIN posts p ON p.id = pp.post_id
  WHERE pp.id = NEW.poll_id;
  
  -- Don't notify if voting on own poll
  IF poll_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get voter display name
  SELECT COALESCE(display_name, username, 'Someone') INTO voter_name 
  FROM public.profiles WHERE user_id = NEW.user_id;
  
  -- Get the option text that was voted for
  SELECT text INTO option_text
  FROM public.poll_options WHERE id = NEW.option_id;
  
  -- Create notification
  INSERT INTO public.notifications (user_id, type, title, title_ar, message, message_ar, data)
  VALUES (
    poll_owner_id,
    'poll_vote',
    'New Poll Vote',
    'تصويت جديد',
    voter_name || ' voted on your poll',
    voter_name || ' صوّت على استطلاعك',
    jsonb_build_object(
      'post_id', post_id_val,
      'post_slug', post_slug_val,
      'poll_id', NEW.poll_id,
      'poll_question', poll_question,
      'option_text', option_text,
      'voter_id', NEW.user_id
    )
  );
  
  RETURN NEW;
END;
$function$;

-- Create trigger for poll vote notifications
DROP TRIGGER IF EXISTS on_poll_vote_notify ON public.poll_votes;
CREATE TRIGGER on_poll_vote_notify
  AFTER INSERT ON public.poll_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.create_poll_vote_notification();