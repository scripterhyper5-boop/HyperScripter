import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/admin";
import { getUserServerSession } from "@/lib/auth/session";
import { getUserSubscription } from "@/lib/db/subscriptions";
import { getAppBaseUrl, getStripe, isStripeConfigured } from "@/lib/stripe";

export async function POST() {
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
    const subscription = await getUserSubscription(session.user.id);

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No billing account found. Subscribe to a plan first." },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${getAppBaseUrl()}/dashboard/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("[POST /api/billing/create-portal-session]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to open billing portal",
      },
      { status: 500 }
    );
  }
}
