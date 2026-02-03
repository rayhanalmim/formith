-- Fix infinite recursion in conversation_participants RLS policy
-- First drop the problematic policy
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;

-- Create a security definer function to check conversation membership
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE user_id = _user_id
      AND conversation_id = _conversation_id
  )
$$;

-- Create new policy using the security definer function
CREATE POLICY "Users can view participants of their conversations" 
ON public.conversation_participants
FOR SELECT
USING (
  user_id = auth.uid() OR
  public.is_conversation_participant(auth.uid(), conversation_id)
);