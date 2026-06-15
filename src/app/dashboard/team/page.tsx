import { TeamRouteGuard } from "@/components/dashboard/team-route-guard";
import { TeamWorkspaceView } from "@/components/dashboard/team/team-workspace-view";

export default function TeamWorkspacePage() {
  return (
    <TeamRouteGuard
      title="Upgrade to Team"
      description="Team workspace, shared library, and analytics are available on the Team plan."
    >
      <TeamWorkspaceView />
    </TeamRouteGuard>
  );
}
