-- Add foreign key reference from room_members to profiles to enable joins
ALTER TABLE public.room_members 
ADD CONSTRAINT room_members_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;