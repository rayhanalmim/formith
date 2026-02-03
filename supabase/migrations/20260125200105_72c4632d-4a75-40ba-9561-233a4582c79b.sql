-- Add foreign key from direct_messages.sender_id to profiles (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'direct_messages_sender_id_fkey'
  ) THEN
    ALTER TABLE public.direct_messages
    ADD CONSTRAINT direct_messages_sender_id_fkey 
    FOREIGN KEY (sender_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
END $$;

-- Drop and recreate the UPDATE policy to properly allow message deletion
DROP POLICY IF EXISTS "Participants can update messages" ON public.direct_messages;

CREATE POLICY "Participants can update messages"
ON public.direct_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = direct_messages.conversation_id
    AND conversation_participants.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = direct_messages.conversation_id
    AND conversation_participants.user_id = auth.uid()
  )
);