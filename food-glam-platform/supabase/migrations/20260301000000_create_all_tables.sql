-- ============================================================
-- Migration 000: Create ALL tables for Food Glam Platform
-- This is the single source of truth for all table definitions.
--
-- IMPORTANT: Supabase local dev "Initialising schema" step may
-- pre-create tables with different columns. We use DROP+CREATE
-- (not IF NOT EXISTS) to ensure our schema is always correct.
-- ============================================================

-- ============================================================
-- 0. PostgREST auto-reload event trigger
--    Ensures PostgREST picks up DDL changes immediately.
-- ============================================================
CREATE OR REPLACE FUNCTION pgrst_watch() RETURNS event_trigger
  LANGUAGE plpgsql AS $$
BEGIN
  NOTIFY pgrst, 'reload schema';
END;
$$;

DROP EVENT TRIGGER IF EXISTS pgrst_watch;
CREATE EVENT TRIGGER pgrst_watch
  ON ddl_command_end
  EXECUTE PROCEDURE pgrst_watch();

-- ============================================================
-- Drop ALL tables in reverse dependency order so we start clean.
-- This guarantees our schema regardless of what init created.
-- ============================================================
DROP TABLE IF EXISTS user_substitution_prefs CASCADE;
DROP TABLE IF EXISTS grocery_orders CASCADE;
DROP TABLE IF EXISTS ingredient_product_cache CASCADE;
DROP TABLE IF EXISTS user_grocery_prefs CASCADE;
DROP TABLE IF EXISTS user_vendor_configs CASCADE;
DROP TABLE IF EXISTS grocery_vendors CASCADE;
DROP TABLE IF EXISTS shopping_list_presence CASCADE;
DROP TABLE IF EXISTS shopping_list_shares CASCADE;
DROP TABLE IF EXISTS shopping_list_items CASCADE;
DROP TABLE IF EXISTS shopping_lists CASCADE;
DROP TABLE IF EXISTS collections CASCADE;
DROP TABLE IF EXISTS meal_plans CASCADE;
DROP TABLE IF EXISTS pantry CASCADE;
DROP TABLE IF EXISTS app_roles CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS cookbooks CASCADE;
DROP TABLE IF EXISTS food_styles CASCADE;
DROP TABLE IF EXISTS cuisines CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS approaches CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================
CREATE TABLE profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text NOT NULL UNIQUE,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  is_moderator boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. APPROACHES TABLE (cooking approaches/styles)
-- ============================================================
CREATE TABLE approaches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  icon_url text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. RECIPES TABLE
-- ============================================================
CREATE TABLE recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE,
  summary text,
  description text,
  ingredients text[],
  instructions text[],
  prep_time_minutes integer,
  cook_time_minutes integer,
  servings integer,
  difficulty_level text CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  image_url text,
  approach_id uuid REFERENCES approaches(id) ON DELETE SET NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  search_tsv tsvector
);

-- ============================================================
-- 4. VOTES TABLE
-- ============================================================
CREATE TABLE votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  vote_type text CHECK (vote_type IN ('upvote', 'downvote')),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 5. FOLLOWS TABLE
-- ============================================================
CREATE TABLE follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, following_id)
);

-- ============================================================
-- 6. COLLECTIONS TABLE
-- ============================================================
CREATE TABLE collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipe_id uuid,
  collection_type text DEFAULT 'saved',
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 7. MEAL PLANS TABLE
-- ============================================================
CREATE TABLE meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start_date date NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, week_start_date)
);

-- ============================================================
-- 8. SHOPPING LISTS TABLE
-- ============================================================
CREATE TABLE shopping_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text,
  source_type text,
  source_ref text,
  period_from date,
  period_to date,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 9. SHOPPING LIST ITEMS TABLE
-- ============================================================
CREATE TABLE shopping_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id uuid NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount numeric,
  unit text,
  notes text,
  checked boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 10. SHOPPING LIST SHARES TABLE
-- ============================================================
CREATE TABLE shopping_list_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id uuid NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  can_edit boolean DEFAULT false,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 11. SHOPPING LIST PRESENCE TABLE
-- ============================================================
CREATE TABLE shopping_list_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id uuid NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  presence_id text UNIQUE NOT NULL,
  user_id uuid,
  name text,
  last_seen timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 12. SUBMISSIONS TABLE
