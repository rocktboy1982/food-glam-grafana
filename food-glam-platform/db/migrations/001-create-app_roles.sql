-- Migration: create app_roles table for basic role checks

CREATE TABLE IF NOT EXISTS app_roles (
  user_id uuid PRIMARY KEY,
  role text NOT NULL,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE app_roles IS 'Simple app roles table: user_id -> role (user|moderator|admin)';

-- Note: Run this SQL against your Supabase/Postgres instance to create the table.
