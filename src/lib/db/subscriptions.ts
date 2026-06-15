import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { DbSubscription, PlanId, SubscriptionStatus } from "@/lib/supabase/types";

export async function getUserSubscription(userId: string) {
  const supabase = createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as DbSubscription | null;
}

export async function upsertSubscription(input: {
  userId: string;
  plan: PlanId;
  status?: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: string;
}) {
  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");

  const existing = await getUserSubscription(input.userId);

  if (existing) {
    const sub = existing as DbSubscription;
    const { data, error } = await supabase
      .from("subscriptions")
      .update({
        plan: input.plan,
        status: input.status ?? sub.status,
        stripe_customer_id: input.stripeCustomerId ?? sub.stripe_customer_id,
        stripe_subscription_id:
          input.stripeSubscriptionId ?? sub.stripe_subscription_id,
        current_period_end:
          input.currentPeriodEnd ?? sub.current_period_end,
      })
      .eq("id", sub.id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      user_id: input.userId,
      plan: input.plan,
      status: input.status ?? "active",
      stripe_customer_id: input.stripeCustomerId ?? null,
      stripe_subscription_id: input.stripeSubscriptionId ?? null,
      current_period_end: input.currentPeriodEnd ?? null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getSubscriptionByStripeCustomerId(customerId: string) {
  const supabase = createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("stripe_customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as DbSubscription | null;
}

export async function getSubscriptionByStripeSubscriptionId(subscriptionId: string) {
  const supabase = createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as DbSubscription | null;
}
