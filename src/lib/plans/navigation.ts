import type { PlanId } from "@/lib/plans";
import { planMeetsRequirement } from "@/lib/plans";

export type NavMinPlan = Exclude<PlanId, "free">;

export function isNavItemAllowed(
  planId: PlanId,
  minPlan?: NavMinPlan
): boolean {
  if (!minPlan) return true;
  return planMeetsRequirement(planId, minPlan);
}

export function isTeamNavAllowed(planId: PlanId): boolean {
  return planMeetsRequirement(planId, "team");
}

export function isProWorkspaceNavAllowed(planId: PlanId): boolean {
  return planMeetsRequirement(planId, "pro");
}
