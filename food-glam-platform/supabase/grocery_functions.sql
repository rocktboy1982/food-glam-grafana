-- Grocery RPC functions (workaround for PostgREST schema cache bug)
-- These functions let us access grocery tables via supabase.rpc() instead of .from()

-- Get user vendor configs
CREATE OR REPLACE FUNCTION get_user_vendor_configs(p_user_id uuid)
RETURNS json AS $$
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  FROM (
    SELECT vendor_id, is_default, preferred_store, preferred_city
    FROM user_vendor_configs
    WHERE user_id = p_user_id
    ORDER BY created_at
  ) t;
$$ LANGUAGE sql SECURITY DEFINER;

-- Upsert vendor config
CREATE OR REPLACE FUNCTION upsert_vendor_config(
  p_user_id uuid,
  p_vendor_id text,
  p_is_default boolean DEFAULT false,
  p_preferred_store text DEFAULT NULL,
  p_preferred_city text DEFAULT 'bucharest'
) RETURNS json AS $$
DECLARE
  result json;
BEGIN
  IF p_is_default THEN
    UPDATE user_vendor_configs SET is_default = false WHERE user_id = p_user_id;
  END IF;
  
  INSERT INTO user_vendor_configs (user_id, vendor_id, is_default, preferred_store, preferred_city)
  VALUES (p_user_id, p_vendor_id, p_is_default, p_preferred_store, p_preferred_city)
  ON CONFLICT (user_id, vendor_id) DO UPDATE SET
    is_default = EXCLUDED.is_default,
    preferred_store = EXCLUDED.preferred_store,
    preferred_city = EXCLUDED.preferred_city;
  
  SELECT row_to_json(t) INTO result FROM (
    SELECT vendor_id, is_default, preferred_store, preferred_city
    FROM user_vendor_configs
    WHERE user_id = p_user_id AND vendor_id = p_vendor_id
  ) t;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete vendor config
