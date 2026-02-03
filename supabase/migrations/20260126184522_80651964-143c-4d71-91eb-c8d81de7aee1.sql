-- Create room_activity_log table for tracking moderation actions
CREATE TABLE public.room_activity_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id uuid REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
    user_id uuid NOT NULL, -- The user who performed the action
    target_user_id uuid, -- The user affected by the action (if applicable)
    action_type text NOT NULL, -- 'mute', 'unmute', 'delete_message', 'assign_moderator', 'remove_moderator', 'pin_message', 'unpin_message'
    details jsonb DEFAULT '{}', -- Additional details like message content, duration, etc.
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes for efficient querying
CREATE INDEX idx_room_activity_log_room_id ON public.room_activity_log(room_id);
CREATE INDEX idx_room_activity_log_created_at ON public.room_activity_log(created_at DESC);
CREATE INDEX idx_room_activity_log_action_type ON public.room_activity_log(action_type);

-- Enable RLS
ALTER TABLE public.room_activity_log ENABLE ROW LEVEL SECURITY;

-- Only admins and managers can view activity logs
CREATE POLICY "Admins can view all activity logs"
ON public.room_activity_log FOR SELECT
USING (is_admin_or_manager(auth.uid()));

-- Allow inserting activity logs (for room members, admins, moderators)
CREATE POLICY "Authenticated users can create activity logs"
ON public.room_activity_log FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_activity_log;