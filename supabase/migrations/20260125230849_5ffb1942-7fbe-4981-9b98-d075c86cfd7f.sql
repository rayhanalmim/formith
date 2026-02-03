-- Drop existing policies for messages and room_members
DROP POLICY IF EXISTS "Room members can send messages" ON public.messages;
DROP POLICY IF EXISTS "Room members can view messages" ON public.messages;
DROP POLICY IF EXISTS "Room members are viewable by room members" ON public.room_members;

-- Create updated policies that allow admins/managers to access all rooms

-- Messages: Allow admins/managers to view all messages
CREATE POLICY "Room members or admins can view messages" 
ON public.messages 
FOR SELECT 
USING (
  is_room_member(auth.uid(), room_id) 
  OR is_admin_or_manager(auth.uid())
);

-- Messages: Allow admins/managers to send messages without being a member
CREATE POLICY "Room members or admins can send messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) 
  AND (
    (EXISTS (
      SELECT 1 FROM room_members
      WHERE room_members.room_id = messages.room_id 
      AND room_members.user_id = auth.uid() 
      AND (room_members.is_muted = false OR room_members.muted_until < now())
    ))
    OR is_admin_or_manager(auth.uid())
  )
);

-- Room members: Allow admins/managers to view all members
CREATE POLICY "Room members or admins can view members" 
ON public.room_members 
FOR SELECT 
USING (
  is_room_member(auth.uid(), room_id) 
  OR is_admin_or_manager(auth.uid())
);