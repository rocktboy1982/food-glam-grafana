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
ALTER TABLE shopping_list_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. Public Read Policies
-- ============================================================

-- Anyone can view profiles (public creator profiles)
CREATE POLICY "Public can view profiles" ON profiles
  FOR SELECT USING (true);

-- Anyone can view approaches (cooking styles)
CREATE POLICY "Public can view approaches" ON approaches
  FOR SELECT USING (true);

-- Anyone can view active posts (recipes)
CREATE POLICY "Public can view active posts" ON posts
  FOR SELECT USING (status = 'active');

-- Anyone can view recipes
CREATE POLICY "Public can view recipes" ON recipes
  FOR SELECT USING (true);

-- Anyone can view votes (to see vote counts)
CREATE POLICY "Public can view votes" ON votes
  FOR SELECT USING (true);

-- Anyone can view follows (public social graph)
CREATE POLICY "Public can view follows" ON follows
  FOR SELECT USING (true);

-- ============================================================
-- 3. User-Owned Data Policies
-- ============================================================

-- Users can manage their own collections
CREATE POLICY "Users can manage own collections" ON collections
  FOR ALL USING (auth.uid() = user_id);

-- Users can manage their own meal plans
CREATE POLICY "Users can manage own meal plans" ON meal_plans
  FOR ALL USING (auth.uid() = user_id);

-- Users can manage their own pantry
CREATE POLICY "Users can manage own pantry" ON pantry
  FOR ALL USING (auth.uid() = user_id);

-- Users can manage their own shopping lists
CREATE POLICY "Users can manage own shopping lists" ON shopping_lists
  FOR ALL USING (auth.uid() = user_id);

-- Users can view shared shopping lists (presence)
CREATE POLICY "Users can view shopping list presence" ON shopping_list_presence
  FOR SELECT USING (true);

-- Users can manage their presence in shopping lists
CREATE POLICY "Users can manage own presence" ON shopping_list_presence
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can view shopping list shares
CREATE POLICY "Public can view shopping list shares" ON shopping_list_shares
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- 4. Voting Policies
-- ============================================================

-- Authenticated users can create votes
CREATE POLICY "Authenticated users can vote" ON votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own votes
CREATE POLICY "Users can delete own votes" ON votes
  FOR DELETE USING (auth.uid() = user_id);

-- Users can update their own votes
CREATE POLICY "Users can update own votes" ON votes
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- 5. Follow Policies
-- ============================================================

-- Authenticated users can create follows
CREATE POLICY "Authenticated users can create follows" ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Users can delete their own follows
CREATE POLICY "Users can delete own follows" ON follows
  FOR DELETE USING (auth.uid() = follower_id);

-- ============================================================
-- 6. Submission Policies
-- ============================================================

-- Authenticated users can submit content
CREATE POLICY "Authenticated users can submit" ON submissions
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Users can view their own submissions
CREATE POLICY "Users can view own submissions" ON submissions
  FOR SELECT USING (auth.uid() = created_by);

-- Moderators and admins can view all submissions for moderation
CREATE POLICY "Moderators can view all submissions" ON submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM app_roles
      WHERE user_id = auth.uid()
      AND role IN ('moderator', 'admin')
    )
  );

-- Users can update their own submissions (if still pending)
CREATE POLICY "Users can update own pending submissions" ON submissions
  FOR UPDATE USING (auth.uid() = created_by AND status = 'pending');

-- Moderators can update submission status
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

-- Users can view their own roles
CREATE POLICY "Users can view own roles" ON app_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all roles
CREATE POLICY "Admins can view all roles" ON app_roles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM app_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Admins can manage roles
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

-- Only post creator can update their own posts
CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE USING (auth.uid() = created_by);

-- Only post creator can delete their own posts
CREATE POLICY "Users can delete own posts" ON posts
  FOR DELETE USING (auth.uid() = created_by);

-- Authenticated users can create posts
CREATE POLICY "Authenticated users can create posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- ============================================================
-- 9. Recipes Table Policies
-- ============================================================

-- Only creator can update their recipes
CREATE POLICY "Users can update own recipes" ON recipes
  FOR UPDATE USING (auth.uid() = created_by);

-- Only creator can delete their recipes
CREATE POLICY "Users can delete own recipes" ON recipes
  FOR DELETE USING (auth.uid() = created_by);

-- Authenticated users can create recipes
CREATE POLICY "Authenticated users can create recipes" ON recipes
  FOR INSERT WITH CHECK (auth.uid() = created_by);