CREATE OR REPLACE FUNCTION delete_vendor_config(p_user_id uuid, p_vendor_id text)
RETURNS json AS $$
BEGIN
  DELETE FROM user_vendor_configs WHERE user_id = p_user_id AND vendor_id = p_vendor_id;
  RETURN json_build_object('ok', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user grocery prefs
CREATE OR REPLACE FUNCTION get_grocery_prefs(p_user_id uuid)
RETURNS json AS $$
  SELECT COALESCE(
    (SELECT row_to_json(t) FROM (
      SELECT default_budget_tier, pack_size_optimisation, substitutions_enabled
      FROM user_grocery_prefs WHERE user_id = p_user_id
    ) t),
    json_build_object('default_budget_tier', 'normal', 'pack_size_optimisation', true, 'substitutions_enabled', true)
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Upsert grocery prefs
CREATE OR REPLACE FUNCTION upsert_grocery_prefs(
  p_user_id uuid,
  p_default_budget_tier text DEFAULT 'normal',
  p_pack_size_optimisation boolean DEFAULT true,
  p_substitutions_enabled boolean DEFAULT true
) RETURNS json AS $$
DECLARE result json;
BEGIN
  INSERT INTO user_grocery_prefs (user_id, default_budget_tier, pack_size_optimisation, substitutions_enabled, updated_at)
  VALUES (p_user_id, p_default_budget_tier, p_pack_size_optimisation, p_substitutions_enabled, now())
  ON CONFLICT (user_id) DO UPDATE SET
    default_budget_tier = EXCLUDED.default_budget_tier,
    pack_size_optimisation = EXCLUDED.pack_size_optimisation,
    substitutions_enabled = EXCLUDED.substitutions_enabled,
    updated_at = now();
  
  SELECT row_to_json(t) INTO result FROM (
    SELECT default_budget_tier, pack_size_optimisation, substitutions_enabled
    FROM user_grocery_prefs WHERE user_id = p_user_id
  ) t;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- List grocery orders
CREATE OR REPLACE FUNCTION get_grocery_orders(p_user_id uuid)
RETURNS json AS $$
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  FROM (
    SELECT id, vendor_id, status, items, total_estimated_price, currency, created_at, updated_at, shopping_list_id, vendor_order_id, handoff_url
    FROM grocery_orders
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
  ) t;
$$ LANGUAGE sql SECURITY DEFINER;

-- Create grocery order
CREATE OR REPLACE FUNCTION create_grocery_order(
  p_user_id uuid,
  p_vendor_id text,
  p_items jsonb,
  p_shopping_list_id uuid DEFAULT NULL,
  p_total_estimated_price numeric DEFAULT NULL,
  p_currency text DEFAULT 'RON',
  p_vendor_order_id text DEFAULT NULL,
  p_handoff_url text DEFAULT NULL,
  p_status text DEFAULT 'sent'
) RETURNS json AS $$
DECLARE result json;
BEGIN
  INSERT INTO grocery_orders (user_id, vendor_id, items, shopping_list_id, total_estimated_price, currency, vendor_order_id, handoff_url, status)
  VALUES (p_user_id, p_vendor_id, p_items, p_shopping_list_id, p_total_estimated_price, p_currency, p_vendor_order_id, p_handoff_url, p_status)
  RETURNING row_to_json(grocery_orders.*) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get single order
CREATE OR REPLACE FUNCTION get_grocery_order(p_user_id uuid, p_order_id uuid)
RETURNS json AS $$
  SELECT row_to_json(t) FROM (
    SELECT id, vendor_id, status, items, total_estimated_price, currency, created_at, updated_at, shopping_list_id, vendor_order_id, handoff_url
    FROM grocery_orders
    WHERE user_id = p_user_id AND id = p_order_id
  ) t;
$$ LANGUAGE sql SECURITY DEFINER;

-- Update order status
CREATE OR REPLACE FUNCTION update_grocery_order(p_user_id uuid, p_order_id uuid, p_status text DEFAULT NULL, p_vendor_order_id text DEFAULT NULL)
RETURNS json AS $$
DECLARE result json;
BEGIN
  UPDATE grocery_orders
  SET status = COALESCE(p_status, status),
      vendor_order_id = COALESCE(p_vendor_order_id, vendor_order_id),
      updated_at = now()
  WHERE user_id = p_user_id AND id = p_order_id;
  
  SELECT row_to_json(t) INTO result FROM (
    SELECT id, vendor_id, status, items, total_estimated_price, currency, created_at, updated_at
    FROM grocery_orders WHERE user_id = p_user_id AND id = p_order_id
  ) t;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- List substitution prefs
CREATE OR REPLACE FUNCTION get_substitution_prefs(p_user_id uuid)
RETURNS json AS $$
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  FROM (
    SELECT id, original_canonical, substitute_canonical, accepted, budget_tier, created_at
    FROM user_substitution_prefs
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
  ) t;
$$ LANGUAGE sql SECURITY DEFINER;

-- Upsert substitution pref
CREATE OR REPLACE FUNCTION upsert_substitution_pref(
  p_user_id uuid,
  p_original_canonical text,
  p_substitute_canonical text,
  p_accepted boolean DEFAULT true,
  p_budget_tier text DEFAULT 'normal'
) RETURNS json AS $$
DECLARE result json;
BEGIN
  INSERT INTO user_substitution_prefs (user_id, original_canonical, substitute_canonical, accepted, budget_tier)
  VALUES (p_user_id, p_original_canonical, p_substitute_canonical, p_accepted, p_budget_tier)
  ON CONFLICT (user_id, original_canonical, budget_tier) DO UPDATE SET
    substitute_canonical = EXCLUDED.substitute_canonical,
    accepted = EXCLUDED.accepted;
  
  SELECT row_to_json(t) INTO result FROM (
    SELECT id, original_canonical, substitute_canonical, accepted, budget_tier, created_at
    FROM user_substitution_prefs
    WHERE user_id = p_user_id AND original_canonical = p_original_canonical AND budget_tier = p_budget_tier
  ) t;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete substitution pref
CREATE OR REPLACE FUNCTION delete_substitution_pref(p_user_id uuid, p_id uuid DEFAULT NULL, p_original_canonical text DEFAULT NULL, p_budget_tier text DEFAULT NULL)
RETURNS json AS $$
BEGIN
  IF p_id IS NOT NULL THEN
    DELETE FROM user_substitution_prefs WHERE user_id = p_user_id AND id = p_id;
  ELSIF p_original_canonical IS NOT NULL THEN
    IF p_budget_tier IS NOT NULL THEN
      DELETE FROM user_substitution_prefs WHERE user_id = p_user_id AND original_canonical = p_original_canonical AND budget_tier = p_budget_tier;
    ELSE
      DELETE FROM user_substitution_prefs WHERE user_id = p_user_id AND original_canonical = p_original_canonical;
    END IF;
  END IF;
  RETURN json_build_object('ok', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to all roles
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role, authenticator;

SELECT 'Grocery RPC functions created successfully' AS status;
