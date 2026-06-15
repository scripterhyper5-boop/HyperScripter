import { NextResponse } from "next/server";
import { updateWorkspaceName } from "@/lib/db/workspaces";
import { canManageWorkspaceSettings } from "@/lib/team/permissions";
import {
  isTeamAccessResult,
  requireTeamAccess,
} from "@/lib/team/require-team-access";

export async function PATCH(request: Request) {
  const access = await requireTeamAccess();
  if (!isTeamAccessResult(access)) return access;

  if (!canManageWorkspaceSettings(access.role)) {
    return NextResponse.json({ error: "Only the owner can update settings" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { name?: string };
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Workspace name is required" }, { status: 400 });
    }

    const workspace = await updateWorkspaceName(access.workspace.id, body.name);
    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        ownerId: workspace.owner_id,
        createdAt: workspace.created_at,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update settings" },
      { status: 500 }
    );
  }
}
