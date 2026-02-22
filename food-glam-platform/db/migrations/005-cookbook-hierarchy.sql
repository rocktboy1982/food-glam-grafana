-- Migration: Cookbook Hierarchy — Cuisines, Food Styles, Recipe Bank

-- 1. CREATE CUISINES TABLE
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

-- 2. CREATE FOOD STYLES TABLE
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

-- 3. EXTEND COOKBOOKS TABLE
ALTER TABLE cookbooks ADD COLUMN IF NOT EXISTS food_style_id uuid REFERENCES food_styles(id) ON DELETE SET NULL;
ALTER TABLE cookbooks ADD COLUMN IF NOT EXISTS cuisine_id uuid REFERENCES cuisines(id) ON DELETE SET NULL;
ALTER TABLE cookbooks ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE cookbooks ADD COLUMN IF NOT EXISTS cover_image_url text;
ALTER TABLE cookbooks ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- 4. EXTEND RECIPES TABLE
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS cookbook_id uuid REFERENCES cookbooks(id) ON DELETE SET NULL;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS food_style_id uuid REFERENCES food_styles(id) ON DELETE SET NULL;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS cuisine_id uuid REFERENCES cuisines(id) ON DELETE SET NULL;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS prep_time_minutes int;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS cook_time_minutes int;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS servings int;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS difficulty_level text CHECK (difficulty_level IN ('easy', 'medium', 'hard'));

-- 4b. CREATE CHAPTERS TABLE
CREATE TABLE IF NOT EXISTS chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cookbook_id uuid NOT NULL REFERENCES cookbooks(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  position int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(cookbook_id, slug)
);

-- 4c. EXTEND RECIPES TABLE - add chapter_id
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS chapter_id uuid REFERENCES chapters(id) ON DELETE SET NULL;

-- 5. INDEXES
CREATE INDEX IF NOT EXISTS cuisines_slug_idx ON cuisines(slug);
CREATE INDEX IF NOT EXISTS food_styles_cuisine_id_idx ON food_styles(cuisine_id);
CREATE INDEX IF NOT EXISTS food_styles_slug_idx ON food_styles(slug);
CREATE INDEX IF NOT EXISTS cookbooks_cuisine_id_idx ON cookbooks(cuisine_id);
CREATE INDEX IF NOT EXISTS cookbooks_food_style_id_idx ON cookbooks(food_style_id);
CREATE INDEX IF NOT EXISTS cookbooks_is_public_idx ON cookbooks(is_public);
CREATE INDEX IF NOT EXISTS chapters_cookbook_id_idx ON chapters(cookbook_id);
CREATE INDEX IF NOT EXISTS chapters_slug_idx ON chapters(slug);
CREATE INDEX IF NOT EXISTS recipes_cookbook_id_idx ON recipes(cookbook_id);
CREATE INDEX IF NOT EXISTS recipes_chapter_id_idx ON recipes(chapter_id);
CREATE INDEX IF NOT EXISTS recipes_cuisine_id_idx ON recipes(cuisine_id);
CREATE INDEX IF NOT EXISTS recipes_food_style_id_idx ON recipes(food_style_id);

-- 6. RLS POLICIES

-- Cuisines: Public read
ALTER TABLE cuisines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cuisines_select ON cuisines;
CREATE POLICY cuisines_select ON cuisines FOR SELECT USING (true);

-- Food Styles: Public read
ALTER TABLE food_styles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS food_styles_select ON food_styles;
CREATE POLICY food_styles_select ON food_styles FOR SELECT USING (true);

-- Cookbooks: Public if is_public=true, private to owner
ALTER TABLE cookbooks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cookbooks_select ON cookbooks;
CREATE POLICY cookbooks_select ON cookbooks FOR SELECT USING (
  is_public = true OR owner_id = auth.uid()
);
DROP POLICY IF EXISTS cookbooks_insert ON cookbooks;
CREATE POLICY cookbooks_insert ON cookbooks FOR INSERT WITH CHECK (owner_id = auth.uid());
DROP POLICY IF EXISTS cookbooks_update ON cookbooks;
CREATE POLICY cookbooks_update ON cookbooks FOR UPDATE USING (owner_id = auth.uid());
DROP POLICY IF EXISTS cookbooks_delete ON cookbooks;
CREATE POLICY cookbooks_delete ON cookbooks FOR DELETE USING (owner_id = auth.uid());

