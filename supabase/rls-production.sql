-- =============================================================================
-- HyperScripter — Production RLS hardening
-- Run in Supabase SQL Editor AFTER all other schema migrations.
--
-- Architecture:
--   • Next.js API routes use SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).
--   • Anon key is public (browser). It must NOT read/write private data.
--   • Custom HMAC cookie auth is enforced in API routes, NOT via auth.uid().
--   • Optional JWT policies below activate when you issue Supabase JWTs with
--     a `user_id` claim matching public.users.id (future enhancement).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helpers (JWT claim `user_id` or Supabase Auth uid)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.app_user_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    NULLIF(trim(auth.jwt() ->> 'user_id'), ''),
    NULLIF(auth.uid()::text, '')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = public.app_user_id()
      AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_row(row_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_app_admin()
    OR (public.app_user_id() IS NOT NULL AND row_user_id = public.app_user_id());
$$;

-- Reuse for support (same semantics)
CREATE OR REPLACE FUNCTION public.can_access_support_ticket(ticket_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.owns_row(ticket_user_id);
$$;

CREATE OR REPLACE FUNCTION public.is_support_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_app_admin();
$$;

-- ---------------------------------------------------------------------------
-- STEP 1: Drop ALL permissive USING (true) policies
-- (Optional tables are skipped if their migration has not been applied yet.)
-- ---------------------------------------------------------------------------

-- Core schema (schema.sql)
DROP POLICY IF EXISTS "Service access users" ON public.users;
DROP POLICY IF EXISTS "Service access subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Service access scripts" ON public.scripts;
DROP POLICY IF EXISTS "Service access blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Service access legal pages" ON public.legal_pages;
DROP POLICY IF EXISTS "Service access usage records" ON public.usage_records;
DROP POLICY IF EXISTS "Service access workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Service access workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Service access script exports" ON public.script_exports;

-- Optional migrations — safe when table does not exist yet
DO $drop_optional$ BEGIN
  IF to_regclass('public.referrals') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Service access referrals" ON public.referrals;
  END IF;
  IF to_regclass('public.affiliate_payouts') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Service access affiliate payouts" ON public.affiliate_payouts;
  END IF;
  IF to_regclass('public.affiliate_payment_methods') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Service access affiliate payment methods" ON public.affiliate_payment_methods;
  END IF;
  IF to_regclass('public.email_settings') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Service access email settings" ON public.email_settings;
  END IF;
  IF to_regclass('public.email_logs') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Service access email logs" ON public.email_logs;
  END IF;
  IF to_regclass('public.password_reset_tokens') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Service access password reset tokens" ON public.password_reset_tokens;
  END IF;
  IF to_regclass('public.ai_settings') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Service access ai settings" ON public.ai_settings;
  END IF;
  IF to_regclass('public.site_settings') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Service access site settings" ON public.site_settings;
  END IF;
  IF to_regclass('public.header_footer_settings') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Service access header footer settings" ON public.header_footer_settings;
  END IF;
  IF to_regclass('public.workspace_invitations') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Service access workspace invitations" ON public.workspace_invitations;
  END IF;
  IF to_regclass('public.support_tickets') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Service access support tickets" ON public.support_tickets;
  END IF;
  IF to_regclass('public.support_messages') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Service access support messages" ON public.support_messages;
  END IF;
END $drop_optional$;

-- ---------------------------------------------------------------------------
-- STEP 2: Public read — published content only (anon + authenticated)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Public read published blog posts" ON public.blog_posts;
CREATE POLICY "Public read published blog posts"
  ON public.blog_posts
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "Public read published legal pages" ON public.legal_pages;
CREATE POLICY "Public read published legal pages"
  ON public.legal_pages
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- ---------------------------------------------------------------------------
-- STEP 3: User-scoped policies (active when JWT carries user_id claim)
--         Service role bypasses RLS for all server API access today.
-- ---------------------------------------------------------------------------

-- users (profile: own row only; admin: all)
DROP POLICY IF EXISTS "Users read own profile" ON public.users;
CREATE POLICY "Users read own profile"
  ON public.users FOR SELECT TO authenticated
  USING (public.owns_row(id));

DROP POLICY IF EXISTS "Users update own profile" ON public.users;
CREATE POLICY "Users update own profile"
  ON public.users FOR UPDATE TO authenticated
  USING (id = public.app_user_id())
  WITH CHECK (id = public.app_user_id() AND role = (SELECT u.role FROM public.users u WHERE u.id = public.app_user_id()));

-- scripts
DROP POLICY IF EXISTS "Users manage own scripts" ON public.scripts;
CREATE POLICY "Users manage own scripts"
  ON public.scripts FOR ALL TO authenticated
  USING (public.owns_row(user_id))
  WITH CHECK (user_id = public.app_user_id() OR public.is_app_admin());

-- subscriptions
DROP POLICY IF EXISTS "Users read own subscriptions" ON public.subscriptions;
CREATE POLICY "Users read own subscriptions"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (public.owns_row(user_id));

-- referrals (referral-schema.sql)
DO $referrals$ BEGIN
  IF to_regclass('public.referrals') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Users read own referrals" ON public.referrals;
    CREATE POLICY "Users read own referrals"
      ON public.referrals FOR SELECT TO authenticated
      USING (public.owns_row(referrer_user_id));
  END IF;
END $referrals$;

-- affiliate_payouts (referral-schema.sql)
DO $payouts$ BEGIN
  IF to_regclass('public.affiliate_payouts') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Users read own payouts" ON public.affiliate_payouts;
    CREATE POLICY "Users read own payouts"
      ON public.affiliate_payouts FOR SELECT TO authenticated
      USING (public.owns_row(user_id));
  END IF;
END $payouts$;

-- affiliate_payment_methods (affiliate-payment-methods.sql)
DO $payment_methods$ BEGIN
  IF to_regclass('public.affiliate_payment_methods') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Users manage own payment methods" ON public.affiliate_payment_methods;
    CREATE POLICY "Users manage own payment methods"
      ON public.affiliate_payment_methods FOR ALL TO authenticated
      USING (public.owns_row(user_id))
      WITH CHECK (user_id = public.app_user_id() OR public.is_app_admin());
  END IF;
END $payment_methods$;

-- usage_records
DROP POLICY IF EXISTS "Users read own usage" ON public.usage_records;
CREATE POLICY "Users read own usage"
  ON public.usage_records FOR SELECT TO authenticated
  USING (public.owns_row(user_id));

-- script_exports
DROP POLICY IF EXISTS "Users manage own exports" ON public.script_exports;
CREATE POLICY "Users manage own exports"
  ON public.script_exports FOR ALL TO authenticated
  USING (public.owns_row(user_id))
  WITH CHECK (user_id = public.app_user_id() OR public.is_app_admin());

-- workspaces (owner or member)
DROP POLICY IF EXISTS "Users access own workspaces" ON public.workspaces;
CREATE POLICY "Users access own workspaces"
  ON public.workspaces FOR SELECT TO authenticated
  USING (
    public.is_app_admin()
    OR owner_id = public.app_user_id()
    OR EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspaces.id
        AND wm.user_id = public.app_user_id()
    )
  );

DROP POLICY IF EXISTS "Users access workspace members" ON public.workspace_members;
CREATE POLICY "Users access workspace members"
  ON public.workspace_members FOR SELECT TO authenticated
  USING (
    public.is_app_admin()
    OR user_id = public.app_user_id()
    OR EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
        AND wm.user_id = public.app_user_id()
    )
  );

