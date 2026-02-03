-- Create conversations table for direct messages
CREATE TABLE public.conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    last_message_at timestamp with time zone DEFAULT now()
);

-- Create conversation participants table
CREATE TABLE public.conversation_participants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    joined_at timestamp with time zone NOT NULL DEFAULT now(),
    last_read_at timestamp with time zone DEFAULT now(),
    UNIQUE(conversation_id, user_id)
);

-- Create direct messages table
CREATE TABLE public.direct_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL,
    content text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = conversations.id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for conversation_participants
CREATE POLICY "Users can view participants of their conversations"
ON public.conversation_participants FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants cp
        WHERE cp.conversation_id = conversation_participants.conversation_id
        AND cp.user_id = auth.uid()
    )
);

CREATE POLICY "Users can add participants"
ON public.conversation_participants FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own participation"
ON public.conversation_participants FOR UPDATE
USING (user_id = auth.uid());

-- RLS Policies for direct_messages
CREATE POLICY "Users can view messages in their conversations"
ON public.direct_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = direct_messages.conversation_id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Users can send messages to their conversations"
ON public.direct_messages FOR INSERT
WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = direct_messages.conversation_id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their own messages"
ON public.direct_messages FOR UPDATE
USING (sender_id = auth.uid());

-- Enable realtime for direct_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;

-- Function to get or create conversation between two users
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
    END IF;
    
    RETURN conv_id;
END;
$$;

-- Update handle_new_user function to auto-assign manager role and verified status to ceo@tahweel.io
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    is_owner boolean;
    is_ceo boolean;
BEGIN
    is_owner := NEW.email = 'support@tahweel.io';
    is_ceo := NEW.email = 'ceo@tahweel.io';
    
    INSERT INTO public.profiles (user_id, username, display_name, is_verified)
    VALUES (
        NEW.id,
        LOWER(SPLIT_PART(NEW.email, '@', 1)) || '_' || SUBSTR(NEW.id::text, 1, 4),
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
$$;

-- Update assign_admin_to_owner to also handle ceo@tahweel.io
CREATE OR REPLACE FUNCTION public.assign_admin_to_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.email = 'support@tahweel.io' THEN
        UPDATE public.user_roles SET role = 'admin' WHERE user_id = NEW.id;
        UPDATE public.profiles SET is_verified = true WHERE user_id = NEW.id;
    ELSIF NEW.email = 'ceo@tahweel.io' THEN
        UPDATE public.user_roles SET role = 'manager' WHERE user_id = NEW.id;
        UPDATE public.profiles SET is_verified = true WHERE user_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$;

-- Create trigger for updating conversation timestamp
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    UPDATE conversations
    SET last_message_at = NEW.created_at, updated_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_message
    AFTER INSERT ON public.direct_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_conversation_timestamp();