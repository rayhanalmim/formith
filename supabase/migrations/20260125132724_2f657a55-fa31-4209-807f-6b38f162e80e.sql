-- Create message_reactions table for emoji reactions on room messages
CREATE TABLE public.message_reactions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    emoji text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Room members can view reactions" ON public.message_reactions
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.messages m
        JOIN public.room_members rm ON rm.room_id = m.room_id
        WHERE m.id = message_reactions.message_id
        AND rm.user_id = auth.uid()
    )
);

CREATE POLICY "Room members can add reactions" ON public.message_reactions
FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM public.messages m
        JOIN public.room_members rm ON rm.room_id = m.room_id
        WHERE m.id = message_reactions.message_id
        AND rm.user_id = auth.uid()
    )
);

CREATE POLICY "Users can remove their own reactions" ON public.message_reactions
FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;

-- Create index for faster queries
CREATE INDEX idx_message_reactions_message_id ON public.message_reactions(message_id);