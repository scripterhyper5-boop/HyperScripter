import "server-only";

import type { PlanId } from "@/lib/plans";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { awardReferralCommissionForPlan } from "@/lib/referrals/process-commission";

async function awardForPaidReferredUsers(referredIds: string[]): Promise<number> {
  const supabase = createServerSupabaseClient();
  if (!supabase || referredIds.length === 0) return 0;

  const { data: users } = await supabase
    .from("users")
    .select("id, plan")
    .in("id", referredIds);

  let awarded = 0;
  for (const user of users ?? []) {
    const plan = user.plan as PlanId;
    if (plan !== "pro" && plan !== "team") continue;
    const created = await awardReferralCommissionForPlan(user.id as string, plan);
    if (created) awarded += 1;
  }

  return awarded;
}

/** Backfill missing commissions for one referrer's referrals. */
export async function reconcileReferralCommissionsForReferrer(
  referrerUserId: string
): Promise<number> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return 0;

  const { data: referralRows, error } = await supabase
    .from("referrals")
    .select("referred_user_id")
    .eq("referrer_user_id", referrerUserId)
    .eq("status", "completed");

  if (error || !referralRows?.length) return 0;

  const referredIds = referralRows.map((r) => r.referred_user_id as string);
  return awardForPaidReferredUsers(referredIds);
}

/** Backfill all missing commissions (admin / global reconcile). */
export async function reconcileAllMissingReferralCommissions(): Promise<number> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return 0;

  const { data: referralRows, error } = await supabase
    .from("referrals")
    .select("referred_user_id")
    .eq("status", "completed");

  if (error || !referralRows?.length) return 0;

  const referredIds = [...new Set(referralRows.map((r) => r.referred_user_id as string))];
  return awardForPaidReferredUsers(referredIds);
}
