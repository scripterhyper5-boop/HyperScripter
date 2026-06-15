import { NextResponse } from "next/server";
import { getUserServerSession } from "@/lib/auth/session";
import { getTeamWorkspaceDebugState } from "@/lib/team/workspace-debug";
import { logTeamWorkspace } from "@/lib/team/workspace-log";

export async function GET() {
  const session = await getUserServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = await getTeamWorkspaceDebugState(session.user.id);

  logTeamWorkspace("GET /api/debug/team", {
    userId: session.user.id,
    plan: state.plan,
    workspaceExists: state.workspaceExists,
    workspaceId: state.workspaceId,
    membershipExists: state.membershipExists,
    ownerIdMatchesUser: state.ownerIdMatchesUser,
    usingServiceRole: state.supabase.usingServiceRole,
  });

  return NextResponse.json({
    user: state.user,
    plan: state.plan,
    workspaceExists: state.workspaceExists,
    workspaceId: state.workspaceId,
    ownerId: state.ownerId,
    ownerIdMatchesUser: state.ownerIdMatchesUser,
    membershipExists: state.membershipExists,
    membershipRole: state.membershipRole,
    supabase: state.supabase,
    lookup: state.lookup,
    lastError: state.lastError,
  });
}
