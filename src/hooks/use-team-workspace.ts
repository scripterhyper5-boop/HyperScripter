"use client";

import { useCallback } from "react";
import {
  fetchTeamAnalytics,
  fetchTeamMembers,
  fetchTeamWorkspace,
} from "@/lib/api/team-client";
import { useTeamFetch } from "@/hooks/use-team-fetch";
import type {
  TeamAnalytics,
  TeamInvitation,
  TeamMember,
  TeamWorkspace,
  TeamWorkspaceOwner,
  TeamWorkspaceResponse,
  WorkspaceRole,
} from "@/lib/team/types";

export interface TeamWorkspaceData {
  workspace: TeamWorkspace;
  role: WorkspaceRole;
  memberCount: number;
  owner: TeamWorkspaceOwner | null;
  members: TeamMember[];
  invitations: TeamInvitation[];
  analytics: TeamAnalytics;
}

async function loadTeamWorkspaceData(): Promise<TeamWorkspaceData> {
  const [workspaceData, membersData, analyticsData] = await Promise.all([
    fetchTeamWorkspace(),
    fetchTeamMembers(),
    fetchTeamAnalytics(),
  ]);

  return {
    workspace: workspaceData.workspace,
    role: workspaceData.role,
    memberCount: workspaceData.memberCount,
    owner: workspaceData.owner,
    members: membersData.members,
    invitations: membersData.invitations,
    analytics: analyticsData,
  };
}

export function useTeamWorkspace() {
  const { data, loading, initializing, error, errorDetails, refresh } =
    useTeamFetch(loadTeamWorkspaceData);

  const reload = useCallback(
    async (options?: { silent?: boolean }) => {
      await refresh(options);
    },
    [refresh]
  );

  return {
    workspace: data?.workspace ?? null,
    role: data?.role ?? null,
    memberCount: data?.memberCount ?? 0,
    owner: data?.owner ?? null,
    members: data?.members ?? [],
    invitations: data?.invitations ?? [],
    analytics: data?.analytics ?? null,
    loading,
    initializing,
    error,
    errorDetails,
    refresh: reload,
  };
}

export type { TeamWorkspaceResponse };
