-- Create function to handle post approval based on category settings
CREATE OR REPLACE FUNCTION public.set_post_approval_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  category_requires_approval boolean;
BEGIN
  -- If no category, post is auto-approved
  IF NEW.category_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check if the category requires approval
  SELECT require_approval INTO category_requires_approval
  FROM public.categories
  WHERE id = NEW.category_id;
  
  -- If category requires approval and user is NOT admin/manager, set is_approved to false
  IF category_requires_approval = true AND NOT is_admin_or_manager(NEW.user_id) THEN
    NEW.is_approved := false;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to run BEFORE INSERT on posts
DROP TRIGGER IF EXISTS set_post_approval_on_insert ON public.posts;
CREATE TRIGGER set_post_approval_on_insert
  BEFORE INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_post_approval_status();