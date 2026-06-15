-- SEO settings stored on site_settings singleton row
-- Run in Supabase SQL Editor AFTER site-settings-schema.sql

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS seo_settings JSONB DEFAULT NULL;

COMMENT ON COLUMN public.site_settings.seo_settings IS
  'Global SEO config: titles, OG, verification, analytics, schema JSON';

NOTIFY pgrst, 'reload schema';
