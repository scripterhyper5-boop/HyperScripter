import { NextResponse } from "next/server";
import { getScriptShareStatus } from "@/lib/db/workspaces";
import {
  isTeamAccessResult,
  requireTeamAccess,
} from "@/lib/team/require-team-access";

export async function GET(request: Request) {
  const access = await requireTeamAccess();
  if (!isTeamAccessResult(access)) return access;

  const { searchParams } = new URL(request.url);
  const scriptId = searchParams.get("scriptId");
  if (!scriptId) {
    return NextResponse.json({ error: "scriptId is required" }, { status: 400 });
  }

  const status = await getScriptShareStatus(access.user.id, scriptId);
  return NextResponse.json(status);
}
