import "server-only";

export function logTeamWorkspace(
  event: string,
  data: Record<string, unknown>
): void {
  console.log(
    `[team-workspace] ${event}`,
    JSON.stringify({ ...data, ts: new Date().toISOString() })
  );
}
