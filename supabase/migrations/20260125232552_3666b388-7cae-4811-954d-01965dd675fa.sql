-- Create function to notify moderators when a new report is filed
CREATE OR REPLACE FUNCTION public.create_report_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  reporter_name text;
  report_type text;
  mod_user_id uuid;
BEGIN
  -- Get reporter display name
  SELECT COALESCE(display_name, username, 'Someone') INTO reporter_name 
  FROM public.profiles WHERE user_id = NEW.reporter_id;
  
  -- Determine report type
  IF NEW.post_id IS NOT NULL THEN
    report_type := 'post';
  ELSIF NEW.comment_id IS NOT NULL THEN
    report_type := 'comment';
  ELSE
    report_type := 'user';
  END IF;
  
  -- Notify all admins, managers, and moderators
  FOR mod_user_id IN 
    SELECT user_id FROM public.user_roles 
    WHERE role IN ('admin', 'manager', 'moderator')
    AND user_id != NEW.reporter_id
  LOOP
    INSERT INTO public.notifications (user_id, type, title, title_ar, message, message_ar, data)
    VALUES (
      mod_user_id,
      'report',
      'New Report',
      'بلاغ جديد',
      reporter_name || ' reported a ' || report_type,
      reporter_name || ' أبلغ عن ' || CASE 
        WHEN report_type = 'post' THEN 'منشور' 
        WHEN report_type = 'comment' THEN 'تعليق' 
        ELSE 'مستخدم' 
      END,
      jsonb_build_object(
        'report_id', NEW.id,
        'report_type', report_type,
        'reporter_id', NEW.reporter_id,
        'post_id', NEW.post_id,
        'comment_id', NEW.comment_id,
        'user_id', NEW.user_id,
        'reason', NEW.reason
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for report notifications
DROP TRIGGER IF EXISTS on_report_created ON public.reports;
CREATE TRIGGER on_report_created
  AFTER INSERT ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.create_report_notification();

-- Create function to notify moderators when a message is deleted by moderator action
CREATE OR REPLACE FUNCTION public.create_moderation_action_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  moderator_name text;
  room_name text;
  message_author_id uuid;
  mod_user_id uuid;
BEGIN
  -- Only trigger when is_deleted changes from false to true
  IF OLD.is_deleted = false AND NEW.is_deleted = true THEN
    -- Get the room name
    SELECT name INTO room_name FROM public.rooms WHERE id = NEW.room_id;
    
    -- The message author should be notified their message was removed
    message_author_id := NEW.user_id;
    
    -- Don't notify if user deleted their own message
    -- We can't easily determine WHO deleted it at DB level, so we skip this notification
    -- The frontend handles moderator-specific actions
    
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$function$;