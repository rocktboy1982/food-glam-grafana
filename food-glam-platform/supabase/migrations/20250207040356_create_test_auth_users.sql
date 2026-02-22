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
