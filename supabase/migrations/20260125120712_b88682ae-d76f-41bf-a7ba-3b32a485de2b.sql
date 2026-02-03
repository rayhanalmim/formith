-- Create a trigger to automatically assign admin role to support@tahweel.io
CREATE OR REPLACE FUNCTION public.assign_admin_to_owner()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the new user is the owner email
    IF NEW.email = 'support@tahweel.io' THEN
        -- Update their role to admin
        UPDATE public.user_roles 
        SET role = 'admin' 
        WHERE user_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on auth.users for new signups
CREATE TRIGGER on_owner_signup
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.assign_admin_to_owner();