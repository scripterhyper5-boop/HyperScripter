-- Team workspace extensions
-- Run in Supabase SQL Editor after schema.sql

-- Shared scripts: link scripts to a workspace
ALTER TABLE public.scripts
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;

ALTER TABLE public.scripts
  ADD COLUMN IF NOT EXISTS shared_with_workspace BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS scripts_workspace_id_idx ON public.scripts (workspace_id);
CREATE INDEX IF NOT EXISTS scripts_shared_workspace_idx
  ON public.scripts (workspace_id, shared_with_workspace)
  WHERE shared_with_workspace = true;

-- Workspace invitations
CREATE TABLE IF NOT EXISTS public.workspace_invitations (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email         TEXT        NOT NULL,
  role          TEXT        NOT NULL DEFAULT 'member'
                            CHECK (role IN ('owner', 'admin', 'member')),
  token         TEXT        NOT NULL,
  status        TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'accepted', 'expired')),
  invited_by    TEXT        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ NOT NULL,

  CONSTRAINT workspace_invitations_token_unique UNIQUE (token),
  CONSTRAINT workspace_invitations_email_lowercase CHECK (email = lower(email))
);

CREATE INDEX IF NOT EXISTS workspace_invitations_workspace_id_idx
  ON public.workspace_invitations (workspace_id);
CREATE INDEX IF NOT EXISTS workspace_invitations_email_idx
  ON public.workspace_invitations (email);
CREATE INDEX IF NOT EXISTS workspace_invitations_token_idx
  ON public.workspace_invitations (token);
CREATE INDEX IF NOT EXISTS workspace_invitations_status_idx
  ON public.workspace_invitations (status);

ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service access workspace invitations" ON public.workspace_invitations;
CREATE POLICY "Service access workspace invitations"
  ON public.workspace_invitations FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
