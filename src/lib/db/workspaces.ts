import "server-only";

import { randomBytes } from "crypto";
import type { User } from "@/lib/auth/types";
import { isAdmin } from "@/lib/auth/admin";
import { getUserById } from "@/lib/db/users";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  WorkspaceCreationError,
  workspaceErrorFromSupabase,
} from "@/lib/team/workspace-errors";
import { logTeamWorkspace } from "@/lib/team/workspace-log";
import type {
  InvitationStatus,
  WorkspaceRole,
} from "@/lib/team/types";

export interface DbWorkspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  created_at: string;
}

export interface DbWorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  joined_at: string;
}

export interface DbWorkspaceInvitation {
  id: string;
  workspace_id: string;
  email: string;
  role: WorkspaceRole;
  token: string;
  status: InvitationStatus;
  invited_by: string;
  created_at: string;
  expires_at: string;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function userHasTeamPlan(user: User): boolean {
  return user.plan === "team" || isAdmin(user);
}

export async function getWorkspaceByOwnerId(ownerId: string) {
  const supabase = createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as DbWorkspace | null;
}

export async function getWorkspaceMembershipForUser(userId: string) {
  const supabase = createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("workspace_members")
    .select("*, workspaces(*)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as (DbWorkspaceMember & { workspaces: DbWorkspace }) | null;
}

export async function getWorkspaceForUser(userId: string) {
  const membership = await getWorkspaceMembershipForUser(userId);
  if (membership?.workspaces) return membership.workspaces;

  const owned = await getWorkspaceByOwnerId(userId);
  return owned;
}

export async function getMemberRole(
  workspaceId: string,
  userId: string
): Promise<WorkspaceRole | null> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data?.role as WorkspaceRole) ?? null;
}

export async function createWorkspaceForUser(
  userId: string,
  fullName: string
): Promise<DbWorkspace> {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    throw new WorkspaceCreationError("Database not configured", {
      stage: "supabase_client",
      userId,
    });
  }

  const existing = await getWorkspaceByOwnerId(userId);
  if (existing) {
    logTeamWorkspace("createWorkspaceForUser.existing", {
      userId,
      workspaceId: existing.id,
      ownerId: existing.owner_id,
      ownerIdMatches: existing.owner_id === userId,
    });
    await ensureOwnerMembership(existing.id, userId);
    return existing;
  }

  const name = `${fullName.trim() || "Team"}'s Workspace`;
  const baseSlug = slugify(fullName) || "workspace";
  const slug = `${baseSlug}-${userId.slice(0, 8)}`;

  logTeamWorkspace("createWorkspaceForUser.inserting", {
    userId,
    name,
    slug,
  });

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .insert({ name, slug, owner_id: userId })
    .select("*")
    .single();

  if (workspaceError) {
    if (workspaceError.code === "23505") {
      const owned = await getWorkspaceByOwnerId(userId);
      if (owned) {
        await ensureOwnerMembership(owned.id, userId);
        logTeamWorkspace("createWorkspaceForUser.duplicate_resolved", {
          userId,
          workspaceId: owned.id,
        });
        return owned;
      }
    }

    logTeamWorkspace("createWorkspaceForUser.workspace_insert_failed", {
      userId,
      code: workspaceError.code,
      message: workspaceError.message,
      hint: workspaceError.hint,
    });

    throw workspaceErrorFromSupabase(
      `Failed to create workspace: ${workspaceError.message}`,
      "workspace_insert",
      workspaceError,
      userId
    );
  }

  logTeamWorkspace("createWorkspaceForUser.workspace_created", {
    userId,
    workspaceId: workspace.id,
    ownerId: workspace.owner_id,
    ownerIdMatches: workspace.owner_id === userId,
  });

  const membershipCreated = await ensureOwnerMembership(workspace.id, userId);

  if (!membershipCreated) {
    const role = await getMemberRole(workspace.id, userId);
    if (!role) {
      throw new WorkspaceCreationError(
        "Workspace was created but owner membership could not be verified",
        {
          stage: "membership_verify",
          userId,
          supabaseMessage: "No membership row found after insert",
        }
      );
    }
  }

  logTeamWorkspace("createWorkspaceForUser.complete", {
    userId,
    workspaceId: workspace.id,
    membershipCreated,
  });

  return workspace as DbWorkspace;
}

