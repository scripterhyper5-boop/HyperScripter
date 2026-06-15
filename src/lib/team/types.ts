export type WorkspaceRole = "owner" | "admin" | "member";

export type InvitationStatus = "pending" | "accepted" | "expired";

export interface TeamWorkspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: string;
}

export interface TeamWorkspaceOwner {
  userId: string;
  name: string;
  email: string;
}

export interface TeamWorkspaceResponse {
  workspace: TeamWorkspace;
  role: WorkspaceRole;
  memberCount: number;
  owner: TeamWorkspaceOwner | null;
}

export interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: WorkspaceRole;
  joinedAt: string;
  initials: string;
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: WorkspaceRole;
  status: InvitationStatus;
  createdAt: string;
  expiresAt: string;
}

export interface TeamSharedScript {
  id: string;
  title: string;
  authorId: string;
  authorName: string;
  videoType: string | null;
  tone: string | null;
  createdAt: string;
  hook: string;
  shared?: boolean;
}

export interface TeamAnalytics {
  totalMembers: number;
  scriptsGenerated: number;
  scriptsThisMonth: number;
  mostActiveMember: { name: string; count: number } | null;
}

export interface TeamWorkspaceContext {
  workspace: TeamWorkspace;
  role: WorkspaceRole;
  members: TeamMember[];
}
