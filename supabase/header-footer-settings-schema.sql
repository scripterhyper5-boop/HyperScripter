-- Header & Footer CMS settings (singleton JSON document)
-- Run in Supabase SQL Editor AFTER schema.sql

CREATE TABLE IF NOT EXISTS public.header_footer_settings (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  settings    JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS header_footer_settings_singleton_idx
  ON public.header_footer_settings ((true));

DROP TRIGGER IF EXISTS header_footer_settings_updated_at ON public.header_footer_settings;
CREATE TRIGGER header_footer_settings_updated_at
  BEFORE UPDATE ON public.header_footer_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.header_footer_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service access header footer settings" ON public.header_footer_settings;
CREATE POLICY "Service access header footer settings"
  ON public.header_footer_settings FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
