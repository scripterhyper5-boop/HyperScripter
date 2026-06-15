-- DEPRECATED — use supabase/rls-production.sql instead (full audit + user-scoped policies).
--
-- RLS hardening for production (run AFTER reviewing support realtime needs)
-- Removes permissive anon/authenticated access on sensitive tables.
-- Server-side code uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS.

-- Revoke broad policies (service role still has full access)
DROP POLICY IF EXISTS "Service access users" ON public.users;
DROP POLICY IF EXISTS "Service access subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Service access scripts" ON public.scripts;
DROP POLICY IF EXISTS "Service access blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Service access legal pages" ON public.legal_pages;
DROP POLICY IF EXISTS "Service access usage records" ON public.usage_records;
DROP POLICY IF EXISTS "Service access workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Service access workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Service access script exports" ON public.script_exports;

-- Deny direct anon writes on all tables (reads only where explicitly allowed below)
-- Blog and legal: published content readable by anon (public site)
-- All other tables: no anon/authenticated policies = deny by default

-- IMPORTANT: After running this, verify:
-- 1. All API routes use createServerSupabaseClient() with service role in production
-- 2. Browser Supabase client (support realtime) uses scoped policies only
-- 3. Run full auth/billing/support smoke tests

NOTIFY pgrst, 'reload schema';
