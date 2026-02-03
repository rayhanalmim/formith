-- Fix infinite recursion in room_members RLS policy
DROP POLICY IF EXISTS "Room members are viewable by room members" ON public.room_members;

CREATE POLICY "Room members are viewable by room members"
ON public.room_members
FOR SELECT
USING (
  room_id IN (
    SELECT rm.room_id FROM public.room_members rm WHERE rm.user_id = auth.uid()
  )
  OR is_admin_or_manager(auth.uid())
);

-- Fix infinite recursion in rooms RLS policy
DROP POLICY IF EXISTS "Public rooms are viewable by everyone" ON public.rooms;

CREATE POLICY "Public rooms are viewable by everyone"
ON public.rooms
FOR SELECT
USING (
  is_public = true
  OR id IN (
    SELECT rm.room_id FROM public.room_members rm WHERE rm.user_id = auth.uid()
  )
  OR is_admin_or_manager(auth.uid())
);