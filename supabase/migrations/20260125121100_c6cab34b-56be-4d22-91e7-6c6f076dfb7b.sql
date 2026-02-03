-- Add slug column to posts for SEO-friendly URLs
ALTER TABLE public.posts ADD COLUMN slug text;

-- Create unique index for slug
CREATE UNIQUE INDEX idx_posts_slug ON public.posts(slug) WHERE slug IS NOT NULL;

-- Function to generate slug from content
CREATE OR REPLACE FUNCTION public.generate_post_slug()
RETURNS TRIGGER AS $$
DECLARE
    base_slug text;
    final_slug text;
    counter integer := 0;
BEGIN
    -- Generate base slug from first 50 chars of content
    base_slug := LOWER(REGEXP_REPLACE(
        SUBSTRING(NEW.content FROM 1 FOR 50),
        '[^a-zA-Z0-9\u0600-\u06FF]+', '-', 'g'
    ));
    base_slug := TRIM(BOTH '-' FROM base_slug);
    
    -- If empty, use random string
    IF base_slug = '' OR base_slug IS NULL THEN
        base_slug := 'post';
    END IF;
    
    -- Add timestamp suffix for uniqueness
    final_slug := base_slug || '-' || EXTRACT(EPOCH FROM NOW())::bigint;
    
    NEW.slug := final_slug;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to auto-generate slug on insert
CREATE TRIGGER generate_post_slug_trigger
BEFORE INSERT ON public.posts
FOR EACH ROW
WHEN (NEW.slug IS NULL)
EXECUTE FUNCTION public.generate_post_slug();

-- Generate slugs for existing posts
UPDATE public.posts 
SET slug = id::text || '-' || EXTRACT(EPOCH FROM created_at)::bigint
WHERE slug IS NULL;