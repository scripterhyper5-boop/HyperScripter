import "server-only";

import type Stripe from "stripe";
import type { PlanId } from "@/lib/plans";
import { getUserById, updateUserPlan } from "@/lib/db/users";
import {
  getSubscriptionByStripeCustomerId,
  getSubscriptionByStripeSubscriptionId,
  upsertSubscription,
} from "@/lib/db/subscriptions";
import {
  getStripe,
  mapStripeSubscriptionStatus,
  planFromStripePriceId,
} from "@/lib/stripe";

async function resolveUserIdFromMetadata(
  metadataUserId: string | undefined,
  customerId: string
): Promise<string | null> {
  if (metadataUserId) return metadataUserId;

  const existing = await getSubscriptionByStripeCustomerId(customerId);
  return existing?.user_id ?? null;
}

function resolveUserId(
  subscription: Stripe.Subscription,
  customerId: string
): Promise<string | null> {
  return resolveUserIdFromMetadata(subscription.metadata?.userId, customerId);
}

function getPrimaryPriceId(subscription: Stripe.Subscription): string | null {
  return subscription.items.data[0]?.price?.id ?? null;
}

function getSubscriptionPeriodEnd(subscription: Stripe.Subscription): number | null {
  return subscription.items.data[0]?.current_period_end ?? null;
}

function effectivePlanFromSubscription(
  subscription: Stripe.Subscription
): PlanId {
  const mappedStatus = mapStripeSubscriptionStatus(subscription.status);
  const periodEnd = getSubscriptionPeriodEnd(subscription);

  const planFromMeta = subscription.metadata?.plan;
  const metaPlan =
    planFromMeta === "pro" || planFromMeta === "team" ? planFromMeta : null;

  if (mappedStatus === "active" || mappedStatus === "trialing") {
    return (
      planFromStripePriceId(getPrimaryPriceId(subscription)) ??
      metaPlan ??
      "free"
    );
  }

  if (
    mappedStatus === "cancelled" &&
    subscription.cancel_at_period_end &&
    periodEnd !== null &&
    periodEnd * 1000 > Date.now()
  ) {
    return (
      planFromStripePriceId(getPrimaryPriceId(subscription)) ??
      metaPlan ??
      "free"
    );
  }

  return "free";
}

async function applyPlanSyncRewards(
  userId: string,
  previousPlan: PlanId,
  plan: PlanId
): Promise<void> {
  if (previousPlan !== plan) {
    const { fireAndForgetEmail, notifyPlanChange } = await import("@/lib/email/notify");
    fireAndForgetEmail(notifyPlanChange(userId, previousPlan, plan), "plan-change");
  }

  if (plan === "pro" || plan === "team") {
    const { awardReferralCommissionForPlan } = await import(
      "@/lib/referrals/process-commission"
    );
    const { fireAndForgetEmail } = await import("@/lib/email/notify");
    fireAndForgetEmail(awardReferralCommissionForPlan(userId, plan), "referral-commission");
  }
}

export async function syncStripeSubscription(
  subscription: Stripe.Subscription
): Promise<void> {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const userId = await resolveUserId(subscription, customerId);
  if (!userId) {
    console.warn(
      "[syncStripeSubscription] No user for subscription",
      subscription.id
    );
    return;
  }

  const account = await getUserById(userId);
  const previousPlan: PlanId = account?.user.plan ?? "free";

  const plan = effectivePlanFromSubscription(subscription);
  const status = mapStripeSubscriptionStatus(subscription.status);
  const periodEnd = getSubscriptionPeriodEnd(subscription);
  const currentPeriodEnd = periodEnd
    ? new Date(periodEnd * 1000).toISOString()
    : undefined;

  await upsertSubscription({
    userId,
    plan,
    status,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    currentPeriodEnd,
  });

  await updateUserPlan(userId, plan);

  await applyPlanSyncRewards(userId, previousPlan, plan);
}

export async function syncStripeSubscriptionById(
  subscriptionId: string
): Promise<void> {
  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await syncStripeSubscription(subscription);
}

export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  if (subscriptionId) {
    await syncStripeSubscriptionById(subscriptionId);
    return;
  }

  const userId = session.metadata?.userId;
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  if (!userId || !customerId) return;

  const plan = session.metadata?.plan;
  if (plan === "pro" || plan === "team") {
    const account = await getUserById(userId);
    const previousPlan: PlanId = account?.user.plan ?? "free";

    await upsertSubscription({
      userId,
      plan,
      status: "active",
      stripeCustomerId: customerId,
    });
    await updateUserPlan(userId, plan);

    await applyPlanSyncRewards(userId, previousPlan, plan);
  }
}

export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const existing = await getSubscriptionByStripeSubscriptionId(subscription.id);
  const userId =
    existing?.user_id ??
    (await resolveUserIdFromMetadata(
      subscription.metadata?.userId,
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id
    ));

  if (!userId) return;

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const periodEnd = getSubscriptionPeriodEnd(subscription);

  await upsertSubscription({
    userId,
    plan: "free",
    status: "cancelled",
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    currentPeriodEnd: periodEnd
      ? new Date(periodEnd * 1000).toISOString()
      : undefined,
  });

  await updateUserPlan(userId, "free");

  const { fireAndForgetEmail, notifySubscriptionCancelled } = await import(
    "@/lib/email/notify"
  );
  fireAndForgetEmail(notifySubscriptionCancelled(userId), "subscription-cancelled");
}
