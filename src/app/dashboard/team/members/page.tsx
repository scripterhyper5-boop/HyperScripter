import { TeamRouteGuard } from "@/components/dashboard/team-route-guard";
import { TeamMembersView } from "@/components/dashboard/team/team-members-view";

export default function TeamMembersPage() {
  return (
    <TeamRouteGuard
      title="Upgrade to Team"
      description="Team member management is available on the Team plan."
    >
      <TeamMembersView />
    </TeamRouteGuard>
  );
}
