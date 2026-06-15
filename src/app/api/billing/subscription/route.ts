import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/admin";
import { resolveUserPlan } from "@/lib/auth/resolve-plan";
import { getUserServerSession } from "@/lib/auth/session";
import { getUserById } from "@/lib/db/users";
import { getUserSubscription } from "@/lib/db/subscriptions";
import { PLANS, formatPlanName } from "@/lib/plans";
import { isStripeConfigured } from "@/lib/stripe";
import { isSupabaseServerConfigured } from "@/lib/supabase/server";

export async function GET() {
  const session = await getUserServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let user = session.user;
    if (isSupabaseServerConfigured()) {
      const account = await getUserById(session.user.id);
      if (account?.user) {
        user = {
          ...account.user,
          role: session.user.role ?? account.user.role,
          plan: resolveUserPlan(account.user),
        };
      }
    }

    const planId = resolveUserPlan(user);
    const plan = PLANS[planId];
    const subscription = await getUserSubscription(user.id);
    const adminBypass = isAdmin(user);

    return NextResponse.json({
      plan: planId,
      planName: formatPlanName(planId),
      monthlyPrice: plan.price,
      monthlyPriceLabel: plan.priceLabel,
      monthlyLimitLabel: plan.monthlyLimitLabel,
      status: adminBypass ? "admin" : (subscription?.status ?? "free"),
      statusLabel: adminBypass
        ? "Admin (unlimited)"
        : subscription?.status ?? "free",
      currentPeriodEnd: subscription?.current_period_end ?? null,
      hasStripeCustomer: Boolean(subscription?.stripe_customer_id),
      hasActiveSubscription:
        subscription?.status === "active" || subscription?.status === "trialing",
      stripeConfigured: isStripeConfigured(),
      adminBypass,
    });
  } catch (error) {
    console.error("[GET /api/billing/subscription]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load subscription",
      },
      { status: 500 }
    );
  }
}
