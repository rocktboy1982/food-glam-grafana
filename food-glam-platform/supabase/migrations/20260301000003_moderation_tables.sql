-- ============================================================
-- MODULE 30: SUBMISSION + EDITOR + MODERATION QUEUE
-- Migration: Create moderation-related tables
-- ============================================================

-- 1. Extend posts.status to support full content lifecycle
-- Drop the old constraint and add the expanded one
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE posts ADD CONSTRAINT posts_status_check
  CHECK (status IN ('draft', 'pending_review', 'active', 'rejected', 'archived', 'deleted'));

-- Add extra columns the submission/moderation flow needs
ALTER TABLE posts ADD COLUMN IF NOT EXISTS type text DEFAULT 'recipe';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS hero_image_url text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS caption text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS recipe_json jsonb;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS diet_tags text[];
ALTER TABLE posts ADD COLUMN IF NOT EXISTS food_tags text[];
ALTER TABLE posts ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Unique slug index (only for non-null slugs)
CREATE UNIQUE INDEX IF NOT EXISTS posts_slug_unique_idx ON posts (slug) WHERE slug IS NOT NULL;

-- Index for moderation queue queries
CREATE INDEX IF NOT EXISTS posts_status_idx ON posts (status);
CREATE INDEX IF NOT EXISTS posts_created_by_idx ON posts (created_by);
CREATE INDEX IF NOT EXISTS posts_type_idx ON posts (type);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts (created_at DESC);

-- ============================================================
-- 2. POST REVISIONS (edit history)
-- ============================================================
CREATE TABLE IF NOT EXISTS post_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  summary text,
  snapshot jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS post_revisions_post_id_idx ON post_revisions (post_id);
CREATE INDEX IF NOT EXISTS post_revisions_created_at_idx ON post_revisions (created_at DESC);

-- ============================================================
-- 3. MODERATION ACTIONS (audit log for all moderation decisions)
-- ============================================================
CREATE TABLE IF NOT EXISTS moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('post', 'thread', 'reply', 'profile', 'image')),
  entity_id text NOT NULL,
  action text NOT NULL CHECK (action IN ('approve', 'reject', 'archive', 'restore', 'delete', 'lock', 'unlock', 'pin', 'unpin', 'hide', 'unhide')),
  reason text,
  acted_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scope_type text NOT NULL DEFAULT 'global' CHECK (scope_type IN ('global', 'channel')),
  scope_owner_id uuid REFERENCES profiles(id),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS moderation_actions_entity_idx ON moderation_actions (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS moderation_actions_acted_by_idx ON moderation_actions (acted_by);
CREATE INDEX IF NOT EXISTS moderation_actions_created_at_idx ON moderation_actions (created_at DESC);

-- ============================================================
-- 4. REPORTS (user content reports)
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('post', 'thread', 'reply', 'profile')),
  entity_id text NOT NULL,
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('spam', 'hate', 'harassment', 'copyright', 'misinfo', 'other')),
  details text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'closed')),
  scope_owner_id uuid REFERENCES profiles(id),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS reports_status_idx ON reports (status);
CREATE INDEX IF NOT EXISTS reports_entity_idx ON reports (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS reports_reporter_idx ON reports (reporter_id);

-- ============================================================
-- 5. USER BLOCKS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_blocks (
  blocker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (blocker_id, blocked_id)
);

-- ============================================================
-- 6. USER SANCTIONS (bans, suspensions, cooldowns)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_sanctions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('warn', 'cooldown', 'suspend', 'ban')),
  reason text,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expires_at timestamp with time zone,
  scope_type text NOT NULL DEFAULT 'global' CHECK (scope_type IN ('global', 'channel')),
  scope_owner_id uuid REFERENCES profiles(id),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS user_sanctions_user_id_idx ON user_sanctions (user_id);
CREATE INDEX IF NOT EXISTS user_sanctions_active_idx ON user_sanctions (user_id, type)
  WHERE expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP;

-- ============================================================
-- 7. USER MODERATION STATS (strike tracking for cooldowns)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_moderation_stats (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  strikes integer NOT NULL DEFAULT 0,
  last_strike_at timestamp with time zone,
  cooldown_until timestamp with time zone,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 8. ENABLE RLS ON ALL NEW TABLES
-- ============================================================
ALTER TABLE post_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sanctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_moderation_stats ENABLE ROW LEVEL SECURITY;

-- Permissive policies for local dev (match existing pattern)
CREATE POLICY "post_revisions_all" ON post_revisions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "moderation_actions_all" ON moderation_actions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "reports_all" ON reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "user_blocks_all" ON user_blocks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "user_sanctions_all" ON user_sanctions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "user_moderation_stats_all" ON user_moderation_stats FOR ALL USING (true) WITH CHECK (true);

-- Grant access to all roles
GRANT ALL ON post_revisions TO anon, authenticated, service_role;
GRANT ALL ON moderation_actions TO anon, authenticated, service_role;
GRANT ALL ON reports TO anon, authenticated, service_role;
GRANT ALL ON user_blocks TO anon, authenticated, service_role;
GRANT ALL ON user_sanctions TO anon, authenticated, service_role;
GRANT ALL ON user_moderation_stats TO anon, authenticated, service_role;
