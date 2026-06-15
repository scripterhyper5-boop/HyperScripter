import "server-only";

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/admin";
import { getUserServerSession } from "@/lib/auth/session";
import {
  ensureOwnerMembership,
  ensureTeamWorkspaceForUser,
  getMemberRole,
  getWorkspaceForUser,
  userHasTeamPlan,
} from "@/lib/db/workspaces";
import { WorkspaceCreationError } from "@/lib/team/workspace-errors";
import { logTeamWorkspace } from "@/lib/team/workspace-log";
import type { WorkspaceRole } from "@/lib/team/types";

export type TeamAccess = {
  user: NonNullable<Awaited<ReturnType<typeof getUserServerSession>>>["user"];
  workspace: NonNullable<Awaited<ReturnType<typeof getWorkspaceForUser>>>;
  role: WorkspaceRole;
};

function workspacePreparingResponse(details?: Record<string, unknown>) {
  return NextResponse.json(
    {
      error: "Workspace is being prepared.",
      code: "WORKSPACE_INITIALIZING",
      ...(details ? { details } : {}),
    },
    { status: 503 }
  );
}

function workspaceCreationFailedResponse(error: WorkspaceCreationError) {
  logTeamWorkspace("requireTeamAccess.creation_failed", {
    userId: error.details.userId,
    stage: error.details.stage,
    supabaseCode: error.details.supabaseCode,
    supabaseMessage: error.details.supabaseMessage,
  });

  return NextResponse.json(
    {
      error: error.message,
      code: "WORKSPACE_CREATION_FAILED",
      details: error.details,
    },
    { status: 500 }
  );
}

export async function requireTeamAccess(): Promise<
  TeamAccess | NextResponse<{ error: string; code?: string }>
> {
  const session = await getUserServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  let workspace = await getWorkspaceForUser(user.id);
  const hasTeam = userHasTeamPlan(user) || isAdmin(user);

  logTeamWorkspace("requireTeamAccess.start", {
    userId: user.id,
    plan: user.plan,
    workspaceFound: Boolean(workspace),
    workspaceId: workspace?.id ?? null,
    hasTeamPlan: hasTeam,
  });

  if (!workspace && hasTeam) {
    try {
      workspace = await ensureTeamWorkspaceForUser(user.id, user.name);
      logTeamWorkspace("requireTeamAccess.after_ensure", {
        userId: user.id,
        plan: user.plan,
        workspaceFound: Boolean(workspace),
        workspaceId: workspace?.id ?? null,
        workspaceCreated: true,
        ownerIdMatches: workspace?.owner_id === user.id,
      });
    } catch (error) {
      if (error instanceof WorkspaceCreationError) {
        return workspaceCreationFailedResponse(error);
      }

      logTeamWorkspace("requireTeamAccess.unexpected_error", {
        userId: user.id,
        plan: user.plan,
        message: error instanceof Error ? error.message : String(error),
      });

      return workspacePreparingResponse({
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  if (!workspace) {
    if (!hasTeam) {
      return NextResponse.json(
        { error: "Team plan required" },
        { status: 403 }
      );
    }
    return workspacePreparingResponse();
  }

  if (workspace.owner_id !== user.id && !hasTeam) {
    logTeamWorkspace("requireTeamAccess.invited_member", {
      userId: user.id,
      plan: user.plan,
      workspaceId: workspace.id,
      ownerId: workspace.owner_id,
    });
  }

  let role = await getMemberRole(workspace.id, user.id);

  if (!role && workspace.owner_id === user.id) {
    const membershipCreated = await ensureOwnerMembership(workspace.id, user.id);
    role = "owner";
    logTeamWorkspace("requireTeamAccess.owner_membership_repaired", {
      userId: user.id,
      workspaceId: workspace.id,
      membershipCreated,
    });
  }

  if (!role) {
    logTeamWorkspace("requireTeamAccess.no_membership", {
      userId: user.id,
      plan: user.plan,
      workspaceId: workspace.id,
    });
    return NextResponse.json(
      { error: "You are not a member of this workspace" },
      { status: 403 }
    );
  }

  logTeamWorkspace("requireTeamAccess.granted", {
    userId: user.id,
    plan: user.plan,
    workspaceId: workspace.id,
    role,
    ownerIdMatches: workspace.owner_id === user.id,
    membershipExists: true,
  });

  return { user, workspace, role };
}

export function isTeamAccessResult(
  result: TeamAccess | NextResponse
): result is TeamAccess {
  return "workspace" in result;
}
