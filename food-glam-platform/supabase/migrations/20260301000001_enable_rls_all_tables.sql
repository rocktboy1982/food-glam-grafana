-- Migration: Enable Row Level Security (RLS) for all tables

-- ============================================================
-- 1. Enable RLS on all tables
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE approaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE pantry ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuisines ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_vendor_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_grocery_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_product_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_substitution_prefs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. Public Read Policies
-- ============================================================

DROP POLICY IF EXISTS "Public can view profiles" ON profiles;
CREATE POLICY "Public can view profiles" ON profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view approaches" ON approaches;
CREATE POLICY "Public can view approaches" ON approaches
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view active posts" ON posts;
CREATE POLICY "Public can view active posts" ON posts
  FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Public can view recipes" ON recipes;
CREATE POLICY "Public can view recipes" ON recipes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view votes" ON votes;
CREATE POLICY "Public can view votes" ON votes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view follows" ON follows;
CREATE POLICY "Public can view follows" ON follows
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "cuisines_select" ON cuisines;
CREATE POLICY "cuisines_select" ON cuisines FOR SELECT USING (true);

DROP POLICY IF EXISTS "food_styles_select" ON food_styles;
CREATE POLICY "food_styles_select" ON food_styles FOR SELECT USING (true);

-- ============================================================
-- 3. User-Owned Data Policies
-- ============================================================

DROP POLICY IF EXISTS "Users can manage own collections" ON collections;
CREATE POLICY "Users can manage own collections" ON collections
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own meal plans" ON meal_plans;
CREATE POLICY "Users can manage own meal plans" ON meal_plans
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own pantry" ON pantry;
CREATE POLICY "Users can manage own pantry" ON pantry
  FOR ALL USING (auth.uid() = user_id);

-- Shopping tables: permissive (auth is handled in API routes via mock-user)
DROP POLICY IF EXISTS "Users can manage own shopping lists" ON shopping_lists;
CREATE POLICY "Users can manage own shopping lists" ON shopping_lists
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Shopping list items full access" ON shopping_list_items;
CREATE POLICY "Shopping list items full access" ON shopping_list_items
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view shopping list presence" ON shopping_list_presence;
CREATE POLICY "Users can view shopping list presence" ON shopping_list_presence
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can manage own presence" ON shopping_list_presence;

DROP POLICY IF EXISTS "Public can view shopping list shares" ON shopping_list_shares;
CREATE POLICY "Public can view shopping list shares" ON shopping_list_shares
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- 4. Voting Policies
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can vote" ON votes;
CREATE POLICY "Authenticated users can vote" ON votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own votes" ON votes;
CREATE POLICY "Users can delete own votes" ON votes
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own votes" ON votes;
CREATE POLICY "Users can update own votes" ON votes
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- 5. Follow Policies
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can create follows" ON follows;
CREATE POLICY "Authenticated users can create follows" ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can delete own follows" ON follows;
CREATE POLICY "Users can delete own follows" ON follows
  FOR DELETE USING (auth.uid() = follower_id);

-- ============================================================
-- 6. Submission Policies
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can submit" ON submissions;
CREATE POLICY "Authenticated users can submit" ON submissions
  FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can view own submissions" ON submissions;
CREATE POLICY "Users can view own submissions" ON submissions
  FOR SELECT USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Moderators can view all submissions" ON submissions;
CREATE POLICY "Moderators can view all submissions" ON submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM app_roles
      WHERE user_id = auth.uid()
      AND role IN ('moderator', 'admin')
    )
  );

DROP POLICY IF EXISTS "Users can update own pending submissions" ON submissions;
CREATE POLICY "Users can update own pending submissions" ON submissions
  FOR UPDATE USING (auth.uid() = created_by AND status = 'pending');

DROP POLICY IF EXISTS "Moderators can update submissions" ON submissions;
CREATE POLICY "Moderators can update submissions" ON submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM app_roles
      WHERE user_id = auth.uid()
      AND role IN ('moderator', 'admin')
    )
  );

-- ============================================================
-- 7. App Roles Policies
-- ============================================================

DROP POLICY IF EXISTS "Users can view own roles" ON app_roles;
CREATE POLICY "Users can view own roles" ON app_roles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON app_roles;
CREATE POLICY "Admins can view all roles" ON app_roles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM app_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can manage roles" ON app_roles;
CREATE POLICY "Admins can manage roles" ON app_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM app_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================================
-- 8. Posts (Recipes) Policies for Creators
-- ============================================================

DROP POLICY IF EXISTS "Users can update own posts" ON posts;
CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
CREATE POLICY "Users can delete own posts" ON posts
  FOR DELETE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;
CREATE POLICY "Authenticated users can create posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- ============================================================
-- 9. Recipes Table Policies
-- ============================================================

DROP POLICY IF EXISTS "Users can update own recipes" ON recipes;
CREATE POLICY "Users can update own recipes" ON recipes
  FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete own recipes" ON recipes;
CREATE POLICY "Users can delete own recipes" ON recipes
  FOR DELETE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Authenticated users can create recipes" ON recipes;
CREATE POLICY "Authenticated users can create recipes" ON recipes
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- ============================================================
-- 10. Grocery Module Policies
-- ============================================================

-- Grocery vendors: public read
DROP POLICY IF EXISTS "Public can view grocery vendors" ON grocery_vendors;
CREATE POLICY "Public can view grocery vendors" ON grocery_vendors
  FOR SELECT USING (true);

-- Grocery tables: permissive (auth handled in API routes via mock-user)
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
