-- HyperScripter — seeded admin account
-- Run in Supabase SQL Editor after schema.sql
--
-- Email:    admin@hyperscripter.com
-- Password: admin123  (bcrypt, 12 rounds — same as src/lib/auth/password.ts)
-- Hash:     $2b$12$NuSyEiuGFodKJ9NISf/xmudCfJImLSxCbYKjh7FlwNz/bQtkAls.6

INSERT INTO public.users (
  id,
  full_name,
  email,
  password_hash,
  role,
  plan,
  created_at,
  updated_at
) VALUES (
  'a1000000-0000-4000-8000-000000000001',
  'HyperScripter Admin',
  'admin@hyperscripter.com',
  '$2b$12$NuSyEiuGFodKJ9NISf/xmudCfJImLSxCbYKjh7FlwNz/bQtkAls.6',
  'admin',
  'team',
  now(),
  now()
)
ON CONFLICT (email) DO UPDATE SET
  full_name     = EXCLUDED.full_name,
  password_hash = EXCLUDED.password_hash,
  role          = EXCLUDED.role,
  plan          = EXCLUDED.plan,
  updated_at    = now();

INSERT INTO public.subscriptions (user_id, plan, status)
SELECT
  'a1000000-0000-4000-8000-000000000001',
  'team',
  'active'
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscriptions
  WHERE user_id = 'a1000000-0000-4000-8000-000000000001'
);

NOTIFY pgrst, 'reload schema';
