import { NextResponse } from "next/server";
import { getTeamAnalytics } from "@/lib/db/workspaces";
import { teamApiErrorResponse } from "@/lib/team/api-error-response";
import {
  isTeamAccessResult,
  requireTeamAccess,
} from "@/lib/team/require-team-access";

export async function GET() {
  try {
    const access = await requireTeamAccess();
    if (!isTeamAccessResult(access)) return access;

    const analytics = await getTeamAnalytics(access.workspace.id);
    return NextResponse.json(analytics);
  } catch (error) {
    return teamApiErrorResponse(error);
  }
}
