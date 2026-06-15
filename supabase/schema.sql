-- =============================================================================
-- HyperScripter — production Supabase schema
-- Run once in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.users (
  id            TEXT        PRIMARY KEY,
  full_name     TEXT        NOT NULL,
  email         TEXT        NOT NULL,
  password_hash TEXT,
  role          TEXT        NOT NULL DEFAULT 'user'
                            CHECK (role IN ('user', 'admin')),
  plan          TEXT        NOT NULL DEFAULT 'free'
                            CHECK (plan IN ('free', 'pro', 'team')),
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT users_email_unique UNIQUE (email),
  CONSTRAINT users_email_lowercase CHECK (email = lower(email)),
  CONSTRAINT users_email_format CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

CREATE INDEX IF NOT EXISTS users_email_idx ON public.users (email);
CREATE INDEX IF NOT EXISTS users_role_idx ON public.users (role);
CREATE INDEX IF NOT EXISTS users_plan_idx ON public.users (plan);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON public.users (created_at DESC);

DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                TEXT        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan                   TEXT        NOT NULL CHECK (plan IN ('free', 'pro', 'team')),
  status                 TEXT        NOT NULL DEFAULT 'active'
                                     CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  current_period_end     TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions (user_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON public.subscriptions (status);
CREATE INDEX IF NOT EXISTS subscriptions_user_created_idx ON public.subscriptions (user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_stripe_subscription_id_idx
  ON public.subscriptions (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- scripts
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.scripts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  niche       TEXT,
  video_type  TEXT,
  tone        TEXT,
  hook_style  TEXT,
  content     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scripts_user_id_idx ON public.scripts (user_id);
CREATE INDEX IF NOT EXISTS scripts_created_at_idx ON public.scripts (created_at DESC);
CREATE INDEX IF NOT EXISTS scripts_user_created_idx ON public.scripts (user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- blog_posts
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  slug        TEXT        NOT NULL,
  excerpt     TEXT,
  content     TEXT        NOT NULL DEFAULT '',
  status      TEXT        NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft', 'published')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT blog_posts_slug_unique UNIQUE (slug),
  CONSTRAINT blog_posts_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE INDEX IF NOT EXISTS blog_posts_slug_idx ON public.blog_posts (slug);
CREATE INDEX IF NOT EXISTS blog_posts_status_idx ON public.blog_posts (status);
CREATE INDEX IF NOT EXISTS blog_posts_published_idx
  ON public.blog_posts (status, updated_at DESC)
  WHERE status = 'published';

DROP TRIGGER IF EXISTS blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- legal_pages
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.legal_pages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  slug        TEXT        NOT NULL,
  content     TEXT        NOT NULL DEFAULT '',
  status      TEXT        NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft', 'published')),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT legal_pages_slug_unique UNIQUE (slug),
  CONSTRAINT legal_pages_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE INDEX IF NOT EXISTS legal_pages_slug_idx ON public.legal_pages (slug);
CREATE INDEX IF NOT EXISTS legal_pages_status_idx ON public.legal_pages (status);
CREATE INDEX IF NOT EXISTS legal_pages_published_idx
  ON public.legal_pages (status, updated_at DESC)
  WHERE status = 'published';

DROP TRIGGER IF EXISTS legal_pages_updated_at ON public.legal_pages;
CREATE TRIGGER legal_pages_updated_at
  BEFORE UPDATE ON public.legal_pages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- usage_records
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.usage_records (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action      TEXT        NOT NULL,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS usage_records_user_id_idx ON public.usage_records (user_id);
CREATE INDEX IF NOT EXISTS usage_records_action_idx ON public.usage_records (action);
CREATE INDEX IF NOT EXISTS usage_records_user_created_idx
  ON public.usage_records (user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- workspaces
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.workspaces (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL,
  owner_id    TEXT        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT workspaces_slug_unique UNIQUE (slug),
  CONSTRAINT workspaces_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT workspaces_name_not_empty CHECK (length(trim(name)) > 0)
);

CREATE INDEX IF NOT EXISTS workspaces_owner_id_idx ON public.workspaces (owner_id);
CREATE INDEX IF NOT EXISTS workspaces_slug_idx ON public.workspaces (slug);
CREATE INDEX IF NOT EXISTS workspaces_created_at_idx ON public.workspaces (created_at DESC);

-- ---------------------------------------------------------------------------
-- workspace_members
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.workspace_members (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id       TEXT        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role          TEXT        NOT NULL DEFAULT 'member'
                            CHECK (role IN ('owner', 'admin', 'member')),
  joined_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT workspace_members_unique UNIQUE (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS workspace_members_workspace_id_idx
  ON public.workspace_members (workspace_id);
CREATE INDEX IF NOT EXISTS workspace_members_user_id_idx
  ON public.workspace_members (user_id);
CREATE INDEX IF NOT EXISTS workspace_members_role_idx
  ON public.workspace_members (role);

-- ---------------------------------------------------------------------------
-- script_exports
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.script_exports (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id   UUID        NOT NULL REFERENCES public.scripts(id) ON DELETE CASCADE,
  user_id     TEXT        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  format      TEXT        NOT NULL CHECK (format IN ('txt', 'pdf', 'docx', 'json')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS script_exports_script_id_idx ON public.script_exports (script_id);
CREATE INDEX IF NOT EXISTS script_exports_user_id_idx ON public.script_exports (user_id);
CREATE INDEX IF NOT EXISTS script_exports_created_at_idx ON public.script_exports (created_at DESC);
CREATE INDEX IF NOT EXISTS script_exports_user_created_idx
  ON public.script_exports (user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scripts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_pages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_records      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.script_exports     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published blog posts" ON public.blog_posts;
CREATE POLICY "Public read published blog posts"
  ON public.blog_posts FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Public read published legal pages" ON public.legal_pages;
CREATE POLICY "Public read published legal pages"
  ON public.legal_pages FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Service access users" ON public.users;
CREATE POLICY "Service access users"
  ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service access subscriptions" ON public.subscriptions;
CREATE POLICY "Service access subscriptions"
  ON public.subscriptions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service access scripts" ON public.scripts;
CREATE POLICY "Service access scripts"
  ON public.scripts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service access blog posts" ON public.blog_posts;
CREATE POLICY "Service access blog posts"
  ON public.blog_posts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service access legal pages" ON public.legal_pages;
CREATE POLICY "Service access legal pages"
  ON public.legal_pages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service access usage records" ON public.usage_records;
CREATE POLICY "Service access usage records"
  ON public.usage_records FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service access workspaces" ON public.workspaces;
CREATE POLICY "Service access workspaces"
  ON public.workspaces FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service access workspace members" ON public.workspace_members;
CREATE POLICY "Service access workspace members"
  ON public.workspace_members FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service access script exports" ON public.script_exports;
CREATE POLICY "Service access script exports"
  ON public.script_exports FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
