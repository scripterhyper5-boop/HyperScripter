import { NextResponse } from "next/server";
import { getUserServerSession } from "@/lib/auth/session";
import { isSupabaseServerConfigured } from "@/lib/supabase/server";
import { listScriptsByUser } from "@/lib/db/scripts";
import {
  getScriptHistory,
} from "@/lib/auth/script-history";

export async function GET() {
  const session = await getUserServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (isSupabaseServerConfigured()) {
      const scripts = await listScriptsByUser(session.user.id);
      return NextResponse.json({ scripts });
    }

    return NextResponse.json({
      scripts: getScriptHistory(session.user.id),
    });
  } catch (error) {
    console.error("[GET /api/scripts]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load scripts" },
      { status: 500 }
    );
  }
}
