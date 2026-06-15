import { NextResponse } from "next/server";
import { getWorkspaceMemberScript } from "@/lib/db/workspaces";
import {
  isTeamAccessResult,
  requireTeamAccess,
} from "@/lib/team/require-team-access";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const access = await requireTeamAccess();
  if (!isTeamAccessResult(access)) return access;

  const { id } = await context.params;
  const result = await getWorkspaceMemberScript(access.workspace.id, id);

  if (!result) {
    return NextResponse.json({ error: "Script not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
