import type { ScriptHistoryItem } from "@/lib/auth/script-history";
import type {
  TeamAnalytics,
  TeamInvitation,
  TeamMember,
  TeamSharedScript,
  TeamWorkspace,
  TeamWorkspaceResponse,
  WorkspaceRole,
} from "@/lib/team/types";

const INITIALIZING_CODES = new Set([
  "WORKSPACE_INITIALIZING",
  "WORKSPACE_CREATION_FAILED",
]);

export interface TeamApiErrorDetails {
  endpoint: string;
  status: number;
  statusText: string;
  body: unknown;
  message: string;
}

export class TeamApiError extends Error {
  endpoint: string;
  status: number;
  statusText: string;
  body: unknown;

  constructor(details: TeamApiErrorDetails) {
    super(details.message);
    this.name = "TeamApiError";
    this.endpoint = details.endpoint;
    this.status = details.status;
    this.statusText = details.statusText;
    this.body = details.body;
  }

  getDiagnostics(): string {
    return [
      `Endpoint:\n${this.endpoint}`,
      `Status:\n${this.status}${this.statusText ? ` ${this.statusText}` : ""}`,
      `Message:\n${this.message}`,
    ].join("\n\n");
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveTeamErrorMessage(
  data: { error?: string; code?: string; stack?: string | null },
  status: number
): string {
  const serverMessage = data.error?.trim();

  if (data.code && INITIALIZING_CODES.has(data.code)) {
    if (data.code === "WORKSPACE_CREATION_FAILED") {
      const details = (data as { details?: { supabaseMessage?: string } }).details;
      return details?.supabaseMessage ?? serverMessage ?? "Failed to create workspace.";
    }
    return serverMessage ?? "Workspace is being prepared.";
  }

  if (status === 503) {
    return serverMessage ?? "Creating your workspace...";
  }

  if (serverMessage) {
    if (serverMessage === "No workspace found. Contact support.") {
      return "Creating your workspace...";
    }
    if (
      serverMessage.includes("PGRST") ||
      serverMessage.includes("duplicate key") ||
      serverMessage.includes("violates") ||
      serverMessage.includes("postgres")
    ) {
      return "Workspace is being prepared.";
    }
    return serverMessage;
  }

  return `Request failed with status ${status}`;
}

async function teamFetch<T>(
  path: string,
  init?: RequestInit,
  options?: { retries?: number }
): Promise<T> {
  const retries = options?.retries ?? 0;
  let lastError: TeamApiError | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    let response: Response | undefined;
    let body: unknown = {};

    try {
      response = await fetch(path, {
        ...init,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...init?.headers,
        },
      });

      body = await response.json().catch(() => ({}));
    } catch (networkError) {
      const message =
        networkError instanceof Error
          ? networkError.message
          : "Network request failed";

      const error = new TeamApiError({
        endpoint: path,
        status: 0,
        statusText: "Network Error",
        body: null,
        message,
      });

      console.error("[team-api] request failed", {
        endpoint: path,
        status: 0,
        statusText: "Network Error",
        body: null,
        error: networkError,
      });

      throw error;
    }

    if (response.ok) return body as T;

    const data = body as {
      error?: string;
      code?: string;
      stack?: string | null;
    };

    const message = resolveTeamErrorMessage(data, response.status);
    const error = new TeamApiError({
      endpoint: path,
      status: response.status,
      statusText: response.statusText,
      body,
      message,
    });

    lastError = error;

    console.error("[team-api] request failed", {
      endpoint: path,
      status: response?.status,
      statusText: response?.statusText,
      body,
      error,
    });

    const shouldRetry =
      attempt < retries &&
      (response.status === 503 ||
        data.code === "WORKSPACE_INITIALIZING" ||
        message.includes("being prepared") ||
        message.includes("Creating your workspace"));

    if (shouldRetry) {
      await sleep(800 * (attempt + 1));
      continue;
    }

    throw error;
  }

  throw lastError ?? new TeamApiError({
    endpoint: path,
    status: 0,
    statusText: "Unknown",
    body: null,
    message: "Request failed",
  });
}

export async function fetchTeamWorkspace(): Promise<TeamWorkspaceResponse> {
  return teamFetch<TeamWorkspaceResponse>("/api/team/workspace", undefined, {
    retries: 3,
  });
}

export async function fetchTeamMembers(): Promise<{
  members: TeamMember[];
  invitations: TeamInvitation[];
}> {
  return teamFetch("/api/team/members", undefined, { retries: 3 });
}

export async function inviteTeamMember(email: string, role: WorkspaceRole) {
  return teamFetch<{ invitation: TeamInvitation & { acceptUrl: string } }>(
    "/api/team/members",
    {
      method: "POST",
      body: JSON.stringify({ email, role }),
    }
  );
}

export async function updateTeamMemberRole(memberId: string, role: WorkspaceRole) {
  return teamFetch("/api/team/members", {
    method: "PATCH",
    body: JSON.stringify({ memberId, role }),
  });
}

export async function removeTeamMember(memberId: string) {
  return teamFetch(`/api/team/members?memberId=${encodeURIComponent(memberId)}`, {
    method: "DELETE",
  });
}

export async function acceptTeamInvitation(token: string) {
  return teamFetch<{ success: boolean; workspaceId: string }>(
    "/api/team/invitations/accept",
    {
      method: "POST",
      body: JSON.stringify({ token }),
    }
  );
}

export async function fetchTeamScripts(): Promise<{
  scripts: TeamSharedScript[];
  role: WorkspaceRole;
}> {
  return teamFetch("/api/team/scripts", undefined, { retries: 3 });
}

export async function fetchTeamScriptById(scriptId: string): Promise<{
  script: ScriptHistoryItem;
  authorName: string;
}> {
  return teamFetch(`/api/team/scripts/${scriptId}`);
}

export async function setScriptShare(scriptId: string, shared: boolean) {
  return teamFetch("/api/team/scripts", {
    method: "PATCH",
    body: JSON.stringify({ scriptId, shared }),
  });
}

export async function deleteTeamScript(scriptId: string) {
  return teamFetch(`/api/team/scripts?scriptId=${encodeURIComponent(scriptId)}`, {
    method: "DELETE",
  });
}

export async function fetchTeamAnalytics(): Promise<TeamAnalytics> {
  return teamFetch("/api/team/analytics", undefined, { retries: 3 });
}

export async function updateTeamSettings(name: string) {
  return teamFetch<{ workspace: TeamWorkspace }>("/api/team/settings", {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export async function fetchScriptShareStatus(scriptId: string): Promise<{
  shared: boolean;
}> {
  return teamFetch(`/api/team/share-status?scriptId=${encodeURIComponent(scriptId)}`);
}

export function isWorkspaceInitializingError(error: unknown): boolean {
  if (!(error instanceof TeamApiError) && !(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("creating your workspace") ||
    msg.includes("being prepared") ||
    msg.includes("initializing")
  );
}

export function getTeamApiErrorDetails(
  error: unknown
): TeamApiErrorDetails | null {
  if (error instanceof TeamApiError) {
    return {
      endpoint: error.endpoint,
      status: error.status,
      statusText: error.statusText,
      body: error.body,
      message: error.message,
    };
  }
  return null;
}

export function formatTeamErrorDetails(
  details: TeamApiErrorDetails | null
): string | undefined {
  if (!details) return undefined;
  return [
    `Endpoint:\n${details.endpoint}`,
    `Status:\n${details.status}${details.statusText ? ` ${details.statusText}` : ""}`,
    `Message:\n${details.message}`,
  ].join("\n\n");
}
