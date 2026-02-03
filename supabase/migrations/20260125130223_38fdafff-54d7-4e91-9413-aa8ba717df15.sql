-- Add feeling column to posts table for user mood/feeling
ALTER TABLE public.posts 
ADD COLUMN feeling text DEFAULT NULL;