export async function ensureOwnerMembership(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    throw new WorkspaceCreationError("Database not configured", {
      stage: "supabase_client",
      userId,
    });
  }

  const existing = await getMemberRole(workspaceId, userId);
  if (existing) {
    logTeamWorkspace("ensureOwnerMembership.exists", {
      userId,
      workspaceId,
      role: existing,
    });
    return false;
  }

  const { error } = await supabase.from("workspace_members").insert({
    workspace_id: workspaceId,
    user_id: userId,
    role: "owner",
  });

  if (error) {
    if (error.code === "23505") {
      logTeamWorkspace("ensureOwnerMembership.duplicate", { userId, workspaceId });
      return false;
    }

    logTeamWorkspace("ensureOwnerMembership.failed", {
      userId,
      workspaceId,
      code: error.code,
      message: error.message,
      hint: error.hint,
    });

    throw workspaceErrorFromSupabase(
      `Failed to create workspace membership: ${error.message}`,
      "membership_insert",
      error,
      userId
    );
  }

  logTeamWorkspace("ensureOwnerMembership.created", { userId, workspaceId });
  return true;
}

export async function ensureTeamWorkspaceForUser(
  userId: string,
  fullName: string
): Promise<DbWorkspace> {
  const account = await getUserById(userId);
  const plan = account?.user.plan ?? "unknown";

  logTeamWorkspace("ensureTeamWorkspaceForUser.start", {
    userId,
    plan,
    fullName,
  });

  const owned = await getWorkspaceByOwnerId(userId);
  if (owned) {
    const membershipCreated = await ensureOwnerMembership(owned.id, userId);
    logTeamWorkspace("ensureTeamWorkspaceForUser.found_owned", {
      userId,
      plan,
      workspaceId: owned.id,
      workspaceFound: true,
      workspaceCreated: false,
      membershipCreated,
      ownerIdMatches: owned.owner_id === userId,
    });
    return owned;
  }

  const membership = await getWorkspaceMembershipForUser(userId);
  if (membership?.workspaces) {
    logTeamWorkspace("ensureTeamWorkspaceForUser.found_membership", {
      userId,
      plan,
      workspaceId: membership.workspaces.id,
      workspaceFound: true,
      workspaceCreated: false,
      membershipCreated: false,
      ownerIdMatches: membership.workspaces.owner_id === userId,
    });
    return membership.workspaces;
  }

  if (!account || !userHasTeamPlan(account.user)) {
    logTeamWorkspace("ensureTeamWorkspaceForUser.plan_denied", {
      userId,
      plan,
      workspaceFound: false,
    });
    throw new WorkspaceCreationError("Team plan required to create a workspace", {
      stage: "plan_check",
      userId,
    });
  }

  const workspace = await createWorkspaceForUser(
    userId,
    fullName || account.user.name
  );

  logTeamWorkspace("ensureTeamWorkspaceForUser.created", {
    userId,
    plan,
    workspaceId: workspace.id,
    workspaceFound: false,
    workspaceCreated: true,
    ownerIdMatches: workspace.owner_id === userId,
  });

  return workspace;
}

export async function listWorkspaceMembers(workspaceId: string) {
  const supabase = createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("workspace_members")
    .select("id, user_id, role, joined_at, users(id, full_name, email, avatar_url)")
    .eq("workspace_id", workspaceId)
    .order("joined_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const member = row as unknown as DbWorkspaceMember & {
      users: {
        id: string;
        full_name: string;
        email: string;
        avatar_url: string | null;
      };
    };
    return {
      id: member.id,
      userId: member.user_id,
      name: member.users.full_name,
      email: member.users.email,
      avatarUrl: member.users.avatar_url,
      role: member.role,
      joinedAt: member.joined_at,
      initials: initials(member.users.full_name || member.users.email),
    };
  });
}

