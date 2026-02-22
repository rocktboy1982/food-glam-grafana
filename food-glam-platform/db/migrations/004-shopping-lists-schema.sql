CREATE TABLE IF NOT EXISTS shopping_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  source_type text,
  source_ref text,
  period_from text,
  period_to text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shopping_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id uuid NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  name text NOT NULL,
  qty text,
  unit text,
  checked boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shopping_lists_owner_id_idx ON shopping_lists(owner_id);
CREATE INDEX IF NOT EXISTS shopping_list_items_list_id_idx ON shopping_list_items(shopping_list_id);

ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS shopping_lists_select ON shopping_lists;
CREATE POLICY shopping_lists_select ON shopping_lists FOR SELECT USING (owner_id = auth.uid());

DROP POLICY IF EXISTS shopping_lists_insert ON shopping_lists;
CREATE POLICY shopping_lists_insert ON shopping_lists FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS shopping_lists_update ON shopping_lists;
CREATE POLICY shopping_lists_update ON shopping_lists FOR UPDATE USING (owner_id = auth.uid());

DROP POLICY IF EXISTS shopping_lists_delete ON shopping_lists;
CREATE POLICY shopping_lists_delete ON shopping_lists FOR DELETE USING (owner_id = auth.uid());

DROP POLICY IF EXISTS shopping_list_items_select ON shopping_list_items;
CREATE POLICY shopping_list_items_select ON shopping_list_items FOR SELECT USING (
  shopping_list_id IN (SELECT id FROM shopping_lists WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS shopping_list_items_insert ON shopping_list_items;
CREATE POLICY shopping_list_items_insert ON shopping_list_items FOR INSERT WITH CHECK (
  shopping_list_id IN (SELECT id FROM shopping_lists WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS shopping_list_items_update ON shopping_list_items;
CREATE POLICY shopping_list_items_update ON shopping_list_items FOR UPDATE USING (
  shopping_list_id IN (SELECT id FROM shopping_lists WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS shopping_list_items_delete ON shopping_list_items;
CREATE POLICY shopping_list_items_delete ON shopping_list_items FOR DELETE USING (
  shopping_list_id IN (SELECT id FROM shopping_lists WHERE owner_id = auth.uid())
);
