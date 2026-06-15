"use client";

import { useCallback } from "react";
import { fetchTeamMembers, fetchTeamWorkspace } from "@/lib/api/team-client";
import { useTeamFetch } from "@/hooks/use-team-fetch";
import type {
  TeamInvitation,
  TeamMember,
  TeamWorkspace,
  TeamWorkspaceOwner,
  WorkspaceRole,
} from "@/lib/team/types";

export interface TeamMembersData {
  workspace: TeamWorkspace;
  role: WorkspaceRole;
  owner: TeamWorkspaceOwner | null;
  members: TeamMember[];
  invitations: TeamInvitation[];
}

async function loadTeamMembersData(): Promise<TeamMembersData> {
  const [workspaceData, membersData] = await Promise.all([
    fetchTeamWorkspace(),
    fetchTeamMembers(),
  ]);

  return {
    workspace: workspaceData.workspace,
    role: workspaceData.role,
    owner: workspaceData.owner,
    members: membersData.members,
    invitations: membersData.invitations,
  };
}

export function useTeamMembers() {
  const { data, loading, initializing, error, errorDetails, refresh } =
    useTeamFetch(loadTeamMembersData);

  const reload = useCallback(
    async (options?: { silent?: boolean }) => {
      await refresh(options);
    },
    [refresh]
  );

  return {
    workspace: data?.workspace ?? null,
    role: data?.role ?? null,
    owner: data?.owner ?? null,
    members: data?.members ?? [],
    invitations: data?.invitations ?? [],
    loading,
    initializing,
    error,
    errorDetails,
    refresh: reload,
  };
}
