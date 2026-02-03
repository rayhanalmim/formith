-- Drop existing insert policy
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;

-- Create new insert policy that restricts announcements and news categories to admins/managers
CREATE POLICY "Authenticated users can create posts" 
ON public.posts 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND (
    -- If posting to announcements or news, must be admin or manager
    CASE 
      WHEN category_id IN (
        SELECT id FROM public.categories WHERE slug IN ('announcements', 'news')
      ) THEN is_admin_or_manager(auth.uid())
      ELSE true
    END
  )
);