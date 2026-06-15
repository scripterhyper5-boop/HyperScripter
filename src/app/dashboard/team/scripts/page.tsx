import { TeamRouteGuard } from "@/components/dashboard/team-route-guard";
import { TeamScriptsView } from "@/components/dashboard/team/team-scripts-view";

export default function TeamScriptsPage() {
  return (
    <TeamRouteGuard
      title="Upgrade to Team"
      description="The shared script library is available on the Team plan."
    >
      <TeamScriptsView />
    </TeamRouteGuard>
  );
}
