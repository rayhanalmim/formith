-- Add foreign key from user_roles.user_id to profiles.user_id
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add foreign key from reports.reporter_id to profiles.user_id
ALTER TABLE public.reports 
ADD CONSTRAINT reports_reporter_id_profiles_fkey 
FOREIGN KEY (reporter_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;