"use client";

import { useCallback } from "react";
import { fetchTeamScripts } from "@/lib/api/team-client";
import { useTeamFetch } from "@/hooks/use-team-fetch";
import type { TeamSharedScript, WorkspaceRole } from "@/lib/team/types";

export interface TeamScriptsData {
  scripts: TeamSharedScript[];
  role: WorkspaceRole;
  scriptCount: number;
}

async function loadTeamScriptsData(): Promise<TeamScriptsData> {
  const data = await fetchTeamScripts();
  return {
    scripts: data.scripts,
    role: data.role,
    scriptCount: data.scripts.length,
  };
}

export function useTeamScripts() {
  const { data, loading, initializing, error, errorDetails, refresh } =
    useTeamFetch(loadTeamScriptsData);

  const reload = useCallback(
    async (options?: { silent?: boolean }) => {
      await refresh(options);
    },
    [refresh]
  );

  return {
    scripts: data?.scripts ?? [],
    role: data?.role ?? null,
    scriptCount: data?.scriptCount ?? 0,
    loading,
    initializing,
    error,
    errorDetails,
    refresh: reload,
  };
}
