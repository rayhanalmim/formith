-- Drop and recreate the function to fix the deleted_at issue
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    conv_id uuid;
    current_user_id uuid;
BEGIN
    current_user_id := auth.uid();
    
    -- Find existing conversation between the two users
    SELECT cp1.conversation_id INTO conv_id
    FROM conversation_participants cp1
    INNER JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
    WHERE cp1.user_id = current_user_id
    AND cp2.user_id = other_user_id
    AND (
        SELECT COUNT(*) FROM conversation_participants cp3
        WHERE cp3.conversation_id = cp1.conversation_id
    ) = 2
    LIMIT 1;
    
    -- If no conversation exists, create one
    IF conv_id IS NULL THEN
        INSERT INTO conversations DEFAULT VALUES RETURNING id INTO conv_id;
        
        INSERT INTO conversation_participants (conversation_id, user_id)
        VALUES (conv_id, current_user_id), (conv_id, other_user_id);
    ELSE
        -- Clear deleted_at for both participants so the conversation is visible again
        UPDATE conversation_participants 
        SET deleted_at = NULL
        WHERE conversation_id = conv_id
        AND deleted_at IS NOT NULL;
        
        -- Update the conversation's last_message_at to now
        UPDATE conversations 
        SET last_message_at = now(), updated_at = now()
        WHERE id = conv_id;
    END IF;
    
    RETURN conv_id;
END;
$$;