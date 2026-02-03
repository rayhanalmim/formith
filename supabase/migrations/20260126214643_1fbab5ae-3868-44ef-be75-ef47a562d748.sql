-- Add is_pinned column to conversation_participants for conversation pinning
ALTER TABLE public.conversation_participants 
ADD COLUMN is_pinned boolean DEFAULT false,
ADD COLUMN pinned_at timestamp with time zone DEFAULT NULL;