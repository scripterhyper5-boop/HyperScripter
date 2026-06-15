-- HyperScripter — Email notification schema
-- Run in Supabase SQL Editor AFTER schema.sql

-- ---------------------------------------------------------------------------
-- email_settings (single row)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.email_settings (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  smtp_host       TEXT        NOT NULL DEFAULT '',
  smtp_port       INTEGER     NOT NULL DEFAULT 587,
  smtp_username   TEXT        NOT NULL DEFAULT '',
  smtp_password   TEXT        NOT NULL DEFAULT '',
  sender_name     TEXT        NOT NULL DEFAULT 'HyperScripter',
  sender_email    TEXT        NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS email_settings_singleton_idx
  ON public.email_settings ((true));

DROP TRIGGER IF EXISTS email_settings_updated_at ON public.email_settings;
CREATE TRIGGER email_settings_updated_at
  BEFORE UPDATE ON public.email_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- email_logs
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.email_logs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient     TEXT        NOT NULL,
  subject       TEXT        NOT NULL,
  status        TEXT        NOT NULL CHECK (status IN ('sent', 'failed')),
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_logs_status_idx
  ON public.email_logs (status);

CREATE INDEX IF NOT EXISTS email_logs_created_at_idx
  ON public.email_logs (created_at DESC);

-- ---------------------------------------------------------------------------
-- password_reset_tokens
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash TEXT        NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx
  ON public.password_reset_tokens (user_id);

CREATE INDEX IF NOT EXISTS password_reset_tokens_token_hash_idx
  ON public.password_reset_tokens (token_hash);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service access email settings" ON public.email_settings;
CREATE POLICY "Service access email settings"
  ON public.email_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service access email logs" ON public.email_logs;
CREATE POLICY "Service access email logs"
  ON public.email_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service access password reset tokens" ON public.password_reset_tokens;
CREATE POLICY "Service access password reset tokens"
  ON public.password_reset_tokens FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
