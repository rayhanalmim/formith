-- Create a function to check if user is a room moderator
CREATE OR REPLACE FUNCTION public.is_room_moderator(_user_id uuid, _room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.room_members
    WHERE user_id = _user_id
      AND room_id = _room_id
      AND role = 'moderator'
  )
$$;

-- Drop and recreate the messages UPDATE policy to include room moderators
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

CREATE POLICY "Users can delete or pin messages"
ON public.messages
FOR UPDATE
USING (
  (auth.uid() = user_id) 
  OR is_admin_or_manager(auth.uid()) 
  OR is_room_moderator(auth.uid(), room_id)
);