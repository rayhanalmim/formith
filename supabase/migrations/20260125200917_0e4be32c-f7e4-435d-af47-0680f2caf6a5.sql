-- Add deleted_at column to conversation_participants to track per-user deletion
ALTER TABLE public.conversation_participants
ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;

-- Create an index for efficient querying
CREATE INDEX idx_conversation_participants_deleted_at ON public.conversation_participants(user_id, deleted_at);

-- Update the delete_conversation_messages function to just mark the participant's deleted_at
CREATE OR REPLACE FUNCTION public.delete_conversation_for_user(p_conversation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  -- Verify user is a participant in this conversation
  IF NOT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = p_conversation_id
    AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Not a participant in this conversation';
  END IF;
  
  -- Mark the conversation as deleted for this user only
  UPDATE conversation_participants
  SET deleted_at = now()
  WHERE conversation_id = p_conversation_id
  AND user_id = current_user_id;
END;
$$;