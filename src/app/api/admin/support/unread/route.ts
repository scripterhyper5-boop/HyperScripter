import { NextResponse } from "next/server";
import { getAdminServerSession } from "@/lib/auth/session";
import { getAdminSupportUnreadCount } from "@/lib/db/support";

export async function GET() {
  const session = await getAdminServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const count = await getAdminSupportUnreadCount();
    return NextResponse.json({ count });
  } catch (error) {
    console.error("[GET /api/admin/support/unread]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load unread count" },
      { status: 500 }
    );
  }
}
