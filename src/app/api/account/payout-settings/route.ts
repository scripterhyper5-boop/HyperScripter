import { NextResponse } from "next/server";
import {
  getAffiliatePaymentMethod,
  upsertAffiliatePaymentMethod,
} from "@/lib/db/affiliate-payment-methods";
import { requireUserSession } from "@/lib/account/session-helpers";
import type { UpsertAffiliatePaymentMethodInput } from "@/lib/referrals/payment-types";
import { validatePaymentMethodInput } from "@/lib/referrals/payment-validation";

export async function GET() {
  const session = await requireUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const paymentMethod = await getAffiliatePaymentMethod(session.user.id);
    return NextResponse.json({
      paymentMethod: paymentMethod ?? {
        userId: session.user.id,
        preferredMethod: null,
        paypalEmail: null,
        bankAccount: null,
        wiseEmail: null,
        binanceUid: null,
        usdtWallet: null,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[GET /api/account/payout-settings]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load payout settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const session = await requireUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as UpsertAffiliatePaymentMethodInput;
    const validated = validatePaymentMethodInput(body);

    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const paymentMethod = await upsertAffiliatePaymentMethod(
      session.user.id,
      validated.data
    );

    return NextResponse.json({ paymentMethod });
  } catch (error) {
    console.error("[PUT /api/account/payout-settings]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save payout settings" },
      { status: 500 }
    );
  }
}
