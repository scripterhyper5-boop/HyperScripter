import { NextResponse } from "next/server";
import { acceptWorkspaceInvitation } from "@/lib/db/workspaces";
import { getUserServerSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const session = await getUserServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { token?: string };
    if (!body.token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const workspaceId = await acceptWorkspaceInvitation(body.token, session.user.id);
    return NextResponse.json({ success: true, workspaceId });
  } catch (error) {
    console.error("[POST /api/team/invitations/accept]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to accept invitation" },
      { status: 400 }
    );
  }
}
