import type { PlanId } from "@/lib/plans";
import { PLANS } from "@/lib/plans";

export interface ScriptAllowance {
  used: number;
  limit: number | null;
  remaining: number | null;
  allowed: boolean;
  /** True only for admin accounts with unlimited script generation. */
  unlimited: boolean;
}

export const EMPTY_SCRIPT_ALLOWANCE: ScriptAllowance = {
  used: 0,
  limit: 0,
  remaining: 0,
  allowed: false,
  unlimited: false,
};

/** Client-side fallback when usage API is unavailable. */
export function getScriptAllowanceFallback(
  planId: PlanId,
  user?: { role?: string } | null
): ScriptAllowance {
  if (user?.role === "admin") {
    return {
      used: 0,
      limit: null,
      remaining: null,
      allowed: true,
      unlimited: true,
    };
  }

  const planLimit = PLANS[planId].monthlyScriptLimit;
  const limit = planLimit ?? PLANS.free.monthlyScriptLimit ?? 5;
  return {
    used: 0,
    limit,
    remaining: limit,
    allowed: true,
    unlimited: false,
  };
}
