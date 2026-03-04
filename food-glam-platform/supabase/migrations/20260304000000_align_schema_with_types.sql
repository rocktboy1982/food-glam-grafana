-- ============================================================
-- Migration: Align posts + profiles schema with types/supabase.ts
-- Adds missing columns so the app can query them correctly.
-- ============================================================

-- ── posts: add missing columns ─────────────────────────────────────────────
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS type        text NOT NULL DEFAULT 'recipe',
  ADD COLUMN IF NOT EXISTS slug        text,
  ADD COLUMN IF NOT EXISTS hero_image_url text,
  ADD COLUMN IF NOT EXISTS diet_tags   text[],
  ADD COLUMN IF NOT EXISTS food_tags   text[],
  ADD COLUMN IF NOT EXISTS quality_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_tested   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS recipe_json jsonb,
  ADD COLUMN IF NOT EXISTS video_url   text,
  ADD COLUMN IF NOT EXISTS summary      text;

-- ── approaches: add slug column ──────────────────────────────────────────
ALTER TABLE approaches
  ADD COLUMN IF NOT EXISTS slug text;

UPDATE approaches
  SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
  WHERE slug IS NULL;

-- ── profiles: add missing columns ──────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS handle          text,
  ADD COLUMN IF NOT EXISTS banner_url      text,
  ADD COLUMN IF NOT EXISTS feature_flags   jsonb,
  ADD COLUMN IF NOT EXISTS preferred_language text,
  ADD COLUMN IF NOT EXISTS language_locked boolean DEFAULT false;

-- Populate handle from username for existing seeded profiles
UPDATE profiles
  SET handle = COALESCE(username, 'chef_' || id::text)
  WHERE handle IS NULL;

-- ── posts: populate slug + type + recipe_json from recipes table ───────────
-- Use row_number so each post gets the best-matching recipe (first by created_at).
-- Even if multiple recipes share the same title, each post gets its own slug.
WITH ranked AS (
  SELECT
    p.id AS post_id,
    r.id AS recipe_id,
    r.slug AS recipe_slug,
    r.image_url,
    r.ingredients,
    r.instructions,
    r.prep_time_minutes,
    r.cook_time_minutes,
    r.servings,
    r.difficulty_level,
    ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY r.created_at) AS rn
  FROM posts p
  JOIN recipes r ON r.created_by = p.created_by AND r.title = p.title
)
UPDATE posts p
  SET
    type           = 'recipe',
    slug           = ranked.recipe_slug,
    hero_image_url = ranked.image_url,
    recipe_json    = jsonb_build_object(
      'id',                ranked.recipe_id,
      'ingredients',       ranked.ingredients,
      'instructions',      ranked.instructions,
      'prep_time_minutes', ranked.prep_time_minutes,
      'cook_time_minutes', ranked.cook_time_minutes,
      'servings',          ranked.servings,
      'difficulty_level',  ranked.difficulty_level
    ),
    quality_score  = 10
  FROM ranked
  WHERE ranked.post_id = p.id AND ranked.rn = 1;

-- Populate summary from content (first 200 chars)
UPDATE posts
  SET summary = CASE WHEN length(content) > 200 THEN substring(content, 1, 200) || '...' ELSE content END
  WHERE summary IS NULL AND content IS NOT NULL;

-- Posts that still have no slug: generate from title + short id
UPDATE posts
  SET slug = regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g') || '-' || substring(id::text, 1, 8)
  WHERE slug IS NULL;

-- Deduplicate slugs: append short id suffix where collision exists
UPDATE posts p
  SET slug = p.slug || '-' || substring(p.id::text, 1, 8)
  WHERE EXISTS (
    SELECT 1 FROM posts p2
    WHERE p2.slug = p.slug AND p2.id < p.id
  );

-- Create unique index AFTER deduplication
CREATE UNIQUE INDEX IF NOT EXISTS posts_slug_key ON posts(slug) WHERE slug IS NOT NULL;

-- ── Notify PostgREST to reload schema ──────────────────────────────────────
NOTIFY pgrst, 'reload schema';
