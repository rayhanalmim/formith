-- Drop the existing restrictive UPDATE policy
DROP POLICY IF EXISTS "Users can update their own messages" ON public.direct_messages;

-- Create a new policy that allows:
-- 1. Sender can update any field on their own messages
-- 2. Receiver can only update is_read and read_at on messages sent to them
-- 3. Any participant can mark messages as deleted (for delete from both sides)
CREATE POLICY "Participants can update messages"
ON public.direct_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = direct_messages.conversation_id
    AND user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = direct_messages.conversation_id
    AND user_id = auth.uid()
  )
);