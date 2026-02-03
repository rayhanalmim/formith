-- Create dm_reactions table for direct message emoji reactions
CREATE TABLE public.dm_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES public.direct_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS
ALTER TABLE public.dm_reactions ENABLE ROW LEVEL SECURITY;

-- Participants can view reactions in their conversations
CREATE POLICY "Participants can view dm reactions"
ON public.dm_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM direct_messages dm
    JOIN conversation_participants cp ON cp.conversation_id = dm.conversation_id
    WHERE dm.id = dm_reactions.message_id AND cp.user_id = auth.uid()
  )
);

-- Users can add reactions to messages in their conversations
CREATE POLICY "Participants can add dm reactions"
ON public.dm_reactions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM direct_messages dm
    JOIN conversation_participants cp ON cp.conversation_id = dm.conversation_id
    WHERE dm.id = dm_reactions.message_id AND cp.user_id = auth.uid()
  )
);

-- Users can remove their own reactions
CREATE POLICY "Users can remove their own dm reactions"
ON public.dm_reactions
FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for dm_reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.dm_reactions;

-- Add DELETE policy for conversation_participants so users can leave/delete conversations
CREATE POLICY "Users can leave conversations"
ON public.conversation_participants
FOR DELETE
USING (user_id = auth.uid());

-- Add DELETE policy for conversations (for when user deletes entire conversation)
CREATE POLICY "Participants can delete conversations"
ON public.conversations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = conversations.id
    AND conversation_participants.user_id = auth.uid()
  )
);