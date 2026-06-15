import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/admin";
import { getUserServerSession } from "@/lib/auth/session";
import { getUserSubscription, upsertSubscription } from "@/lib/db/subscriptions";
import { syncStripeSubscription } from "@/lib/billing/sync-subscription";
import {
  getAppBaseUrl,
  getStripe,
  getStripePriceId,
  isPaidCheckoutPlan,
  isStripeConfigured,
} from "@/lib/stripe";
import { PLANS } from "@/lib/plans";

export async function POST(request: Request) {
  const session = await getUserServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isAdmin(session.user)) {
    return NextResponse.json(
      { error: "Admin accounts bypass billing" },
      { status: 400 }
    );
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as { plan?: string };
    if (!body.plan || !isPaidCheckoutPlan(body.plan)) {
      return NextResponse.json(
        { error: "Invalid plan. Choose pro or team." },
        { status: 400 }
      );
    }
    const plan = body.plan;

    const stripe = getStripe();
    const user = session.user;
    const existing = await getUserSubscription(user.id);
    const baseUrl = getAppBaseUrl();

    let customerId = existing?.stripe_customer_id ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await upsertSubscription({
        userId: user.id,
        plan: user.plan,
        stripeCustomerId: customerId,
      });
    }

    if (
      existing?.stripe_subscription_id &&
      (existing.status === "active" || existing.status === "trialing")
    ) {
      const currentPlan = existing.plan;
      const planOrder = { free: 0, pro: 1, team: 2 };

      if (planOrder[plan] > planOrder[currentPlan]) {
        const stripeSub = await stripe.subscriptions.retrieve(
          existing.stripe_subscription_id
        );
        const itemId = stripeSub.items.data[0]?.id;
        if (!itemId) {
          return NextResponse.json(
            { error: "Subscription item not found" },
            { status: 500 }
          );
        }

        const updated = await stripe.subscriptions.update(
          existing.stripe_subscription_id,
          {
            items: [{ id: itemId, price: getStripePriceId(plan) }],
            proration_behavior: "create_prorations",
            metadata: { userId: user.id, plan },
          }
        );

        await syncStripeSubscription(updated);

        return NextResponse.json({
          url: `${baseUrl}/dashboard/billing?upgraded=1`,
          upgraded: true,
        });
      }

      return NextResponse.json(
        {
          error: "Use Manage Subscription to change or cancel your plan.",
          usePortal: true,
        },
        { status: 400 }
      );
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: getStripePriceId(plan), quantity: 1 }],
      success_url: `${baseUrl}/dashboard/billing?success=1`,
      cancel_url: `${baseUrl}/dashboard/billing?cancelled=1`,
      metadata: { userId: user.id, plan },
      subscription_data: {
        metadata: { userId: user.id, plan },
      },
      allow_promotion_codes: true,
    });

    if (!checkoutSession.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: checkoutSession.url,
      plan: PLANS[plan].name,
    });
  } catch (error) {
    console.error("[POST /api/billing/create-checkout-session]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to start checkout",
      },
      { status: 500 }
    );
  }
}
