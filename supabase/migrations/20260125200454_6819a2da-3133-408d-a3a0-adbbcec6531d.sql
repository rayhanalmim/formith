-- Create a security definer function to delete conversation messages
-- This bypasses RLS for the specific operation of marking messages as deleted
CREATE OR REPLACE FUNCTION public.delete_conversation_messages(p_conversation_id uuid)
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
  
  -- Mark all messages in the conversation as deleted
  UPDATE direct_messages
  SET is_deleted = true, content = ''
  WHERE conversation_id = p_conversation_id;
END;
$$;

-- Create a function to bulk delete specific messages
CREATE OR REPLACE FUNCTION public.bulk_delete_messages(p_message_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  msg_conversation_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  -- Get the conversation_id from the first message and verify participant
  SELECT conversation_id INTO msg_conversation_id
  FROM direct_messages
  WHERE id = p_message_ids[1];
  
  IF NOT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = msg_conversation_id
    AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Not a participant in this conversation';
  END IF;
  
  -- Mark the specified messages as deleted
  UPDATE direct_messages
  SET is_deleted = true, content = ''
  WHERE id = ANY(p_message_ids);
END;
$$;