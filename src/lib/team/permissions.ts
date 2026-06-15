import type { WorkspaceRole } from "@/lib/team/types";

export function canManageMembers(role: WorkspaceRole): boolean {
  return role === "owner" || role === "admin";
}

export function canManageScripts(role: WorkspaceRole): boolean {
  return role === "owner" || role === "admin";
}

export function canManageWorkspaceSettings(role: WorkspaceRole): boolean {
  return role === "owner";
}

export function canViewSharedScripts(_role: WorkspaceRole): boolean {
  return true;
}

export function canCopyScripts(_role: WorkspaceRole): boolean {
  return true;
}

export function canRemoveMember(
  actorRole: WorkspaceRole,
  targetRole: WorkspaceRole
): boolean {
  if (targetRole === "owner") return false;
  if (actorRole === "owner") return true;
  if (actorRole === "admin" && targetRole === "member") return true;
  return false;
}

export function canChangeMemberRole(
  actorRole: WorkspaceRole,
  targetRole: WorkspaceRole
): boolean {
  if (targetRole === "owner") return false;
  return actorRole === "owner";
}

export function roleLabel(role: WorkspaceRole): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}
