-- Add edited_at column to track message edits
ALTER TABLE public.direct_messages ADD COLUMN edited_at timestamp with time zone;

-- Create a table to track messages hidden for specific users (delete for me only)
CREATE TABLE public.dm_hidden_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES public.direct_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  hidden_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Enable RLS
ALTER TABLE public.dm_hidden_messages ENABLE ROW LEVEL SECURITY;

-- Users can hide messages for themselves
CREATE POLICY "Users can hide messages for themselves"
ON public.dm_hidden_messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM direct_messages dm
    JOIN conversation_participants cp ON cp.conversation_id = dm.conversation_id
    WHERE dm.id = dm_hidden_messages.message_id
    AND cp.user_id = auth.uid()
  )
);

-- Users can view their own hidden messages
CREATE POLICY "Users can view their hidden messages"
ON public.dm_hidden_messages
FOR SELECT
USING (auth.uid() = user_id);

-- Users can unhide messages
CREATE POLICY "Users can unhide their messages"
ON public.dm_hidden_messages
FOR DELETE
USING (auth.uid() = user_id);

-- Create security definer function to hide message for current user only
CREATE OR REPLACE FUNCTION public.hide_message_for_user(p_message_id uuid)
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
  
  -- Insert into hidden messages table (ignore if already hidden)
  INSERT INTO dm_hidden_messages (message_id, user_id)
  VALUES (p_message_id, current_user_id)
  ON CONFLICT (message_id, user_id) DO NOTHING;
END;
$$;

-- Create security definer function to edit a message (within 15 minutes)
CREATE OR REPLACE FUNCTION public.edit_direct_message(p_message_id uuid, p_new_content text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  msg_sender_id uuid;
  msg_created_at timestamp with time zone;
  time_diff interval;
BEGIN
  current_user_id := auth.uid();
  
  -- Get the message details
  SELECT sender_id, created_at INTO msg_sender_id, msg_created_at
  FROM direct_messages
  WHERE id = p_message_id AND is_deleted = false;
  
  -- Check if message exists
  IF msg_sender_id IS NULL THEN
    RAISE EXCEPTION 'Message not found or already deleted';
  END IF;
  
  -- Check if user is the sender
  IF msg_sender_id != current_user_id THEN
    RAISE EXCEPTION 'You can only edit your own messages';
  END IF;
  
  -- Check time limit (15 minutes)
  time_diff := now() - msg_created_at;
  IF time_diff > interval '15 minutes' THEN
    RAISE EXCEPTION 'Message can only be edited within 15 minutes of sending';
  END IF;
  
  -- Update the message
  UPDATE direct_messages
  SET content = p_new_content, edited_at = now()
  WHERE id = p_message_id;
END;
$$;

-- Create index for faster lookups
CREATE INDEX idx_dm_hidden_messages_user_id ON public.dm_hidden_messages(user_id);
CREATE INDEX idx_dm_hidden_messages_message_id ON public.dm_hidden_messages(message_id);
CREATE INDEX idx_direct_messages_edited_at ON public.direct_messages(edited_at) WHERE edited_at IS NOT NULL;