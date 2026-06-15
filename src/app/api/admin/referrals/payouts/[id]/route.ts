import { NextResponse } from "next/server";
import { getAdminServerSession } from "@/lib/auth/session";
import { markAffiliatePayoutPaid } from "@/lib/db/referrals";
import { getUserById } from "@/lib/db/users";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getAdminServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    let paymentNotes: string | null = null;

    try {
      const body = (await request.json()) as { paymentNotes?: string };
      paymentNotes = body.paymentNotes ?? null;
    } catch {
      /* body optional */
    }

    const payout = await markAffiliatePayoutPaid(id, paymentNotes);

    const account = await getUserById(payout.userId);
    if (account) {
      const { sendPayoutSentEmail } = await import("@/lib/email/send-emails");
      await sendPayoutSentEmail({
        name: account.user.name,
        email: account.user.email,
        amount: payout.amount,
      });
    }

    return NextResponse.json({ payout });
  } catch (error) {
    console.error("[PATCH /api/admin/referrals/payouts/[id]]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update payout" },
      { status: 500 }
    );
  }
}
