-- First, drop the problematic policies causing infinite recursion
DROP POLICY IF EXISTS "Room members are viewable by room members" ON public.room_members;

-- Create a security definer function to check room membership without causing recursion
CREATE OR REPLACE FUNCTION public.is_room_member(_user_id uuid, _room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.room_members
    WHERE user_id = _user_id
      AND room_id = _room_id
  )
$$;

-- Create room_invites table for private room invitations
CREATE TABLE IF NOT EXISTS public.room_invites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    invited_user_id uuid NOT NULL,
    invited_by uuid NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at timestamptz NOT NULL DEFAULT now(),
    responded_at timestamptz,
    UNIQUE(room_id, invited_user_id)
);

-- Enable RLS on room_invites
ALTER TABLE public.room_invites ENABLE ROW LEVEL SECURITY;

-- RLS policies for room_invites
CREATE POLICY "Users can view their own invites"
ON public.room_invites FOR SELECT
USING (invited_user_id = auth.uid() OR invited_by = auth.uid() OR is_admin_or_manager(auth.uid()));

CREATE POLICY "Room admins can create invites"
ON public.room_invites FOR INSERT
WITH CHECK (
    invited_by = auth.uid() AND
    (
        -- Room creator can invite
        EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND created_by = auth.uid())
        OR
        -- Room admin/moderator can invite
        is_room_member(auth.uid(), room_id)
        OR
        is_admin_or_manager(auth.uid())
    )
);

CREATE POLICY "Users can update their own invites"
ON public.room_invites FOR UPDATE
USING (invited_user_id = auth.uid());

CREATE POLICY "Inviters can delete invites"
ON public.room_invites FOR DELETE
USING (invited_by = auth.uid() OR is_admin_or_manager(auth.uid()));

-- Fix room_members SELECT policy using the security definer function
CREATE POLICY "Room members are viewable by room members"
ON public.room_members FOR SELECT
USING (
    is_room_member(auth.uid(), room_id) 
    OR is_admin_or_manager(auth.uid())
);

-- Update join policy to allow joining private rooms via invitation
DROP POLICY IF EXISTS "Users can join public rooms" ON public.room_members;

CREATE POLICY "Users can join rooms"
ON public.room_members FOR INSERT
WITH CHECK (
    auth.uid() = user_id AND
    (
        -- Can join public rooms
        EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND is_public = true)
        OR
        -- Can join private rooms with accepted invitation
        EXISTS (
            SELECT 1 FROM public.room_invites 
            WHERE room_id = room_members.room_id 
            AND invited_user_id = auth.uid() 
            AND status = 'accepted'
        )
        OR
        -- Room creator can always join
        EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND created_by = auth.uid())
        OR
        is_admin_or_manager(auth.uid())
    )
);

-- Enable realtime for room_invites
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_invites;