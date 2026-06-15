import "server-only";

import { getUserById } from "@/lib/db/users";
import {
  getMemberRole,
  getWorkspaceByOwnerId,
  getWorkspaceMembershipForUser,
} from "@/lib/db/workspaces";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseServerConfigured } from "@/lib/supabase/server";

export interface TeamWorkspaceDebugState {
  user: {
    id: string;
    email: string;
    name: string;
    plan: string;
    role: string;
  } | null;
  plan: string | null;
  workspaceExists: boolean;
  workspaceId: string | null;
  ownerId: string | null;
  ownerIdMatchesUser: boolean;
  membershipExists: boolean;
  membershipRole: string | null;
  supabase: {
    configured: boolean;
    clientReady: boolean;
    usingServiceRole: boolean;
  };
  lookup: {
    ownedWorkspaceFound: boolean;
    membershipWorkspaceFound: boolean;
  };
  lastError: string | null;
}

export async function getTeamWorkspaceDebugState(
  userId: string
): Promise<TeamWorkspaceDebugState> {
  const account = await getUserById(userId);
  const supabase = createServerSupabaseClient();
  let lastError: string | null = null;

  let owned: Awaited<ReturnType<typeof getWorkspaceByOwnerId>> = null;
  let membership: Awaited<ReturnType<typeof getWorkspaceMembershipForUser>> = null;

  try {
    owned = await getWorkspaceByOwnerId(userId);
  } catch (error) {
    lastError =
      error instanceof Error ? error.message : "Failed to query owned workspace";
  }

  try {
    membership = await getWorkspaceMembershipForUser(userId);
  } catch (error) {
    lastError =
      error instanceof Error ? error.message : "Failed to query membership";
  }

  const workspace = owned ?? membership?.workspaces ?? null;
  let membershipRole: string | null = null;

  if (workspace) {
    try {
      membershipRole = await getMemberRole(workspace.id, userId);
    } catch (error) {
      lastError =
        error instanceof Error ? error.message : "Failed to query member role";
    }
  }

  return {
    user: account
      ? {
          id: account.user.id,
          email: account.user.email,
          name: account.user.name,
          plan: account.user.plan,
          role: account.user.role ?? "user",
        }
      : null,
    plan: account?.user.plan ?? null,
    workspaceExists: Boolean(workspace),
    workspaceId: workspace?.id ?? null,
    ownerId: workspace?.owner_id ?? null,
    ownerIdMatchesUser: workspace?.owner_id === userId,
    membershipExists: Boolean(membershipRole),
    membershipRole,
    supabase: {
      configured: isSupabaseServerConfigured(),
      clientReady: Boolean(supabase),
      usingServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    },
    lookup: {
      ownedWorkspaceFound: Boolean(owned),
      membershipWorkspaceFound: Boolean(membership?.workspaces),
    },
    lastError,
  };
}
