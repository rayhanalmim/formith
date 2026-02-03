-- Add media columns and is_deleted to direct_messages
ALTER TABLE public.direct_messages
ADD COLUMN IF NOT EXISTS media_url text,
ADD COLUMN IF NOT EXISTS media_type text,
ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;

-- Update RLS policy for delete (soft delete via update)
DROP POLICY IF EXISTS "Users can update their own messages" ON public.direct_messages;

CREATE POLICY "Users can update their own messages"
ON public.direct_messages
FOR UPDATE
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

-- Update SELECT policy to exclude deleted messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.direct_messages;

CREATE POLICY "Users can view messages in their conversations"
ON public.direct_messages
FOR SELECT
USING (
  (is_deleted = false OR is_deleted IS NULL) AND
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = direct_messages.conversation_id
    AND conversation_participants.user_id = auth.uid()
  )
);