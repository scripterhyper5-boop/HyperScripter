-- Site-wide HTML snippets (head / body injection)
-- Run in Supabase SQL Editor AFTER schema.sql

CREATE TABLE IF NOT EXISTS public.site_settings (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  head_code       TEXT        NOT NULL DEFAULT '',
  body_start_code TEXT        NOT NULL DEFAULT '',
  body_end_code   TEXT        NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enforce a single configuration row
CREATE UNIQUE INDEX IF NOT EXISTS site_settings_singleton_idx
  ON public.site_settings ((true));

DROP TRIGGER IF EXISTS site_settings_updated_at ON public.site_settings;
CREATE TRIGGER site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service access site settings" ON public.site_settings;
CREATE POLICY "Service access site settings"
  ON public.site_settings FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