-- Chapters: Inherit cookbook visibility
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS chapters_select ON chapters;
CREATE POLICY chapters_select ON chapters FOR SELECT USING (
  cookbook_id IN (
    SELECT id FROM cookbooks WHERE is_public = true OR owner_id = auth.uid()
  )
);
DROP POLICY IF EXISTS chapters_insert ON chapters;
CREATE POLICY chapters_insert ON chapters FOR INSERT WITH CHECK (
  cookbook_id IN (
    SELECT id FROM cookbooks WHERE owner_id = auth.uid()
  )
);
DROP POLICY IF EXISTS chapters_update ON chapters;
CREATE POLICY chapters_update ON chapters FOR UPDATE USING (
  cookbook_id IN (
    SELECT id FROM cookbooks WHERE owner_id = auth.uid()
  )
);
DROP POLICY IF EXISTS chapters_delete ON chapters;
CREATE POLICY chapters_delete ON chapters FOR DELETE USING (
  cookbook_id IN (
    SELECT id FROM cookbooks WHERE owner_id = auth.uid()
  )
);

-- Recipes: Inherit cookbook visibility
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS recipes_select ON recipes;
CREATE POLICY recipes_select ON recipes FOR SELECT USING (
  cookbook_id IS NULL OR cookbook_id IN (
    SELECT id FROM cookbooks WHERE is_public = true OR owner_id = auth.uid()
  )
);

-- 7. SEED DATA — CUISINES & FOOD STYLES

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

-- INSERT FOOD STYLES (2-3 per cuisine)
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

-- 7b. SEED DATA — CHAPTERS (universal chapter types for all cookbooks)
INSERT INTO chapters (cookbook_id, name, slug, description, position) 
SELECT 
  c.id,
  chapter.name,
  chapter.slug,
  chapter.description,
  chapter.position
FROM cookbooks c
CROSS JOIN (
  VALUES
    ('Steaks & Grilled Meats', 'steaks', 'Beef, lamb, pork grilled or pan-seared to perfection', 0),
    ('Soups & Broths', 'soups', 'Warming soups, bisques, and clear broths', 1),
    ('Desserts & Sweets', 'desserts', 'Sweet treats — cakes, pastries, chocolate, fruit', 2),
    ('Appetizers & Starters', 'appetizers', 'Small plates to begin the meal', 3),
    ('Salads', 'salads', 'Fresh greens, composed salads, dressings', 4),
    ('Main Courses', 'main-courses', 'Complete entrées and main dishes', 5),
    ('Sides & Vegetables', 'sides', 'Vegetable dishes, grains, accompaniments', 6),
    ('Seafood', 'seafood', 'Fish, shellfish, and ocean proteins', 7),
    ('Pasta & Noodles', 'pasta', 'Pasta, risotto, noodle dishes', 8),
    ('Breads & Baked Goods', 'breads', 'Breads, rolls, focaccia, baked items', 9),
    ('Beverages', 'beverages', 'Drinks — hot, cold, alcoholic, non-alcoholic', 10),
    ('Breakfast & Brunch', 'breakfast', 'Morning dishes — eggs, grains, pastries', 11)
) AS chapter(name, slug, description, position)
ON CONFLICT (cookbook_id, slug) DO NOTHING;

-- COMMENT ON STRUCTURE
COMMENT ON TABLE cuisines IS 'Geographic & cultural cuisine categories — countries/regions of origin';
COMMENT ON TABLE food_styles IS 'Food style subtypes within cuisines — e.g., Italian, Fusion Italian under Italy';
COMMENT ON TABLE chapters IS 'Recipe chapter groupings within cookbooks — steaks, soups, desserts, etc.';
COMMENT ON TABLE cookbooks IS 'Extended: now linked to cuisine_id & food_style_id for hierarchy browsing';
COMMENT ON TABLE recipes IS 'Extended: now linked to cuisine_id, food_style_id, cookbook_id, chapter_id for recipe bank';
