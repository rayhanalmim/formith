-- Add audio_url column to stories table for background music
ALTER TABLE public.stories ADD COLUMN audio_url TEXT DEFAULT NULL;