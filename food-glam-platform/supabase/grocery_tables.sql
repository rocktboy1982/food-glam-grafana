-- Grocery module tables (apply manually to running DB)
-- Run: docker exec -i supabase_db_food-glam-platform psql -U postgres -d postgres < supabase/grocery_tables.sql

DROP TABLE IF EXISTS user_substitution_prefs CASCADE;
DROP TABLE IF EXISTS grocery_orders CASCADE;
DROP TABLE IF EXISTS ingredient_product_cache CASCADE;
DROP TABLE IF EXISTS user_grocery_prefs CASCADE;
DROP TABLE IF EXISTS user_vendor_configs CASCADE;
DROP TABLE IF EXISTS grocery_vendors CASCADE;

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

CREATE TABLE user_grocery_prefs (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  default_budget_tier text NOT NULL DEFAULT 'normal' CHECK (default_budget_tier IN ('budget', 'normal', 'premium')),
  pack_size_optimisation boolean DEFAULT true,
  substitutions_enabled boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

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

-- Indexes
CREATE INDEX IF NOT EXISTS user_vendor_configs_user_id_idx ON user_vendor_configs(user_id);
CREATE INDEX IF NOT EXISTS user_vendor_configs_vendor_id_idx ON user_vendor_configs(vendor_id);
CREATE INDEX IF NOT EXISTS ingredient_product_cache_vendor_idx ON ingredient_product_cache(vendor_id);
CREATE INDEX IF NOT EXISTS ingredient_product_cache_canonical_idx ON ingredient_product_cache(ingredient_canonical);
CREATE INDEX IF NOT EXISTS grocery_orders_user_id_idx ON grocery_orders(user_id);
CREATE INDEX IF NOT EXISTS grocery_orders_list_id_idx ON grocery_orders(shopping_list_id);
CREATE INDEX IF NOT EXISTS grocery_orders_status_idx ON grocery_orders(status);
CREATE INDEX IF NOT EXISTS user_substitution_prefs_user_id_idx ON user_substitution_prefs(user_id);

-- RLS
ALTER TABLE grocery_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_vendor_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_grocery_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_product_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_substitution_prefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view grocery vendors" ON grocery_vendors;
CREATE POLICY "Public can view grocery vendors" ON grocery_vendors
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "User vendor configs full access" ON user_vendor_configs;
CREATE POLICY "User vendor configs full access" ON user_vendor_configs
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "User grocery prefs full access" ON user_grocery_prefs;
CREATE POLICY "User grocery prefs full access" ON user_grocery_prefs
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Ingredient cache full access" ON ingredient_product_cache;
CREATE POLICY "Ingredient cache full access" ON ingredient_product_cache
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Grocery orders full access" ON grocery_orders;
CREATE POLICY "Grocery orders full access" ON grocery_orders
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Substitution prefs full access" ON user_substitution_prefs;
CREATE POLICY "Substitution prefs full access" ON user_substitution_prefs
  FOR ALL USING (true) WITH CHECK (true);

-- Seed vendors
INSERT INTO grocery_vendors (id, name, logo_url, country_code, delivery_model, integration_mode, supports_multi_store, estimated_delivery_minutes) VALUES
  ('freshful', 'Freshful by eMAG', NULL, 'RO', 'warehouse', 'deeplink', false, 120),
  ('bringo', 'Bringo', NULL, 'RO', 'personal-shopper', 'deeplink', true, 90),
  ('glovo', 'Glovo', NULL, 'RO', 'courier', 'deeplink', true, 45),
  ('kaufland-ro', 'Kaufland', NULL, 'RO', 'pickup', 'deeplink', false, NULL),
  ('carrefour-ro', 'Carrefour', NULL, 'RO', 'warehouse', 'deeplink', false, 120)
ON CONFLICT (id) DO NOTHING;

-- Explicit grants for PostgREST discovery (required for Supabase local dev)
GRANT ALL ON grocery_vendors TO postgres, anon, authenticated, service_role, authenticator;
GRANT ALL ON user_vendor_configs TO postgres, anon, authenticated, service_role, authenticator;
GRANT ALL ON user_grocery_prefs TO postgres, anon, authenticated, service_role, authenticator;
GRANT ALL ON ingredient_product_cache TO postgres, anon, authenticated, service_role, authenticator;
GRANT ALL ON grocery_orders TO postgres, anon, authenticated, service_role, authenticator;
GRANT ALL ON user_substitution_prefs TO postgres, anon, authenticated, service_role, authenticator;

-- Signal PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

SELECT 'Grocery tables created successfully' AS status;
