-- Add foreign key references for room_invites to enable joins
ALTER TABLE public.room_invites 
ADD CONSTRAINT room_invites_invited_user_id_fkey 
FOREIGN KEY (invited_user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.room_invites 
ADD CONSTRAINT room_invites_invited_by_fkey 
FOREIGN KEY (invited_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;