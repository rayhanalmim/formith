-- Add UPDATE policy for message_reads to allow upsert operations
CREATE POLICY "Users can update their own read receipts"
ON public.message_reads
FOR UPDATE
USING (auth.uid() = user_id AND EXISTS (
  SELECT 1 FROM messages m
  JOIN room_members rm ON rm.room_id = m.room_id
  WHERE m.id = message_reads.message_id
  AND rm.user_id = auth.uid()
));