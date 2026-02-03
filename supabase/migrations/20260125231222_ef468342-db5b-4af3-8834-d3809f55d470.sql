-- Add foreign key from messages.user_id to profiles.user_id for PostgREST join support
ALTER TABLE public.messages
ADD CONSTRAINT messages_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;