-- Add location column to posts table
ALTER TABLE public.posts 
ADD COLUMN location text DEFAULT NULL;