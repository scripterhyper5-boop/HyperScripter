import "server-only";

import { isAdmin } from "@/lib/auth/admin";
import type { User } from "@/lib/auth/types";
import { PLANS, type PlanId } from "@/lib/plans";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const SCRIPT_GENERATION_ACTION = "script_generation";
const LEGACY_SCRIPT_ACTION = "script_generated";

export interface ScriptUsageAllowance {
  used: number;
  limit: number | null;
  remaining: number | null;
  allowed: boolean;
  /** True only for admin accounts with unlimited script generation. */
  unlimited: boolean;
}

export function getCurrentMonthBounds(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function getMonthlyScriptGenerationCount(
  userId: string
): Promise<number> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return 0;

  const { start, end } = getCurrentMonthBounds();

  const { count, error } = await supabase
    .from("usage_records")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("action", [SCRIPT_GENERATION_ACTION, LEGACY_SCRIPT_ACTION])
    .gte("created_at", start)
    .lt("created_at", end);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function recordScriptGeneration(
  userId: string,
  scriptId?: string
): Promise<void> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase.from("usage_records").insert({
    user_id: userId,
    action: SCRIPT_GENERATION_ACTION,
    metadata: scriptId ? { script_id: scriptId } : null,
  });

  if (error) {
    console.warn("[usage_records] insert skipped:", error.message);
  }
}

export function buildScriptUsageAllowance(
  planId: PlanId,
  used: number,
  user?: User | null
): ScriptUsageAllowance {
  if (user && isAdmin(user)) {
    return {
      used,
      limit: null,
      remaining: null,
      allowed: true,
      unlimited: true,
    };
  }

  const planLimit = PLANS[planId].monthlyScriptLimit;
  const limit = planLimit ?? PLANS.free.monthlyScriptLimit ?? 5;
  const remaining = Math.max(0, limit - used);
  return {
    used,
    limit,
    remaining,
    allowed: used < limit,
    unlimited: false,
  };
}

export async function getScriptUsageAllowanceForUser(
  user: User
): Promise<ScriptUsageAllowance> {
  const used = await getMonthlyScriptGenerationCount(user.id);
  const { getReferralBonusCredits } = await import("@/lib/db/referrals");
  const bonusCredits = await getReferralBonusCredits(user.id);
  const allowance = buildScriptUsageAllowance(user.plan, used, user);

  if (bonusCredits > 0 && !allowance.unlimited && allowance.limit !== null) {
    const boostedLimit = allowance.limit + bonusCredits;
    const remaining = Math.max(0, boostedLimit - used);
    return {
      ...allowance,
      limit: boostedLimit,
      remaining,
      allowed: used < boostedLimit,
    };
  }

  return allowance;
}
