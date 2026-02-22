-- Migration: Add Cuisines and Food Styles Tables

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

-- 3. EXTEND RECIPES TABLE (add columns if they don't exist)
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS cuisine_id uuid REFERENCES cuisines(id) ON DELETE SET NULL;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS food_style_id uuid REFERENCES food_styles(id) ON DELETE SET NULL;

-- 4. ENABLE RLS
ALTER TABLE cuisines ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_styles ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES
DROP POLICY IF EXISTS "Cuisines public read" ON cuisines;
CREATE POLICY "Cuisines public read" ON cuisines FOR SELECT USING (true);

DROP POLICY IF EXISTS "Food styles public read" ON food_styles;
CREATE POLICY "Food styles public read" ON food_styles FOR SELECT USING (true);

-- 6. INDEXES
CREATE INDEX IF NOT EXISTS cuisines_slug_idx ON cuisines(slug);
CREATE INDEX IF NOT EXISTS food_styles_cuisine_id_idx ON food_styles(cuisine_id);
CREATE INDEX IF NOT EXISTS food_styles_slug_idx ON food_styles(slug);
CREATE INDEX IF NOT EXISTS recipes_cuisine_id_idx ON recipes(cuisine_id);
CREATE INDEX IF NOT EXISTS recipes_food_style_id_idx ON recipes(food_style_id);

-- 7. SEED DATA — CUISINES
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

-- 8. SEED DATA — FOOD STYLES
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
