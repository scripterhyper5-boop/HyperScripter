import { NextResponse } from "next/server";
import {
  deleteWorkspaceScript,
  listWorkspaceMemberScripts,
  setScriptWorkspaceShare,
} from "@/lib/db/workspaces";
import { teamApiErrorResponse } from "@/lib/team/api-error-response";
import { canManageScripts } from "@/lib/team/permissions";
import {
  isTeamAccessResult,
  requireTeamAccess,
} from "@/lib/team/require-team-access";

export async function GET() {
  try {
    const access = await requireTeamAccess();
    if (!isTeamAccessResult(access)) return access;

    const scripts = await listWorkspaceMemberScripts(access.workspace.id);
    return NextResponse.json({ scripts, role: access.role });
  } catch (error) {
    return teamApiErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const access = await requireTeamAccess();
    if (!isTeamAccessResult(access)) return access;

    const body = (await request.json()) as {
      scriptId?: string;
      shared?: boolean;
    };

    if (!body.scriptId || typeof body.shared !== "boolean") {
      return NextResponse.json(
        { error: "scriptId and shared are required" },
        { status: 400 }
      );
    }

    await setScriptWorkspaceShare(
      access.user.id,
      body.scriptId,
      body.shared,
      access.workspace.id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return teamApiErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const access = await requireTeamAccess();
    if (!isTeamAccessResult(access)) return access;

    if (!canManageScripts(access.role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const scriptId = searchParams.get("scriptId");
    if (!scriptId) {
      return NextResponse.json({ error: "scriptId is required" }, { status: 400 });
    }

    await deleteWorkspaceScript(scriptId, access.workspace.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return teamApiErrorResponse(error);
  }
}
