-- Add privacy setting for joined date
ALTER TABLE public.profiles 
ADD COLUMN show_joined_date boolean DEFAULT true;