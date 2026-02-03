-- Add slug column to rooms table
ALTER TABLE public.rooms
ADD COLUMN slug text UNIQUE;

-- Create function to generate room slug
CREATE OR REPLACE FUNCTION public.generate_room_slug()
RETURNS TRIGGER AS $$
DECLARE
    base_slug text;
    final_slug text;
    counter integer := 0;
BEGIN
    -- Generate base slug from room name
    base_slug := LOWER(REGEXP_REPLACE(
        NEW.name,
        '[^a-zA-Z0-9\u0600-\u06FF]+', '-', 'g'
    ));
    base_slug := TRIM(BOTH '-' FROM base_slug);
    
    -- If empty, use 'room'
    IF base_slug = '' OR base_slug IS NULL THEN
        base_slug := 'room';
    END IF;
    
    -- Start with base slug
    final_slug := base_slug;
    
    -- Check for uniqueness and append number if needed
    WHILE EXISTS (SELECT 1 FROM public.rooms WHERE slug = final_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := final_slug;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for new rooms
CREATE TRIGGER generate_room_slug_trigger
BEFORE INSERT ON public.rooms
FOR EACH ROW
WHEN (NEW.slug IS NULL)
EXECUTE FUNCTION public.generate_room_slug();

-- Generate slugs for existing rooms
UPDATE public.rooms
SET slug = LOWER(REGEXP_REPLACE(
    TRIM(BOTH '-' FROM REGEXP_REPLACE(name, '[^a-zA-Z0-9\u0600-\u06FF]+', '-', 'g')),
    '-+', '-', 'g'
)) || '-' || EXTRACT(EPOCH FROM created_at)::bigint
WHERE slug IS NULL;