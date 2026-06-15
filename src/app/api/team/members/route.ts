import { NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/db/users";
import {
  createWorkspaceInvitation,
  listWorkspaceInvitations,
  listWorkspaceMembers,
  removeWorkspaceMember,
  updateMemberRole,
} from "@/lib/db/workspaces";
import { teamApiErrorResponse } from "@/lib/team/api-error-response";
import {
  canChangeMemberRole,
  canManageMembers,
  canRemoveMember,
} from "@/lib/team/permissions";
import {
  isTeamAccessResult,
  requireTeamAccess,
} from "@/lib/team/require-team-access";
import type { WorkspaceRole } from "@/lib/team/types";

export async function GET() {
  try {
    const access = await requireTeamAccess();
    if (!isTeamAccessResult(access)) return access;

    const members = await listWorkspaceMembers(access.workspace.id);
    const invitations = await listWorkspaceInvitations(access.workspace.id);

    return NextResponse.json({
      members,
      invitations: invitations.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        status: inv.status,
        createdAt: inv.created_at,
        expiresAt: inv.expires_at,
      })),
    });
  } catch (error) {
    return teamApiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireTeamAccess();
    if (!isTeamAccessResult(access)) return access;

    if (!canManageMembers(access.role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const body = (await request.json()) as { email?: string; role?: WorkspaceRole };
    const email = body.email?.trim().toLowerCase();
    const role = body.role ?? "member";

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    if (role === "owner") {
      return NextResponse.json({ error: "Cannot invite as owner" }, { status: 400 });
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      const members = await listWorkspaceMembers(access.workspace.id);
      if (members.some((m) => m.userId === existingUser.userId)) {
        return NextResponse.json(
          { error: "User is already a workspace member" },
          { status: 409 }
        );
      }
    }

    const invitation = await createWorkspaceInvitation({
      workspaceId: access.workspace.id,
      email,
      role,
      invitedBy: access.user.id,
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        createdAt: invitation.created_at,
        expiresAt: invitation.expires_at,
        acceptUrl: `${baseUrl}/dashboard/team/accept?token=${invitation.token}`,
      },
    });
  } catch (error) {
    return teamApiErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const access = await requireTeamAccess();
    if (!isTeamAccessResult(access)) return access;

    const body = (await request.json()) as {
      memberId?: string;
      role?: WorkspaceRole;
    };

    if (!body.memberId || !body.role) {
      return NextResponse.json({ error: "memberId and role are required" }, { status: 400 });
    }

    const members = await listWorkspaceMembers(access.workspace.id);
    const target = members.find((m) => m.id === body.memberId);
    if (!target) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (!canChangeMemberRole(access.role, target.role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    await updateMemberRole(body.memberId, access.workspace.id, body.role);
    return NextResponse.json({ success: true });
  } catch (error) {
    return teamApiErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const access = await requireTeamAccess();
    if (!isTeamAccessResult(access)) return access;

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json({ error: "memberId is required" }, { status: 400 });
    }

    const members = await listWorkspaceMembers(access.workspace.id);
    const target = members.find((m) => m.id === memberId);
    if (!target) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (!canRemoveMember(access.role, target.role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    await removeWorkspaceMember(memberId, access.workspace.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return teamApiErrorResponse(error);
  }
}
