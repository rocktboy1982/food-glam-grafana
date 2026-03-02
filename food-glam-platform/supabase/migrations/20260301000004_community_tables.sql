-- ============================================================
-- MODULE 08: COMMUNITY FORUM
-- Migration: Create threads, replies, and channel_settings
-- ============================================================

-- 1. THREADS TABLE
CREATE TABLE IF NOT EXISTS threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'hidden')),
  is_pinned boolean NOT NULL DEFAULT false,
  is_locked boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS threads_channel_id_idx ON threads (channel_id);
CREATE INDEX IF NOT EXISTS threads_author_id_idx ON threads (author_id);
CREATE INDEX IF NOT EXISTS threads_status_idx ON threads (status);
CREATE INDEX IF NOT EXISTS threads_created_at_idx ON threads (created_at DESC);

-- 2. REPLIES TABLE
CREATE TABLE IF NOT EXISTS replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'hidden')),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS replies_thread_id_idx ON replies (thread_id);
CREATE INDEX IF NOT EXISTS replies_author_id_idx ON replies (author_id);
CREATE INDEX IF NOT EXISTS replies_status_idx ON replies (status);

-- 3. CHANNEL SETTINGS TABLE
CREATE TABLE IF NOT EXISTS channel_settings (
  owner_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  discord_invite_url text,
  community_enabled boolean NOT NULL DEFAULT true,
  community_mode text NOT NULL DEFAULT 'open' CHECK (community_mode IN ('disabled', 'open', 'moderated'))
);

-- 4. ENABLE RLS
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_settings ENABLE ROW LEVEL SECURITY;

-- Permissive policies for local dev
CREATE POLICY "threads_all" ON threads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "replies_all" ON replies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "channel_settings_all" ON channel_settings FOR ALL USING (true) WITH CHECK (true);

-- Grant access
GRANT ALL ON threads TO anon, authenticated, service_role;
GRANT ALL ON replies TO anon, authenticated, service_role;
GRANT ALL ON channel_settings TO anon, authenticated, service_role;
