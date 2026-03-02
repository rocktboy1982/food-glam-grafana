-- Migration: Create test auth users for MVP testing
-- Note: Auth users are created here, app roles are created in seed file after profiles are seeded

-- Create test auth users
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES
  (
    'a0000000-0000-0000-0000-000000000001',
    'chef_anna@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now()
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    'mike@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now()
  ),
  (
    'a0000000-0000-0000-0000-000000000003',
    'sarah@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now()
  )
ON CONFLICT (id) DO NOTHING;

-- Create matching profiles for test users
INSERT INTO profiles (id, email, username, display_name)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'chef_anna@example.com', 'chef_anna', 'Chef Anna'),
  ('a0000000-0000-0000-0000-000000000002', 'mike@example.com', 'mike', 'Mike'),
  ('a0000000-0000-0000-0000-000000000003', 'sarah@example.com', 'sarah', 'Sarah')
ON CONFLICT (id) DO NOTHING;
