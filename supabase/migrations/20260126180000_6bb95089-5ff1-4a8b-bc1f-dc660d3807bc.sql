-- Drop and recreate the function to include privacy check
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    conv_id uuid;
    current_user_id uuid;
    recipient_setting text;
    is_follower boolean;
BEGIN
    current_user_id := auth.uid();
    
    -- Check if recipient allows messages from this user
    SELECT allow_messages_from INTO recipient_setting
    FROM user_settings
    WHERE user_id = other_user_id;
    
    -- Default to 'everyone' if no settings exist
    recipient_setting := COALESCE(recipient_setting, 'everyone');
    
    -- Check message permissions
    IF recipient_setting = 'nobody' THEN
        RAISE EXCEPTION 'This user does not accept messages';
    ELSIF recipient_setting = 'followers' THEN
        -- Check if current user is following the recipient
        SELECT EXISTS (
            SELECT 1 FROM follows
            WHERE follower_id = current_user_id
            AND following_id = other_user_id
        ) INTO is_follower;
        
        IF NOT is_follower THEN
            RAISE EXCEPTION 'This user only accepts messages from people they follow';
        END IF;
    END IF;
    -- 'everyone' allows all messages
    
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

-- Create a function to check if a user can message another user
CREATE OR REPLACE FUNCTION public.can_message_user(_sender_id uuid, _recipient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        CASE 
            WHEN us.allow_messages_from IS NULL OR us.allow_messages_from = 'everyone' THEN true
            WHEN us.allow_messages_from = 'nobody' THEN false
            WHEN us.allow_messages_from = 'followers' THEN 
                EXISTS (
                    SELECT 1 FROM follows
                    WHERE follower_id = _sender_id
                    AND following_id = _recipient_id
                )
            ELSE true
        END
    FROM user_settings us
    WHERE us.user_id = _recipient_id
    UNION ALL
    SELECT true -- Default if no settings
    LIMIT 1
$$;