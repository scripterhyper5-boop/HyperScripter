"use client";

import { useEffect, useState } from "react";
import { usePlan } from "@/hooks/use-plan";
import { planMeetsRequirement } from "@/lib/plans";

export function useHasTeamAccess() {
  const { planId } = usePlan();
  const hasTeamPlan = planMeetsRequirement(planId, "team");
  const [hasWorkspaceAccess, setHasWorkspaceAccess] = useState(hasTeamPlan);

  useEffect(() => {
    if (hasTeamPlan) {
      setHasWorkspaceAccess(true);
      return;
    }

    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/team/workspace", { credentials: "include" });
        if (!cancelled) setHasWorkspaceAccess(res.ok);
      } catch {
        if (!cancelled) setHasWorkspaceAccess(false);
      }
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, [hasTeamPlan]);

  return hasWorkspaceAccess;
}
