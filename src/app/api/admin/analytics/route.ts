import { NextResponse } from "next/server";
import { getAdminServerSession } from "@/lib/auth/session";
import { getAdminAnalyticsData } from "@/lib/db/admin-stats";

export async function GET() {
  const session = await getAdminServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const analytics = await getAdminAnalyticsData();
    return NextResponse.json({ analytics });
  } catch (error) {
    console.error("[GET /api/admin/analytics]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load analytics",
      },
      { status: 500 }
    );
  }
}
