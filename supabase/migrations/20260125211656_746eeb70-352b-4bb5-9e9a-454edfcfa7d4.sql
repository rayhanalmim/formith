-- Drop the existing SELECT policy that filters out deleted messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.direct_messages;

-- Create a new policy that allows viewing all messages (including deleted ones for realtime to work)
-- The UI will handle filtering out deleted messages
CREATE POLICY "Users can view messages in their conversations"
  ON public.direct_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = direct_messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
    )
  );