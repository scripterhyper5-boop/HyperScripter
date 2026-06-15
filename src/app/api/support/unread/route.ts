import { NextResponse } from "next/server";
import { getUserServerSession } from "@/lib/auth/session";
import { getUserSupportUnreadCount } from "@/lib/db/support";

export async function GET() {
  const session = await getUserServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const count = await getUserSupportUnreadCount(session.user.id);
    return NextResponse.json({ count });
  } catch (error) {
    console.error("[GET /api/support/unread]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load unread count" },
      { status: 500 }
    );
  }
}
