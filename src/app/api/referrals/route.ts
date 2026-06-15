import { NextResponse } from "next/server";
import { getUserServerSession } from "@/lib/auth/session";
import { getUserReferralsView } from "@/lib/db/referrals";

export async function GET() {
  const session = await getUserServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getUserReferralsView(session.user.id);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[GET /api/referrals]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load referrals" },
      { status: 500 }
    );
  }
}
