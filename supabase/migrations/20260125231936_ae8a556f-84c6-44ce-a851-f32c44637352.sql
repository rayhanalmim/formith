-- Add is_pinned column to messages table for pinned messages feature
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS pinned_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS pinned_by uuid;

-- Create message_reads table for read receipts
CREATE TABLE IF NOT EXISTS public.message_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  read_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Enable RLS on message_reads
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_reads
-- Room members can view read receipts
CREATE POLICY "Room members can view read receipts"
ON public.message_reads FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM messages m
    JOIN room_members rm ON rm.room_id = m.room_id
    WHERE m.id = message_reads.message_id
    AND rm.user_id = auth.uid()
  )
);

-- Users can mark messages as read
CREATE POLICY "Users can mark messages as read"
ON public.message_reads FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM messages m
    JOIN room_members rm ON rm.room_id = m.room_id
    WHERE m.id = message_reads.message_id
    AND rm.user_id = auth.uid()
  )
);

-- Enable realtime for message_reads
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reads;