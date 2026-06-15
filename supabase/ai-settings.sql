-- AI provider settings (encrypted API keys)
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.ai_settings (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider    TEXT        NOT NULL,
  api_key     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT ai_settings_provider_unique UNIQUE (provider)
);

CREATE INDEX IF NOT EXISTS ai_settings_provider_idx ON public.ai_settings (provider);

ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service access ai settings" ON public.ai_settings;
CREATE POLICY "Service access ai settings"
  ON public.ai_settings FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
