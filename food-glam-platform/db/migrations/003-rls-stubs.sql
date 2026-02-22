-- Migration: RLS policy stubs for key tables (examples only)

-- Enable RLS on `recipes` and `posts` and provide policy examples.
-- NOTE: Review, adapt, and run these in your Supabase/Postgres environment.

-- recipes table: allow owners to insert/update/delete their own recipes, public read
ALTER TABLE IF EXISTS recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS recipes_public_read ON recipes FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS recipes_owner_manage ON recipes FOR ALL USING (auth.uid() = created_by);

-- posts table: moderators can update status; owners can insert their own posts
ALTER TABLE IF EXISTS posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS posts_insert_own ON posts FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY IF NOT EXISTS posts_moderator_update ON posts FOR UPDATE USING (EXISTS (SELECT 1 FROM app_roles ar WHERE ar.user_id = auth.uid() AND ar.role = 'moderator')) WITH CHECK (true);

-- shopping_lists example: owner-only access
ALTER TABLE IF EXISTS shopping_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS shopping_lists_owner ON shopping_lists FOR ALL USING (auth.uid() = user_id);

-- Reminder: Add indexes and review policies to match your app's role model.
