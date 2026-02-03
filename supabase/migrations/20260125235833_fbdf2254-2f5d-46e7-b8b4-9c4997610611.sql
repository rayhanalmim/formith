-- Create security definer function to check if user can access message reads
CREATE OR REPLACE FUNCTION public.can_access_message_reads(_user_id uuid, _message_id uuid)
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

-- Drop and recreate the UPDATE policy for message_reads using the security definer function
DROP POLICY IF EXISTS "Users can update their own read receipts" ON public.message_reads;

CREATE POLICY "Users can update their own read receipts"
ON public.message_reads
FOR UPDATE
USING (
  auth.uid() = user_id 
  AND can_access_message_reads(auth.uid(), message_id)
);

-- Also update the INSERT policy to use the same function for consistency
DROP POLICY IF EXISTS "Users can mark messages as read" ON public.message_reads;

CREATE POLICY "Users can mark messages as read"
ON public.message_reads
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND can_access_message_reads(auth.uid(), message_id)
);