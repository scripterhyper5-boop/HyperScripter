import { TeamRouteGuard } from "@/components/dashboard/team-route-guard";
import { TeamSettingsView } from "@/components/dashboard/team/team-settings-view";

export default function TeamSettingsPage() {
  return (
    <TeamRouteGuard
      title="Upgrade to Team"
      description="Team workspace settings are available on the Team plan."
    >
      <TeamSettingsView />
    </TeamRouteGuard>
  );
}
