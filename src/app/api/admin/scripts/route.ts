import { NextResponse } from "next/server";
import { getAdminServerSession } from "@/lib/auth/session";
import { listAllScriptsForAdmin } from "@/lib/db/scripts";

export async function GET() {
  const session = await getAdminServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const scripts = await listAllScriptsForAdmin();
    return NextResponse.json({ scripts });
  } catch (error) {
    console.error("[GET /api/admin/scripts]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load scripts" },
      { status: 500 }
    );
  }
}
