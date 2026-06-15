"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import {
  type PlanFeature,
  PLANS,
  formatPlanName,
  getPlanPriceLabel,
  getNextPlan,
  getUpgradeLabel,
  planHasFeature,
} from "@/lib/plans";
import {
  EMPTY_SCRIPT_ALLOWANCE,
  getScriptAllowanceFallback,
  type ScriptAllowance,
} from "@/lib/plans/usage";
import { resolveUserPlan } from "@/lib/auth/resolve-plan";

export function usePlan() {
  const { user, isLoading: authLoading } = useAuth();
  const planId = resolveUserPlan(user);
  const plan = PLANS[planId];
  const [allowance, setAllowance] = useState<ScriptAllowance>(EMPTY_SCRIPT_ALLOWANCE);
  const [usageLoading, setUsageLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setAllowance(getScriptAllowanceFallback(planId, user));
    } else if (!authLoading) {
      setAllowance(EMPTY_SCRIPT_ALLOWANCE);
    }
  }, [authLoading, planId, user]);

  const refreshUsage = useCallback(async () => {
    if (authLoading) {
      setUsageLoading(true);
      return;
    }

    if (!user) {
      setAllowance(EMPTY_SCRIPT_ALLOWANCE);
      setUsageLoading(false);
      return;
    }

    setUsageLoading(true);
    try {
      const res = await fetch("/api/usage", { credentials: "include" });
      if (!res.ok) {
        setAllowance(getScriptAllowanceFallback(planId, user));
        return;
      }
      const data = (await res.json()) as ScriptAllowance;
      setAllowance({
        used: data.used,
        limit: data.unlimited ? null : data.limit,
        remaining: data.unlimited ? null : data.remaining,
        allowed: data.allowed,
        unlimited: Boolean(data.unlimited),
      });
    } catch {
      setAllowance(getScriptAllowanceFallback(planId, user));
    } finally {
      setUsageLoading(false);
    }
  }, [authLoading, planId, user]);

  useEffect(() => {
    void refreshUsage();
  }, [refreshUsage]);

  return useMemo(
    () => ({
      user,
      planId,
      plan,
      planName: formatPlanName(planId),
      planPriceLabel: getPlanPriceLabel(planId),
      nextPlan: getNextPlan(planId),
      allowance,
      usageLoading: authLoading || usageLoading,
      refreshUsage,
      hasFeature: (feature: PlanFeature) => planHasFeature(planId, feature),
      upgradeLabel: (feature: PlanFeature) => getUpgradeLabel(feature),
    }),
    [
      allowance,
      authLoading,
      plan,
      planId,
      refreshUsage,
      usageLoading,
      user,
    ]
  );
}
