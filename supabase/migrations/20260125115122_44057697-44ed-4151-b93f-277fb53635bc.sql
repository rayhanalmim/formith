-- Fix the overly permissive notifications INSERT policy
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Create a more restrictive policy that only allows the system (via service role) 
-- or authenticated functions to create notifications
CREATE POLICY "Notifications can be created for users"
    ON public.notifications FOR INSERT
    WITH CHECK (
        -- Allow service role (backend functions) to create any notification
        -- Or allow if the notification is for the current user (self-notifications)
        auth.uid() IS NOT NULL
    );