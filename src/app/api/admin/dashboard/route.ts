import { NextResponse } from "next/server";
import { getAdminServerSession } from "@/lib/auth/session";
import {
  getAdminDashboardStats,
  getAdminRecentActivity,
} from "@/lib/db/admin-stats";
import { getAdminAiStatus } from "@/lib/db/ai-settings";
export async function GET() {
  const session = await getAdminServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [stats, activity, aiStatus] = await Promise.all([
      getAdminDashboardStats(),
      getAdminRecentActivity(),
      getAdminAiStatus(),
    ]);

    return NextResponse.json({ stats, activity, aiStatus });
  } catch (error) {
    console.error("[GET /api/admin/dashboard]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load dashboard",
      },
      { status: 500 }
    );
  }
}
