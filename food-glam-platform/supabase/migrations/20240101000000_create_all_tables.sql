-- Create all required tables for Food Glam Platform

-- ============================================================
-- PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
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
-- APPROACHES TABLE (cooking approaches/styles)
-- ============================================================
CREATE TABLE IF NOT EXISTS approaches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  icon_url text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- RECIPES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS recipes (
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
-- VOTES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  vote_type text CHECK (vote_type IN ('upvote', 'downvote')),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- FOLLOWS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, following_id)
);

-- ============================================================
-- COLLECTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipe_id uuid,
  collection_type text DEFAULT 'saved',
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- MEAL PLANS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start_date date NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, week_start_date)
);

-- ============================================================
-- SHOPPING LISTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS shopping_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- SHOPPING LIST ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS shopping_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id uuid NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  quantity text,
  unit text,
  is_checked boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- SHOPPING LIST SHARES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS shopping_list_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id uuid NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  shared_with_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  share_token text UNIQUE,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- SHOPPING LIST PRESENCE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS shopping_list_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id uuid NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  user_id uuid,
  last_seen timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- SUBMISSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- APP ROLES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS app_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'moderator', 'user')),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, role)
);

-- ============================================================
-- POSTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS posts (
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
-- PANTRY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS pantry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  quantity text,
  unit text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- COOKBOOKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS cookbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  description text,
  cover_image_url text,
  is_public boolean 
DEFAULT false,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- SEARCH & INDEXING SETUP
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
-- Useful indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS posts_approach_id_idx ON posts(approach_id);
CREATE INDEX IF NOT EXISTS posts_created_by_idx ON posts(created_by);
CREATE INDEX IF NOT EXISTS posts_status_idx ON posts(status);
CREATE INDEX IF NOT EXISTS votes_post_id_idx ON votes(post_id);
CREATE INDEX IF NOT EXISTS shopping_lists_user_id_idx ON shopping_lists(user_id);
CREATE INDEX IF NOT EXISTS meal_plans_user_id_idx ON meal_plans(user_id);
CREATE INDEX IF NOT EXISTS collections_user_id_idx ON collections(user_id);
CREATE INDEX IF NOT EXISTS pantry_user_id_idx ON pantry(user_id);

-- ============================================================
-- CUISINES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS cuisines (
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
-- FOOD STYLES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS food_styles (
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
-- EXTEND RECIPES TABLE
-- ============================================================
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS cuisine_id uuid REFERENCES cuisines(id) ON DELETE SET NULL;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS food_style_id uuid REFERENCES food_styles(id) ON DELETE SET NULL;

-- ============================================================
-- CUISINES & FOOD STYLES RLS
-- ============================================================
ALTER TABLE cuisines ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_styles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cuisines_select" ON cuisines;
CREATE POLICY "cuisines_select" ON cuisines FOR SELECT USING (true);

DROP POLICY IF EXISTS "food_styles_select" ON food_styles;
CREATE POLICY "food_styles_select" ON food_styles FOR SELECT USING (true);

-- ============================================================
-- CUISINES & FOOD STYLES INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS cuisines_slug_idx ON cuisines(slug);
CREATE INDEX IF NOT EXISTS food_styles_cuisine_id_idx ON food_styles(cuisine_id);
CREATE INDEX IF NOT EXISTS food_styles_slug_idx ON food_styles(slug);
CREATE INDEX IF NOT EXISTS recipes_cuisine_id_idx ON recipes(cuisine_id);
CREATE INDEX IF NOT EXISTS recipes_food_style_id_idx ON recipes(food_style_id);

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO cuisines (name, slug, country_code, description) VALUES
  ('Italy', 'italy', 'IT', 'Mediterranean cuisine — pasta, risotto, fresh vegetables, olive oil'),
  ('France', 'france', 'FR', 'Classic French cooking — sauces, bread, wine, bistro fare'),
  ('Thailand', 'thailand', 'TH', 'Southeast Asian — bold spices, lime, fish sauce, balance of flavors'),
  ('USA', 'usa', 'US', 'Regional American — Southern, Cajun, BBQ, soul food, comfort classics'),
  ('Mexico', 'mexico', 'MX', 'Ancient traditions — mole, tacos, fresh herbs, chilies'),
  ('Japan', 'japan', 'JP', 'Precision cooking — sushi, ramen, kaiseki, umami focus'),
  ('India', 'india', 'IN', 'Diverse spice traditions — curries, breads, regional specialties'),
  ('Spain', 'spain', 'ES', 'Iberian flavors — tapas, paella, jamón, seafood'),
  ('Greece', 'greece', 'GR', 'Mediterranean simplicity — feta, olive oil, fresh herbs'),
  ('Turkey', 'turkey', 'TR', 'Ottoman heritage — kebabs, mezze, flatbreads, coffee'),
  ('Lebanon', 'lebanon', 'LB', 'Levantine cuisine — mezze, grilled meats, fresh salads'),
  ('Morocco', 'morocco', 'MA', 'North African — tagines, couscous, spiced blends'),
  ('Brazil', 'brazil', 'BR', 'Tropical — feijoada, fresh fruits, cachaca, street food'),
  ('Peru', 'peru', 'PE', 'Andean cuisine — potatoes, quinoa, ceviche, fusion heritage'),
  ('Korea', 'korea', 'KR', 'Banchan culture — kimchi, BBQ, fermented flavors'),
  ('Vietnam', 'vietnam', 'VN', 'Balance & freshness — pho, banh mi, fresh herbs, fish sauce'),
  ('China', 'china', 'CN', 'Regional provinces — Sichuan, Cantonese, Hunan, Shanghai'),
  ('Germany', 'germany', 'DE', 'Central European — beer, sausages, bread, hearty comfort'),
  ('Sweden', 'sweden', 'SE', 'Nordic — seafood, rye, preserved traditions, simplicity'),
  ('Australia', 'australia', 'AU', 'Contemporary Pacific — native ingredients, BBQ, café culture')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO food_styles (cuisine_id, name, slug, description) VALUES
  ((SELECT id FROM cuisines WHERE slug='italy'), 'Italian', 'italian', 'Classic regional Italian cooking'),
  ((SELECT id FROM cuisines WHERE slug='italy'), 'Fusion Italian', 'fusion-italian', 'Modern Italian with international influences'),
  ((SELECT id FROM cuisines WHERE slug='france'), 'French', 'french', 'Classic French bistro & haute cuisine'),
  ((SELECT id FROM cuisines WHERE slug='france'), 'Provence', 'provence', 'Southern French with Mediterranean herbs'),
  ((SELECT id FROM cuisines WHERE slug='thailand'), 'Thai', 'thai', 'Traditional Thai regional styles'),
  ((SELECT id FROM cuisines WHERE slug='thailand'), 'Street Food Thai', 'street-food-thai', 'Thai street food & quick bites'),
  ((SELECT id FROM cuisines WHERE slug='usa'), 'Southern', 'southern', 'Soul food & Lowcountry classics'),
  ((SELECT id FROM cuisines WHERE slug='usa'), 'Cajun', 'cajun', 'Louisiana spiced cooking'),
  ((SELECT id FROM cuisines WHERE slug='usa'), 'BBQ', 'bbq', 'Regional barbecue traditions'),
  ((SELECT id FROM cuisines WHERE slug='mexico'), 'Mexican', 'mexican', 'Traditional Mexican regional'),
  ((SELECT id FROM cuisines WHERE slug='mexico'), 'Street Food', 'street-food', 'Mexican street tacos & quick eats'),
  ((SELECT id FROM cuisines WHERE slug='japan'), 'Sushi', 'sushi', 'Sushi & raw fish preparations'),
  ((SELECT id FROM cuisines WHERE slug='japan'), 'Ramen', 'ramen', 'Noodle soups & broths'),
  ((SELECT id FROM cuisines WHERE slug='japan'), 'Kaiseki', 'kaiseki', 'Fine dining Japanese multi-course'),
  ((SELECT id FROM cuisines WHERE slug='india'), 'Curries', 'curries', 'Spiced curry traditions'),
  ((SELECT id FROM cuisines WHERE slug='india'), 'Breads', 'breads', 'Indian breads — naan, paratha, dosa'),
  ((SELECT id FROM cuisines WHERE slug='spain'), 'Tapas', 'tapas', 'Spanish small plates & appetizers'),
  ((SELECT id FROM cuisines WHERE slug='spain'), 'Paella', 'paella', 'Rice dishes & seafood specialties'),
  ((SELECT id FROM cuisines WHERE slug='greece'), 'Greek', 'greek', 'Mediterranean Greek home cooking'),
  ((SELECT id FROM cuisines WHERE slug='turkey'), 'Kebabs', 'kebabs', 'Grilled meat specialties'),
  ((SELECT id FROM cuisines WHERE slug='turkey'), 'Mezze', 'mezze', 'Turkish appetizers & sharing plates')
ON CONFLICT (cuisine_id, slug) DO NOTHING;