function isSupabaseSchemaMissing(error: { code?: string; message?: string }): boolean {
  const message = error.message ?? "";
  return (
    error.code === "PGRST205" ||
    error.code === "42703" ||
    message.includes("Could not find the table") ||
    message.includes("does not exist")
  );
}

export async function listWorkspaceInvitations(workspaceId: string) {
  const supabase = createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("workspace_invitations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    if (isSupabaseSchemaMissing(error)) {
      console.warn(
        "[listWorkspaceInvitations] workspace_invitations table missing — run supabase/team-workspace.sql"
      );
      return [];
    }
    throw new Error(error.message);
  }
  return (data ?? []) as DbWorkspaceInvitation[];
}

export async function createWorkspaceInvitation(input: {
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  invitedBy: string;
}) {
  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");

  const email = input.email.trim().toLowerCase();
  if (input.role === "owner") {
    throw new Error("Cannot invite as owner");
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const token = randomBytes(32).toString("hex");

  const { data, error } = await supabase
    .from("workspace_invitations")
    .insert({
      workspace_id: input.workspaceId,
      email,
      role: input.role,
      token,
      status: "pending",
      invited_by: input.invitedBy,
      expires_at: expiresAt.toISOString(),
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as DbWorkspaceInvitation;
}

export async function acceptWorkspaceInvitation(token: string, userId: string) {
  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");

  const account = await getUserById(userId);
  if (!account) throw new Error("User not found");

  const { data: invite, error: inviteError } = await supabase
    .from("workspace_invitations")
    .select("*")
    .eq("token", token)
    .eq("status", "pending")
    .maybeSingle();

  if (inviteError) throw new Error(inviteError.message);
  if (!invite) throw new Error("Invitation not found or already used");

  const invitation = invite as DbWorkspaceInvitation;

  if (new Date(invitation.expires_at) < new Date()) {
    await supabase
      .from("workspace_invitations")
      .update({ status: "expired" })
      .eq("id", invitation.id);
    throw new Error("Invitation has expired");
  }

  if (invitation.email !== account.email.toLowerCase()) {
    throw new Error("This invitation was sent to a different email address");
  }

  const existingMember = await getMemberRole(invitation.workspace_id, userId);
  if (existingMember) {
    await supabase
      .from("workspace_invitations")
      .update({ status: "accepted" })
      .eq("id", invitation.id);
    return invitation.workspace_id;
  }

  const { error: memberError } = await supabase.from("workspace_members").insert({
    workspace_id: invitation.workspace_id,
    user_id: userId,
    role: invitation.role,
  });

  if (memberError) throw new Error(memberError.message);

  await supabase
    .from("workspace_invitations")
    .update({ status: "accepted" })
    .eq("id", invitation.id);

  return invitation.workspace_id;
}

export async function updateMemberRole(
  memberId: string,
  workspaceId: string,
  role: WorkspaceRole
) {
  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");
  if (role === "owner") throw new Error("Cannot assign owner role");

  const { error } = await supabase
    .from("workspace_members")
    .update({ role })
    .eq("id", memberId)
    .eq("workspace_id", workspaceId);

  if (error) throw new Error(error.message);
}

export async function removeWorkspaceMember(memberId: string, workspaceId: string) {
  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");

  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("id", memberId)
    .eq("workspace_id", workspaceId);

  if (error) throw new Error(error.message);
}

export async function updateWorkspaceName(workspaceId: string, name: string) {
  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");

  const trimmed = name.trim();
  if (!trimmed) throw new Error("Workspace name is required");

  const { data, error } = await supabase
    .from("workspaces")
    .update({ name: trimmed })
    .eq("id", workspaceId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as DbWorkspace;
}

export async function listWorkspaceMemberScripts(workspaceId: string) {
  const supabase = createServerSupabaseClient();
  if (!supabase) return [];

  const members = await listWorkspaceMembers(workspaceId);
  const memberIds = members.map((m) => m.userId);
  if (memberIds.length === 0) return [];

  const userMap = new Map(members.map((m) => [m.userId, m.name]));

  const { data, error } = await supabase
    .from("scripts")
    .select("id, user_id, title, video_type, tone, content, created_at, shared_with_workspace")
    .in("user_id", memberIds)
    .order("created_at", { ascending: false });

  if (error) {
    if (isSupabaseSchemaMissing(error)) {
      console.warn(
        "[listWorkspaceMemberScripts] shared_with_workspace column missing — retrying without it. Run supabase/team-workspace.sql"
      );

      const fallback = await supabase
        .from("scripts")
        .select("id, user_id, title, video_type, tone, content, created_at")
        .in("user_id", memberIds)
        .order("created_at", { ascending: false });

      if (fallback.error) {
        console.error("[listWorkspaceMemberScripts]", fallback.error);
        throw new Error(fallback.error.message);
      }

      return (fallback.data ?? []).map((row) => {
        const content = row.content as { output?: { hook?: string } } | null;
        const hook = content?.output?.hook ?? "";
        return {
          id: row.id as string,
          title: row.title as string,
          authorId: row.user_id as string,
          authorName: userMap.get(row.user_id as string) ?? "Unknown",
          videoType: (row.video_type as string | null) ?? null,
          tone: (row.tone as string | null) ?? null,
          createdAt: row.created_at as string,
          hook,
          shared: false,
        };
      });
    }

    console.error("[listWorkspaceMemberScripts]", error);
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const content = row.content as { output?: { hook?: string } } | null;
    const hook = content?.output?.hook ?? "";
    return {
      id: row.id as string,
      title: row.title as string,
      authorId: row.user_id as string,
      authorName: userMap.get(row.user_id as string) ?? "Unknown",
      videoType: (row.video_type as string | null) ?? null,
      tone: (row.tone as string | null) ?? null,
      createdAt: row.created_at as string,
      hook,
      shared: Boolean(row.shared_with_workspace),
    };
  });
}

export async function listSharedWorkspaceScripts(workspaceId: string) {
  const supabase = createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("scripts")
    .select("id, user_id, title, video_type, tone, content, created_at")
    .eq("workspace_id", workspaceId)
    .eq("shared_with_workspace", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const userIds = [...new Set((data ?? []).map((s) => s.user_id))];
  const userMap = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name, email")
      .in("id", userIds);

    for (const user of users ?? []) {
      userMap.set(user.id, user.full_name || user.email);
    }
  }

  return (data ?? []).map((row) => {
    const content = row.content as { output?: { hook?: string } } | null;
    const hook = content?.output?.hook ?? "";
    return {
      id: row.id as string,
      title: row.title as string,
      authorId: row.user_id as string,
      authorName: userMap.get(row.user_id as string) ?? "Unknown",
      videoType: (row.video_type as string | null) ?? null,
      tone: (row.tone as string | null) ?? null,
      createdAt: row.created_at as string,
      hook,
    };
  });
}

export async function setScriptWorkspaceShare(
  userId: string,
  scriptId: string,
  shared: boolean,
  workspaceId: string
) {
  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");

  const { data, error } = await supabase
    .from("scripts")
    .update({
      shared_with_workspace: shared,
      workspace_id: shared ? workspaceId : null,
    })
    .eq("id", scriptId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Script not found");
}

export async function deleteWorkspaceScript(
  scriptId: string,
  workspaceId: string
) {
  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");

  const members = await listWorkspaceMembers(workspaceId);
  const memberIds = members.map((m) => m.userId);
  if (memberIds.length === 0) throw new Error("Script not found");

  const { error } = await supabase
    .from("scripts")
    .delete()
    .eq("id", scriptId)
    .in("user_id", memberIds);

  if (error) {
    console.error("[deleteWorkspaceScript]", error);
    throw new Error("Failed to delete script");
  }
}

export async function deleteSharedScript(
  scriptId: string,
  workspaceId: string
) {
  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");

  const { error } = await supabase
    .from("scripts")
    .delete()
    .eq("id", scriptId)
    .eq("workspace_id", workspaceId)
    .eq("shared_with_workspace", true);

  if (error) throw new Error(error.message);
}

export async function getScriptShareStatus(userId: string, scriptId: string) {
  const supabase = createServerSupabaseClient();
  if (!supabase) return { shared: false };

  const { data, error } = await supabase
    .from("scripts")
    .select("shared_with_workspace")
    .eq("id", scriptId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return { shared: Boolean(data?.shared_with_workspace) };
}

export async function getWorkspaceMemberScript(
  workspaceId: string,
  scriptId: string
) {
  const supabase = createServerSupabaseClient();
  if (!supabase) return null;

  const members = await listWorkspaceMembers(workspaceId);
  const memberIds = members.map((m) => m.userId);
  if (memberIds.length === 0) return null;

  const { data, error } = await supabase
    .from("scripts")
    .select("*")
    .eq("id", scriptId)
    .in("user_id", memberIds)
    .maybeSingle();

  if (error) {
    console.error("[getWorkspaceMemberScript]", error);
    return null;
  }
  if (!data) return null;

  const { dbScriptToHistoryItem } = await import("@/lib/db/mappers");
  const script = dbScriptToHistoryItem(
    data as import("@/lib/supabase/types").DbScript
  );

  const member = members.find((m) => m.userId === data.user_id);
  return {
    script,
    authorName: member?.name ?? "Unknown",
  };
}

export async function getWorkspaceSharedScript(
  workspaceId: string,
  scriptId: string
) {
  const supabase = createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("scripts")
    .select("*")
    .eq("id", scriptId)
    .eq("workspace_id", workspaceId)
    .eq("shared_with_workspace", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const { dbScriptToHistoryItem } = await import("@/lib/db/mappers");
  const script = dbScriptToHistoryItem(
    data as import("@/lib/supabase/types").DbScript
  );

  const { data: author } = await supabase
    .from("users")
    .select("full_name, email")
    .eq("id", data.user_id)
    .maybeSingle();

  return {
    script,
    authorName: author?.full_name ?? author?.email ?? "Unknown",
  };
}

export async function getTeamAnalytics(workspaceId: string) {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return {
      totalMembers: 0,
      scriptsGenerated: 0,
      scriptsThisMonth: 0,
      mostActiveMember: null,
    };
  }

  const members = await listWorkspaceMembers(workspaceId);
  const memberIds = members.map((m) => m.userId);

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  let scriptsGenerated = 0;
  let scriptsThisMonth = 0;

  if (memberIds.length > 0) {
    const { count: totalCount } = await supabase
      .from("scripts")
      .select("*", { count: "exact", head: true })
      .in("user_id", memberIds);

    const { count: monthCount } = await supabase
      .from("scripts")
      .select("*", { count: "exact", head: true })
      .in("user_id", memberIds)
      .gte("created_at", monthStart.toISOString());

    scriptsGenerated = totalCount ?? 0;
    scriptsThisMonth = monthCount ?? 0;
  }

  let mostActiveMember: { name: string; count: number } | null = null;

  if (memberIds.length > 0) {
    const { data: scripts } = await supabase
      .from("scripts")
      .select("user_id")
      .in("user_id", memberIds);

    const counts = new Map<string, number>();
    for (const script of scripts ?? []) {
      const uid = script.user_id as string;
      counts.set(uid, (counts.get(uid) ?? 0) + 1);
    }

    let topId: string | null = null;
    let topCount = 0;
    for (const [uid, count] of counts) {
      if (count > topCount) {
        topId = uid;
        topCount = count;
      }
    }

    if (topId) {
      const member = members.find((m) => m.userId === topId);
      if (member) {
        mostActiveMember = { name: member.name, count: topCount };
      }
    }
  }

  return {
    totalMembers: members.length,
    scriptsGenerated,
    scriptsThisMonth,
    mostActiveMember,
  };
}

export async function expireOldInvitations() {
  const supabase = createServerSupabaseClient();
  if (!supabase) return;

  await supabase
    .from("workspace_invitations")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lt("expires_at", new Date().toISOString());
}
