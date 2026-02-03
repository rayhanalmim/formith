-- Allow users to read profile_visibility of other users for access control
CREATE POLICY "Users can view others profile visibility" 
ON public.user_settings 
FOR SELECT 
USING (true);