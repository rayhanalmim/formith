-- Add media columns to messages table for file/image uploads
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_url text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_type text;

-- Add moderator role to room_members
ALTER TABLE public.room_members ADD COLUMN IF NOT EXISTS role text DEFAULT 'member';

-- Create room-media storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('room-media', 'room-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for room-media bucket
CREATE POLICY "Authenticated users can upload room media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'room-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view room media"
ON storage.objects FOR SELECT
USING (bucket_id = 'room-media');

CREATE POLICY "Users can delete their own room media"
ON storage.objects FOR DELETE
USING (bucket_id = 'room-media' AND auth.uid()::text = (storage.foldername(name))[1]);