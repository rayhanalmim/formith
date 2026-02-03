-- Add read_at timestamp to direct_messages for read receipts
ALTER TABLE public.direct_messages 
ADD COLUMN IF NOT EXISTS read_at timestamp with time zone DEFAULT NULL;

-- Create banners table for admin-managed promotional banners
CREATE TABLE public.banners (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    title_ar text,
    image_url text NOT NULL,
    link_url text NOT NULL,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Everyone can view active banners
CREATE POLICY "Active banners are viewable by everyone"
ON public.banners
FOR SELECT
USING (is_active = true OR is_admin_or_manager(auth.uid()));

-- Only admins/managers can manage banners
CREATE POLICY "Admins can manage banners"
ON public.banners
FOR ALL
USING (is_admin_or_manager(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_banners_updated_at
BEFORE UPDATE ON public.banners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();