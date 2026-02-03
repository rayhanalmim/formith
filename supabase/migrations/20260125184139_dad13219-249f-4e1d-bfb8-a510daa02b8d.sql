-- Create dm-media bucket if it doesn't exist, or add policies for post-media bucket for dm-media folder
-- First, let's create a dedicated dm-media bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('dm-media', 'dm-media', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for dm-media bucket
CREATE POLICY "Authenticated users can upload dm media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'dm-media');

CREATE POLICY "Anyone can view dm media"
ON storage.objects FOR SELECT
USING (bucket_id = 'dm-media');

CREATE POLICY "Users can delete their own dm media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'dm-media' AND auth.uid()::text = (storage.foldername(name))[1]);