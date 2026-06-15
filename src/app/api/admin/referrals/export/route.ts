import { NextResponse } from "next/server";
import { getAdminServerSession } from "@/lib/auth/session";
import { listAllReferralsForExport } from "@/lib/db/referrals";

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  const session = await getAdminServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const referrals = await listAllReferralsForExport();

    const headers = [
      "Referrer Name",
      "Referrer Email",
      "Referred User",
      "Referred Email",
      "Referral Code",
      "Status",
      "Reward Credits",
      "Referred Plan",
      "Date",
    ];

    const rows = referrals.map((r) =>
      [
        escapeCsv(r.referrerName),
        escapeCsv(r.referrerEmail),
        escapeCsv(r.referredUserName ?? ""),
        escapeCsv(r.referredUserEmail ?? ""),
        escapeCsv(r.referralCode),
        escapeCsv(r.status),
        String(r.rewardCredits),
        escapeCsv(r.referredUserPlan ?? ""),
        escapeCsv(new Date(r.createdAt).toISOString()),
      ].join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="referrals-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/referrals/export]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Export failed" },
      { status: 500 }
    );
  }
}
