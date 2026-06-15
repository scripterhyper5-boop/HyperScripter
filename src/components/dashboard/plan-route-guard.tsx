"use client";

import { planMeetsRequirement, type PlanId } from "@/lib/plans";
import { usePlan } from "@/hooks/use-plan";
import { PlanUpgradeScreen } from "@/components/dashboard/plan-upgrade-screen";

interface PlanRouteGuardProps {
  requiredPlan: Exclude<PlanId, "free">;
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function PlanRouteGuard({
  requiredPlan,
  children,
  title,
  description,
}: PlanRouteGuardProps) {
  const { planId } = usePlan();

  if (!planMeetsRequirement(planId, requiredPlan)) {
    return (
      <PlanUpgradeScreen
        targetPlan={requiredPlan}
        title={title}
        description={description}
      />
    );
  }

  return children;
}
