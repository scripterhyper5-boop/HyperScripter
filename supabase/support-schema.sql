-- =============================================================================
-- HyperScripter — Support ticket schema
-- Run in Supabase SQL Editor AFTER schema.sql:
-- https://supabase.com/dashboard/project/_/sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper functions for RLS (Supabase Auth JWT)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.auth_user_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NULLIF(auth.uid()::text, '');
$$;

CREATE OR REPLACE FUNCTION public.is_support_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = public.auth_user_id()
      AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_support_ticket(ticket_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_support_admin()
    OR ticket_user_id = public.auth_user_id();
$$;

-- ---------------------------------------------------------------------------
-- support_tickets
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             TEXT        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name                TEXT        NOT NULL,
  email               TEXT        NOT NULL,
  subject             TEXT        NOT NULL,
  status              TEXT        NOT NULL DEFAULT 'open'
                                  CHECK (status IN ('open', 'in_progress', 'answered', 'closed')),
  user_unread_count   INTEGER     NOT NULL DEFAULT 0 CHECK (user_unread_count >= 0),
  admin_unread_count  INTEGER     NOT NULL DEFAULT 0 CHECK (admin_unread_count >= 0),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT support_tickets_email_lowercase CHECK (email = lower(email)),
  CONSTRAINT support_tickets_subject_not_empty CHECK (length(trim(subject)) > 0)
);

CREATE INDEX IF NOT EXISTS support_tickets_user_id_idx
  ON public.support_tickets (user_id);

CREATE INDEX IF NOT EXISTS support_tickets_status_idx
  ON public.support_tickets (status);

CREATE INDEX IF NOT EXISTS support_tickets_created_at_idx
  ON public.support_tickets (created_at DESC);

CREATE INDEX IF NOT EXISTS support_tickets_updated_at_idx
  ON public.support_tickets (updated_at DESC);

CREATE INDEX IF NOT EXISTS support_tickets_user_created_idx
  ON public.support_tickets (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS support_tickets_user_unread_idx
  ON public.support_tickets (user_id, user_unread_count)
  WHERE user_unread_count > 0;

CREATE INDEX IF NOT EXISTS support_tickets_admin_unread_idx
  ON public.support_tickets (admin_unread_count)
  WHERE admin_unread_count > 0;

DROP TRIGGER IF EXISTS support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- support_messages
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.support_messages (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id     UUID        NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_type   TEXT        NOT NULL CHECK (sender_type IN ('user', 'admin')),
  sender_id     TEXT        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body          TEXT        NOT NULL,
  read_by_user  BOOLEAN     NOT NULL DEFAULT false,
  read_by_admin BOOLEAN     NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT support_messages_body_not_empty CHECK (length(trim(body)) > 0)
);

CREATE INDEX IF NOT EXISTS support_messages_ticket_id_idx
  ON public.support_messages (ticket_id);

CREATE INDEX IF NOT EXISTS support_messages_ticket_created_idx
  ON public.support_messages (ticket_id, created_at ASC);

CREATE INDEX IF NOT EXISTS support_messages_sender_id_idx
  ON public.support_messages (sender_id);

CREATE INDEX IF NOT EXISTS support_messages_created_at_idx
  ON public.support_messages (created_at DESC);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.support_tickets  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Drop legacy permissive policies (from support.sql if partially applied)
DROP POLICY IF EXISTS "Service access support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Service access support messages" ON public.support_messages;

-- Authenticated users: own tickets only
DROP POLICY IF EXISTS "Users select own support tickets" ON public.support_tickets;
CREATE POLICY "Users select own support tickets"
  ON public.support_tickets
  FOR SELECT
  TO authenticated
  USING (public.can_access_support_ticket(user_id));

DROP POLICY IF EXISTS "Users insert own support tickets" ON public.support_tickets;
CREATE POLICY "Users insert own support tickets"
  ON public.support_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = public.auth_user_id());

DROP POLICY IF EXISTS "Users update own support tickets" ON public.support_tickets;
CREATE POLICY "Users update own support tickets"
  ON public.support_tickets
  FOR UPDATE
  TO authenticated
  USING (public.can_access_support_ticket(user_id))
  WITH CHECK (public.can_access_support_ticket(user_id));

-- Admins: full ticket access (authenticated + admin role)
DROP POLICY IF EXISTS "Admins manage all support tickets" ON public.support_tickets;
CREATE POLICY "Admins manage all support tickets"
  ON public.support_tickets
  FOR ALL
  TO authenticated
  USING (public.is_support_admin())
  WITH CHECK (public.is_support_admin());

-- Messages: readable if parent ticket is accessible
DROP POLICY IF EXISTS "Users select own support messages" ON public.support_messages;
CREATE POLICY "Users select own support messages"
  ON public.support_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.support_tickets t
      WHERE t.id = support_messages.ticket_id
        AND public.can_access_support_ticket(t.user_id)
    )
  );

DROP POLICY IF EXISTS "Users insert own support messages" ON public.support_messages;
CREATE POLICY "Users insert own support messages"
  ON public.support_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = public.auth_user_id()
    AND EXISTS (
      SELECT 1
      FROM public.support_tickets t
      WHERE t.id = support_messages.ticket_id
        AND t.user_id = public.auth_user_id()
    )
  );

DROP POLICY IF EXISTS "Admins manage all support messages" ON public.support_messages;
CREATE POLICY "Admins manage all support messages"
  ON public.support_messages
  FOR ALL
  TO authenticated
  USING (public.is_support_admin())
  WITH CHECK (public.is_support_admin());

-- Server API access (anon key fallback — auth enforced in Next.js API routes)
-- Prefer SUPABASE_SERVICE_ROLE_KEY in production (bypasses RLS automatically).
DROP POLICY IF EXISTS "Service access support tickets" ON public.support_tickets;
CREATE POLICY "Service access support tickets"
  ON public.support_tickets
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service access support messages" ON public.support_messages;
CREATE POLICY "Service access support messages"
  ON public.support_messages
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Realtime (postgres_changes)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Verification (run manually after migration)
-- ---------------------------------------------------------------------------
-- SELECT * FROM public.support_tickets LIMIT 1;
-- SELECT * FROM public.support_messages LIMIT 1;
