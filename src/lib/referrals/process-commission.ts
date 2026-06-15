import "server-only";

import type { PlanId } from "@/lib/plans";
import {
  calculateCommissionAmount,
  createAffiliatePayout,
  getReferralByReferredUserId,
  payoutExistsForReferral,
} from "@/lib/db/referrals";
import { getUserById } from "@/lib/db/users";

function isPaidPlan(planId: PlanId): planId is "pro" | "team" {
  return planId === "pro" || planId === "team";
}

/**
 * Idempotent: creates affiliate payout when a referred user is on a paid plan.
 * Safe to call on every billing sync — skips if payout already exists.
 */
export async function processReferralCommission(
  referredUserId: string,
  planId: PlanId
): Promise<boolean> {
  if (!isPaidPlan(planId)) {
    console.log("[referral-commission] skip — not a paid plan", { referredUserId, planId });
    return false;
  }

  const referral = await getReferralByReferredUserId(referredUserId);
  if (!referral) {
    console.log("[referral-commission] skip — no referral record", { referredUserId });
    return false;
  }

  if (referral.status !== "completed") {
    console.log("[referral-commission] skip — referral not completed", {
      referredUserId,
      referralId: referral.id,
      status: referral.status,
    });
    return false;
  }

  const alreadyPaid = await payoutExistsForReferral(referral.id);
  if (alreadyPaid) {
    console.log("[referral-commission] skip — payout already exists", {
      referredUserId,
      referralId: referral.id,
    });
    return false;
  }

  const amount = calculateCommissionAmount(planId);
  if (amount <= 0) return false;

  const payout = await createAffiliatePayout({
    userId: referral.referrerUserId,
    referralId: referral.id,
    amount,
  });

  if (!payout) {
    console.error("[referral-commission] failed — could not create payout", {
      referredUserId,
      referralId: referral.id,
      amount,
    });
    return false;
  }

  console.log("[referral-commission] created payout", {
    referredUserId,
    referralId: referral.id,
    referrerUserId: referral.referrerUserId,
    amount,
    payoutId: payout.id,
  });

  const referrer = await getUserById(referral.referrerUserId);
  const referred = await getUserById(referredUserId);

  if (referrer) {
    const { sendCommissionEarnedEmail } = await import("@/lib/email/send-emails");
    await sendCommissionEarnedEmail({
      name: referrer.user.name,
      email: referrer.user.email,
      amount,
      referredName: referred?.user.name ?? "A referred user",
      planName: planId === "pro" ? "Pro" : "Team",
    });
  }

  return true;
}

/** Award commission after plan is persisted — always attempt when plan is paid. */
export async function awardReferralCommissionForPlan(
  referredUserId: string,
  planId: PlanId
): Promise<boolean> {
  if (!isPaidPlan(planId)) return false;
  return processReferralCommission(referredUserId, planId);
}
