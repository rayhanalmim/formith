-- Create trigger to update room members count
CREATE OR REPLACE FUNCTION public.update_room_members_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.rooms SET members_count = members_count + 1 WHERE id = NEW.room_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.rooms SET members_count = members_count - 1 WHERE id = OLD.room_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_room_member_change ON public.room_members;

CREATE TRIGGER on_room_member_change
AFTER INSERT OR DELETE ON public.room_members
FOR EACH ROW EXECUTE FUNCTION public.update_room_members_count();