-- ============================================================
CREATE TABLE submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 13. APP ROLES TABLE
-- ============================================================
CREATE TABLE app_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'moderator', 'user')),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, role)
);

-- ============================================================
-- 14. POSTS TABLE
-- ============================================================
CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  approach_id uuid REFERENCES approaches(id),
  title text,
  content text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 15. PANTRY TABLE
-- ============================================================
CREATE TABLE pantry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  quantity text,
  unit text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 16. COOKBOOKS TABLE
-- ============================================================
CREATE TABLE cookbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  description text,
  cover_image_url text,
  is_public boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 17. CUISINES TABLE
-- ============================================================
CREATE TABLE cuisines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  country_code text,
  description text,
  featured_image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 18. FOOD STYLES TABLE
-- ============================================================
CREATE TABLE food_styles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  cuisine_id uuid NOT NULL REFERENCES cuisines(id) ON DELETE CASCADE,
  description text,
  icon_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(cuisine_id, slug)
);

-- ============================================================
-- 19. EXTEND RECIPES TABLE with cuisine/food_style
-- ============================================================
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS cuisine_id uuid REFERENCES cuisines(id) ON DELETE SET NULL;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS food_style_id uuid REFERENCES food_styles(id) ON DELETE SET NULL;

-- ============================================================
-- 20. SEARCH & INDEXING SETUP
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;

DROP FUNCTION IF EXISTS recipes_search_tsv_trigger() CASCADE;
CREATE FUNCTION recipes_search_tsv_trigger() RETURNS trigger AS $$
begin
  new.search_tsv := to_tsvector('english', coalesce(new.title,'') || ' ' || coalesce(new.summary,''));
  return new;
end
$$ LANGUAGE plpgsql;

CREATE TRIGGER recipes_search_tsv_update BEFORE INSERT OR UPDATE ON recipes
FOR EACH ROW EXECUTE PROCEDURE recipes_search_tsv_trigger();

CREATE INDEX IF NOT EXISTS recipes_search_tsv_idx ON recipes USING GIN (search_tsv);
CREATE INDEX IF NOT EXISTS recipes_title_trgm_idx ON recipes USING GIN (title gin_trgm_ops);

CREATE OR REPLACE FUNCTION search_recipes(query_text text, limit_count int DEFAULT 20)
RETURNS TABLE(id uuid, title text, summary text, rank real) AS $$
BEGIN
  RETURN QUERY
  SELECT r.id, r.title, r.summary,
    ts_rank_cd(r.search_tsv, plainto_tsquery('english', query_text)) + (
      CASE WHEN r.title ILIKE query_text THEN 10 ELSE 0 END
    ) as rank
  FROM recipes r
  WHERE r.search_tsv @@ plainto_tsquery('english', query_text)
     OR r.title ILIKE ('%' || query_text || '%')
  ORDER BY rank DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- 21. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS posts_approach_id_idx ON posts(approach_id);
CREATE INDEX IF NOT EXISTS posts_created_by_idx ON posts(created_by);
CREATE INDEX IF NOT EXISTS posts_status_idx ON posts(status);
CREATE INDEX IF NOT EXISTS votes_post_id_idx ON votes(post_id);
CREATE INDEX IF NOT EXISTS shopping_lists_user_id_idx ON shopping_lists(user_id);
CREATE INDEX IF NOT EXISTS meal_plans_user_id_idx ON meal_plans(user_id);
CREATE INDEX IF NOT EXISTS collections_user_id_idx ON collections(user_id);
CREATE INDEX IF NOT EXISTS pantry_user_id_idx ON pantry(user_id);
CREATE INDEX IF NOT EXISTS cuisines_slug_idx ON cuisines(slug);
CREATE INDEX IF NOT EXISTS food_styles_cuisine_id_idx ON food_styles(cuisine_id);
CREATE INDEX IF NOT EXISTS food_styles_slug_idx ON food_styles(slug);
CREATE INDEX IF NOT EXISTS recipes_cuisine_id_idx ON recipes(cuisine_id);
CREATE INDEX IF NOT EXISTS recipes_food_style_id_idx ON recipes(food_style_id);

