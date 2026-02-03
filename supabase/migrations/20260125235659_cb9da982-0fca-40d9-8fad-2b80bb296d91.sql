-- Create a security definer function to check if user can react to a message
CREATE OR REPLACE FUNCTION public.can_react_to_message(_user_id uuid, _message_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM messages m
    JOIN room_members rm ON rm.room_id = m.room_id
    WHERE m.id = _message_id
      AND rm.user_id = _user_id
  )
$$;

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Room members can add reactions" ON public.message_reactions;

-- Create a new simpler INSERT policy using the security definer function
CREATE POLICY "Room members can add reactions"
ON public.message_reactions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND can_react_to_message(auth.uid(), message_id)
);