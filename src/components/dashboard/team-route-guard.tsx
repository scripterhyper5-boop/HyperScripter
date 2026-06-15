"use client";

import { useCallback, useEffect, useState } from "react";
import { DataLoading } from "@/components/ui/data-state";
import { PlanUpgradeScreen } from "@/components/dashboard/plan-upgrade-screen";
import { usePlan } from "@/hooks/use-plan";
import { planMeetsRequirement } from "@/lib/plans";

interface TeamRouteGuardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function TeamRouteGuard({
  children,
  title = "Upgrade to Team",
  description = "Team workspace features are available on the Team plan or via workspace invitation.",
}: TeamRouteGuardProps) {
  const { planId } = usePlan();
  const hasTeamPlan = planMeetsRequirement(planId, "team");
  const [memberAccess, setMemberAccess] = useState<boolean | null>(
    hasTeamPlan ? true : null
  );
  const [initializing, setInitializing] = useState(false);

  const checkWorkspace = useCallback(async () => {
    try {
      const res = await fetch("/api/team/workspace", { credentials: "include" });
      if (res.ok) {
        setMemberAccess(true);
        setInitializing(false);
        return;
      }
      const data = (await res.json().catch(() => ({}))) as {
        code?: string;
        error?: string;
      };
      if (res.status === 503 || data.code === "WORKSPACE_INITIALIZING") {
        setMemberAccess(true);
        setInitializing(true);
        return;
      }
      console.error("[team-route-guard] workspace access denied", {
        status: res.status,
        code: data.code,
        error: data.error,
      });
      setMemberAccess(hasTeamPlan ? true : false);
      setInitializing(false);
    } catch (err) {
      console.error("[team-route-guard] workspace check failed", err);
      setMemberAccess(hasTeamPlan ? true : false);
      setInitializing(false);
    }
  }, [hasTeamPlan]);

  useEffect(() => {
    if (hasTeamPlan) {
      void checkWorkspace();
      return;
    }

    void checkWorkspace();
  }, [hasTeamPlan, checkWorkspace]);

  useEffect(() => {
    if (!initializing) return;
    const timer = setInterval(() => {
      void checkWorkspace();
    }, 2000);
    return () => clearInterval(timer);
  }, [initializing, checkWorkspace]);

  if (memberAccess === null) {
    return <DataLoading message="Checking workspace access..." className="min-h-[40vh]" />;
  }

  if (initializing) {
    return (
      <DataLoading message="Creating your workspace..." className="min-h-[40vh]" />
    );
  }

  if (!memberAccess) {
    return (
      <PlanUpgradeScreen
        targetPlan="team"
        title={title}
        description={description}
      />
    );
  }

  return children;
}
