-- Create a security definer function for single message deletion
CREATE OR REPLACE FUNCTION public.delete_single_message(p_message_id uuid)
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
  
  -- Get the conversation_id from the message and verify participant
  SELECT conversation_id INTO msg_conversation_id
  FROM direct_messages
  WHERE id = p_message_id;
  
  IF NOT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = msg_conversation_id
    AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Not a participant in this conversation';
  END IF;
  
  -- Mark the message as deleted
  UPDATE direct_messages
  SET is_deleted = true, content = ''
  WHERE id = p_message_id;
END;
$$;