-- Add URL-friendly slugs to categories so we can use category names in URLs instead of UUIDs.
-- Slugs are unique for root categories, and unique per parent for subcategories.

ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS slug text;

-- Backfill slug for existing rows (lowercase, hyphen-separated)
UPDATE public.categories
SET slug = TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(name), '[^a-z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- Root categories: slug must be unique (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS categories_root_slug_unique
  ON public.categories (lower(slug))
  WHERE parent_id IS NULL;

-- Subcategories: slug must be unique per parent (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS categories_parent_slug_unique
  ON public.categories (parent_id, lower(slug))
  WHERE parent_id IS NOT NULL;

-- Helpful index for slug lookups
CREATE INDEX IF NOT EXISTS idx_categories_slug
  ON public.categories (slug);



