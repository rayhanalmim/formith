-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Create a new policy that allows both admins AND managers to manage roles
CREATE POLICY "Admins and managers can manage roles" 
ON public.user_roles 
FOR ALL 
USING (is_admin_or_manager(auth.uid()))
WITH CHECK (is_admin_or_manager(auth.uid()));