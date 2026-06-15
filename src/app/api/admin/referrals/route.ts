import { NextResponse } from "next/server";
import { getAdminServerSession } from "@/lib/auth/session";
import { listAdminPayoutsEnriched, listAdminReferrals } from "@/lib/db/referrals";

export async function GET(request: Request) {
  const session = await getAdminServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { reconcileAllMissingReferralCommissions } = await import(
      "@/lib/referrals/reconcile-commissions"
    );
    await reconcileAllMissingReferralCommissions();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? undefined;
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Number(searchParams.get("pageSize") ?? "20");

    const [referrals, payouts] = await Promise.all([
      listAdminReferrals({ search, page, pageSize }),
      listAdminPayoutsEnriched(),
    ]);

    return NextResponse.json({ ...referrals, payouts });
  } catch (error) {
    console.error("[GET /api/admin/referrals]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load referrals" },
      { status: 500 }
    );
  }
}
