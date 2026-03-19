-- Upgrade pantry table: add category (pantry/bar), canonical_name, expiration, source, numeric quantity
-- This supports both Cămară (food pantry) and Bar (spirits/mixers)

-- Add new columns
ALTER TABLE pantry ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'pantry';
ALTER TABLE pantry ADD COLUMN IF NOT EXISTS canonical_name text;
ALTER TABLE pantry ADD COLUMN IF NOT EXISTS expiration_date date;
ALTER TABLE pantry ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';
ALTER TABLE pantry ADD COLUMN IF NOT EXISTS qty_numeric numeric;

-- Migrate existing text quantity to numeric where possible
UPDATE pantry SET qty_numeric = quantity::numeric WHERE quantity ~ '^\d+\.?\d*$';

-- Add constraint for category values
ALTER TABLE pantry ADD CONSTRAINT pantry_category_check CHECK (category IN ('pantry', 'bar'));

-- Add constraint for source values
ALTER TABLE pantry ADD CONSTRAINT pantry_source_check CHECK (source IN ('manual', 'scan', 'shopping_list'));

-- Unique per user+canonical_name+category (upsert target)
CREATE UNIQUE INDEX IF NOT EXISTS pantry_user_canonical_category_idx
  ON pantry (user_id, canonical_name, category)
  WHERE canonical_name IS NOT NULL;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS pantry_user_category_idx ON pantry (user_id, category);
CREATE INDEX IF NOT EXISTS pantry_expiration_idx ON pantry (expiration_date) WHERE expiration_date IS NOT NULL;

-- RLS: users can read/write their own items
ALTER TABLE pantry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pantry_select_own ON pantry;
CREATE POLICY pantry_select_own ON pantry FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS pantry_insert_own ON pantry;
CREATE POLICY pantry_insert_own ON pantry FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS pantry_update_own ON pantry;
CREATE POLICY pantry_update_own ON pantry FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS pantry_delete_own ON pantry;
CREATE POLICY pantry_delete_own ON pantry FOR DELETE USING (auth.uid() = user_id);

-- Service role bypass (for API routes using service client)
DROP POLICY IF EXISTS pantry_service_all ON pantry;
CREATE POLICY pantry_service_all ON pantry FOR ALL USING (true) WITH CHECK (true);
