import { NextResponse } from "next/server";
import { getUserServerSession } from "@/lib/auth/session";
import { listWorkspaceMembers } from "@/lib/db/workspaces";
import { teamApiErrorResponse } from "@/lib/team/api-error-response";
import {
  isTeamAccessResult,
  requireTeamAccess,
} from "@/lib/team/require-team-access";
import { logTeamWorkspace } from "@/lib/team/workspace-log";

export async function GET() {
  try {
    const session = await getUserServerSession();

    logTeamWorkspace("GET /api/team/workspace", {
      userId: session?.user.id ?? null,
      plan: session?.user.plan ?? null,
      authenticated: Boolean(session),
    });

    const access = await requireTeamAccess();
    if (!isTeamAccessResult(access)) return access;

    const { workspace, role, user } = access;
    const members = await listWorkspaceMembers(workspace.id);
    const ownerMember = members.find((m) => m.userId === workspace.owner_id);

    logTeamWorkspace("GET /api/team/workspace.success", {
      userId: user.id,
      plan: user.plan,
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      ownerId: workspace.owner_id,
      ownerIdMatches: workspace.owner_id === user.id,
      memberCount: members.length,
      role,
    });

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        ownerId: workspace.owner_id,
        createdAt: workspace.created_at,
      },
      role,
      memberCount: members.length,
      owner: ownerMember
        ? {
            userId: ownerMember.userId,
            name: ownerMember.name,
            email: ownerMember.email,
          }
        : null,
    });
  } catch (error) {
    return teamApiErrorResponse(error);
  }
}
