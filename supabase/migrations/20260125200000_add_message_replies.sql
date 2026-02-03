-- Add reply fields to direct_messages table
ALTER TABLE public.direct_messages
ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.direct_messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS reply_content text,
ADD COLUMN IF NOT EXISTS reply_sender_id uuid,
ADD COLUMN IF NOT EXISTS reply_sender_username text,
ADD COLUMN IF NOT EXISTS reply_sender_display_name text;

-- Create index for reply performance
CREATE INDEX IF NOT EXISTS idx_direct_messages_reply_to_id ON public.direct_messages(reply_to_id);

-- Update RLS policy to include reply fields in SELECT
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

-- Enable realtime for reply fields
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
