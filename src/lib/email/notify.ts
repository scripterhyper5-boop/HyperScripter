import "server-only";

import type { PlanId } from "@/lib/plans";
import { PLANS } from "@/lib/plans";
import { getUserById } from "@/lib/db/users";
import { sendBillingEmail } from "@/lib/email/send-emails";

function planLabel(planId: PlanId): string {
  return PLANS[planId]?.name ?? planId;
}

export async function notifyPlanChange(
  userId: string,
  previousPlan: PlanId,
  newPlan: PlanId
): Promise<void> {
  if (previousPlan === newPlan) return;

  const account = await getUserById(userId);
  if (!account) return;

  await sendBillingEmail({
    name: account.user.name,
    email: account.user.email,
    type: "plan_changed",
    previousPlan: planLabel(previousPlan),
    newPlan: planLabel(newPlan),
  });
}

export async function notifySubscriptionCancelled(userId: string): Promise<void> {
  const account = await getUserById(userId);
  if (!account) return;

  await sendBillingEmail({
    name: account.user.name,
    email: account.user.email,
    type: "subscription_cancelled",
  });
}

export function fireAndForgetEmail(task: Promise<unknown>, label: string): void {
  void task.catch((error) => {
    console.error(`[email:${label}]`, error);
  });
}