-- ============================================================
-- 22. GROCERY VENDORS TABLE (seeded catalogue)
-- ============================================================
CREATE TABLE grocery_vendors (
  id text PRIMARY KEY,
  name text NOT NULL,
  logo_url text,
  country_code text NOT NULL DEFAULT 'RO',
  delivery_model text NOT NULL CHECK (delivery_model IN ('warehouse', 'personal-shopper', 'courier', 'pickup')),
  integration_mode text NOT NULL CHECK (integration_mode IN ('api', 'deeplink', 'manual')),
  supports_multi_store boolean DEFAULT false,
  estimated_delivery_minutes integer,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 23. USER VENDOR CONFIGS TABLE
-- ============================================================
CREATE TABLE user_vendor_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vendor_id text NOT NULL REFERENCES grocery_vendors(id) ON DELETE CASCADE,
  is_default boolean DEFAULT false,
  preferred_store text,
  preferred_city text DEFAULT 'bucharest',
  credentials jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, vendor_id)
);

-- ============================================================
-- 24. USER GROCERY PREFS TABLE
-- ============================================================
CREATE TABLE user_grocery_prefs (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  default_budget_tier text NOT NULL DEFAULT 'normal' CHECK (default_budget_tier IN ('budget', 'normal', 'premium')),
  pack_size_optimisation boolean DEFAULT true,
  substitutions_enabled boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 25. INGREDIENT PRODUCT CACHE TABLE
-- ============================================================
CREATE TABLE ingredient_product_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id text NOT NULL REFERENCES grocery_vendors(id) ON DELETE CASCADE,
  ingredient_canonical text NOT NULL,
  product_id text,
  product_json jsonb NOT NULL,
  matched_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  UNIQUE(vendor_id, ingredient_canonical)
);

-- ============================================================
-- 26. GROCERY ORDERS TABLE
-- ============================================================
CREATE TABLE grocery_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shopping_list_id uuid REFERENCES shopping_lists(id) ON DELETE SET NULL,
  vendor_id text NOT NULL REFERENCES grocery_vendors(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'confirmed', 'delivered', 'cancelled')),
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_estimated_price numeric,
  currency text DEFAULT 'RON',
  vendor_order_id text,
  handoff_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 27. USER SUBSTITUTION PREFS TABLE
-- ============================================================
CREATE TABLE user_substitution_prefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  original_canonical text NOT NULL,
  substitute_canonical text NOT NULL,
  accepted boolean DEFAULT true,
  budget_tier text DEFAULT 'normal' CHECK (budget_tier IN ('budget', 'normal', 'premium')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, original_canonical, budget_tier)
);

-- ============================================================
-- 28. GROCERY INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS user_vendor_configs_user_id_idx ON user_vendor_configs(user_id);
CREATE INDEX IF NOT EXISTS user_vendor_configs_vendor_id_idx ON user_vendor_configs(vendor_id);
CREATE INDEX IF NOT EXISTS ingredient_product_cache_vendor_idx ON ingredient_product_cache(vendor_id);
CREATE INDEX IF NOT EXISTS ingredient_product_cache_canonical_idx ON ingredient_product_cache(ingredient_canonical);
CREATE INDEX IF NOT EXISTS grocery_orders_user_id_idx ON grocery_orders(user_id);
CREATE INDEX IF NOT EXISTS grocery_orders_list_id_idx ON grocery_orders(shopping_list_id);
CREATE INDEX IF NOT EXISTS grocery_orders_status_idx ON grocery_orders(status);
CREATE INDEX IF NOT EXISTS user_substitution_prefs_user_id_idx ON user_substitution_prefs(user_id);

-- ============================================================
-- 29. SEED GROCERY VENDORS
-- ============================================================
INSERT INTO grocery_vendors (id, name, logo_url, country_code, delivery_model, integration_mode, supports_multi_store, estimated_delivery_minutes) VALUES
  ('freshful', 'Freshful by eMAG', NULL, 'RO', 'warehouse', 'deeplink', false, 120),
  ('bringo', 'Bringo', NULL, 'RO', 'personal-shopper', 'deeplink', true, 90),
  ('glovo', 'Glovo', NULL, 'RO', 'courier', 'deeplink', true, 45),
  ('kaufland-ro', 'Kaufland', NULL, 'RO', 'pickup', 'deeplink', false, NULL),
  ('carrefour-ro', 'Carrefour', NULL, 'RO', 'warehouse', 'deeplink', false, 120)
ON CONFLICT (id) DO NOTHING;
