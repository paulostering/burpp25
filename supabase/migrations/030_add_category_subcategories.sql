-- Add support for subcategories via a self-referencing parent_id on categories.
-- This keeps existing category IDs stable and allows a simple parent->child hierarchy.

-- 1) Add parent_id column + FK
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS parent_id uuid;

DO $$
BEGIN
  ALTER TABLE public.categories
    ADD CONSTRAINT categories_parent_id_fkey
    FOREIGN KEY (parent_id) REFERENCES public.categories(id)
    ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Prevent a category from being its own parent
DO $$
BEGIN
  ALTER TABLE public.categories
    ADD CONSTRAINT categories_parent_id_not_self
    CHECK (parent_id IS NULL OR parent_id <> id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2) Replace the old global-unique name constraint with:
--    - root categories unique by name (case-insensitive)
--    - subcategories unique under the same parent (case-insensitive)
ALTER TABLE public.categories
DROP CONSTRAINT IF EXISTS categories_name_key;

CREATE UNIQUE INDEX IF NOT EXISTS categories_root_name_unique
  ON public.categories (lower(name))
  WHERE parent_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS categories_parent_name_unique
  ON public.categories (parent_id, lower(name))
  WHERE parent_id IS NOT NULL;

-- 3) Index for parent-child queries
CREATE INDEX IF NOT EXISTS idx_categories_parent_id
  ON public.categories(parent_id);

-- 4) Optional seed: "Home & Living" with example subcategories
INSERT INTO public.categories (name, parent_id, is_active, is_featured)
VALUES ('Home & Living', NULL, true, false)
ON CONFLICT DO NOTHING;

INSERT INTO public.categories (name, parent_id, is_active, is_featured)
SELECT v.name, p.id, true, false
FROM (
  VALUES
    ('Home Cleaning'),
    ('Deep Cleaning'),
    ('Move-Out / Move-In Cleaning'),
    ('Laundry & Folding'),
    ('Home Organization'),
    ('Decluttering'),
    ('Handyman Tasks'),
    ('Furniture Assembly'),
    ('Minor Repairs'),
    ('Errands / Task Runner'),
    ('Grocery Shopping'),
    ('Plant Care'),
    ('Home Check-Ins (Travel)')
) AS v(name)
JOIN public.categories p
  ON p.name = 'Home & Living'
 AND p.parent_id IS NULL
ON CONFLICT DO NOTHING;