-- support (support-schema.sql)
DO $support$ BEGIN
  IF to_regclass('public.support_tickets') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Users select own support tickets" ON public.support_tickets;
    CREATE POLICY "Users select own support tickets"
      ON public.support_tickets FOR SELECT TO authenticated
      USING (public.can_access_support_ticket(user_id));

    DROP POLICY IF EXISTS "Users insert own support tickets" ON public.support_tickets;
    CREATE POLICY "Users insert own support tickets"
      ON public.support_tickets FOR INSERT TO authenticated
      WITH CHECK (user_id = public.app_user_id());

    DROP POLICY IF EXISTS "Users update own support tickets" ON public.support_tickets;
    CREATE POLICY "Users update own support tickets"
      ON public.support_tickets FOR UPDATE TO authenticated
      USING (public.can_access_support_ticket(user_id))
      WITH CHECK (public.can_access_support_ticket(user_id));

    DROP POLICY IF EXISTS "Admins manage all support tickets" ON public.support_tickets;
    CREATE POLICY "Admins manage all support tickets"
      ON public.support_tickets FOR ALL TO authenticated
      USING (public.is_support_admin())
      WITH CHECK (public.is_support_admin());
  END IF;

  IF to_regclass('public.support_messages') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Users select own support messages" ON public.support_messages;
    CREATE POLICY "Users select own support messages"
      ON public.support_messages FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.support_tickets t
          WHERE t.id = support_messages.ticket_id
            AND public.can_access_support_ticket(t.user_id)
        )
      );

    DROP POLICY IF EXISTS "Users insert own support messages" ON public.support_messages;
    CREATE POLICY "Users insert own support messages"
      ON public.support_messages FOR INSERT TO authenticated
      WITH CHECK (
        sender_id = public.app_user_id()
        AND EXISTS (
          SELECT 1 FROM public.support_tickets t
          WHERE t.id = support_messages.ticket_id
            AND t.user_id = public.app_user_id()
        )
      );

    DROP POLICY IF EXISTS "Admins manage all support messages" ON public.support_messages;
    CREATE POLICY "Admins manage all support messages"
      ON public.support_messages FOR ALL TO authenticated
      USING (public.is_support_admin())
      WITH CHECK (public.is_support_admin());
  END IF;
END $support$;

-- Admin-only tables: no policies = deny for anon/authenticated
-- (ai_settings, email_settings, email_logs, password_reset_tokens,
--  site_settings, header_footer_settings)
--
-- workspace_invitations: run team-workspace.sql first, then re-run STEP 1
-- block above (or this full script) to drop its permissive policy.

NOTIFY pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Post-migration checklist:
-- 1. Set SUPABASE_SERVICE_ROLE_KEY in Vercel + .env.local (required)
-- 2. Re-run: node scripts/rls-verify.mjs (expect DENIED on sensitive tables)
-- 3. Smoke-test login, generate, billing, support, admin panel
-- 4. Support realtime (browser anon) will stop receiving postgres_changes
--    until you add polling or issue per-user Supabase JWTs for realtime.
