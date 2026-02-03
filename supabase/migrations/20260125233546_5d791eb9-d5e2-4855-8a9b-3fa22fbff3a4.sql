-- Create function to notify user when they become a room moderator
CREATE OR REPLACE FUNCTION public.notify_room_moderator_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  room_name_val text;
  assigner_name text;
BEGIN
  -- Only trigger on INSERT or UPDATE where role changes to 'moderator'
  IF (TG_OP = 'INSERT' AND NEW.role = 'moderator') OR 
     (TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role AND NEW.role = 'moderator') THEN
    
    -- Get room name
    SELECT name INTO room_name_val FROM public.rooms WHERE id = NEW.room_id;
    
    -- Get who assigned the role (could be admin or room creator)
    SELECT COALESCE(display_name, username, 'Admin') INTO assigner_name
    FROM public.profiles
    WHERE user_id = auth.uid();
    
    -- Create notification for the user who became moderator
    INSERT INTO public.notifications (user_id, type, title, title_ar, message, message_ar, data)
    VALUES (
      NEW.user_id,
      'room_moderator',
      'You are now a room moderator',
      'أصبحت مشرف غرفة',
      'You have been assigned as a moderator in "' || room_name_val || '"',
      'تم تعيينك مشرفاً في غرفة "' || room_name_val || '"',
      jsonb_build_object(
        'room_id', NEW.room_id,
        'room_name', room_name_val,
        'assigned_by', auth.uid()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for room moderator assignments
DROP TRIGGER IF EXISTS on_room_moderator_assignment ON public.room_members;
CREATE TRIGGER on_room_moderator_assignment
  AFTER INSERT OR UPDATE ON public.room_members
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_room_moderator_assignment();