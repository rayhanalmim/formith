-- Add foreign key reference from conversation_participants to profiles to enable joins
ALTER TABLE public.conversation_participants 
ADD CONSTRAINT conversation_participants_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;