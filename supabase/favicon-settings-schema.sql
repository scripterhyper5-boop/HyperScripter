-- Favicon settings stored on site_settings singleton row
-- Run in Supabase SQL Editor AFTER site-settings-schema.sql

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS favicon JSONB DEFAULT NULL;

COMMENT ON COLUMN public.site_settings.favicon IS
  'Favicon config: { url, icon16Url, icon32Url, appleTouchIconUrl, type, updatedAt }';

NOTIFY pgrst, 'reload schema';
