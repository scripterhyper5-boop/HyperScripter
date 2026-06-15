import "server-only";

export type WorkspaceCreationStage =
  | "supabase_client"
  | "lookup_owned"
  | "lookup_membership"
  | "plan_check"
  | "workspace_insert"
  | "membership_insert"
  | "membership_verify";

export interface WorkspaceCreationErrorDetails {
  stage: WorkspaceCreationStage;
  supabaseCode?: string;
  supabaseMessage?: string;
  hint?: string;
  userId?: string;
}

export class WorkspaceCreationError extends Error {
  readonly details: WorkspaceCreationErrorDetails;

  constructor(message: string, details: WorkspaceCreationErrorDetails) {
    super(message);
    this.name = "WorkspaceCreationError";
    this.details = details;
  }
}

export function workspaceErrorFromSupabase(
  message: string,
  stage: WorkspaceCreationStage,
  error: { code?: string; message?: string; hint?: string },
  userId?: string
): WorkspaceCreationError {
  return new WorkspaceCreationError(message, {
    stage,
    supabaseCode: error.code,
    supabaseMessage: error.message,
    hint: error.hint,
    userId,
  });
}
