-- Add foreign key reference from direct_messages to profiles for sender
ALTER TABLE public.direct_messages 
ADD CONSTRAINT direct_messages_sender_id_profiles_fkey 
FOREIGN KEY (sender_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;