-- Update handle_new_user to generate cleaner usernames from email prefix
-- If username exists, append incrementing number
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    is_owner boolean;
    is_ceo boolean;
    base_username text;
    final_username text;
    counter integer := 0;
BEGIN
    is_owner := NEW.email = 'support@tahweel.io';
    is_ceo := NEW.email = 'ceo@tahweel.io';
    
    -- Extract username from email (part before @)
    base_username := LOWER(SPLIT_PART(NEW.email, '@', 1));
    -- Replace any non-alphanumeric characters except dots and underscores with underscore
    base_username := REGEXP_REPLACE(base_username, '[^a-z0-9._]', '_', 'g');
    -- Remove leading/trailing underscores and dots
    base_username := TRIM(BOTH '._' FROM base_username);
    
    -- Ensure minimum length
    IF LENGTH(base_username) < 3 THEN
        base_username := base_username || '_user';
    END IF;
    
    -- Try the base username first
    final_username := base_username;
    
    -- Check for uniqueness and append number if needed
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
        counter := counter + 1;
        final_username := base_username || counter::text;
    END LOOP;
    
    INSERT INTO public.profiles (user_id, username, display_name, is_verified)
    VALUES (
        NEW.id,
        final_username,
        SPLIT_PART(NEW.email, '@', 1),
        is_owner OR is_ceo
    );
    
    -- Assign roles based on email
    IF is_owner THEN
        INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
    ELSIF is_ceo THEN
        INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'manager');
    ELSE
        INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
    END IF;
    
    RETURN NEW;
END;
$function$;