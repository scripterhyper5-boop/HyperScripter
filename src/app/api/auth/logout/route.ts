import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session-cookie";

export async function POST() {
  try {
    await clearSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/auth/logout]", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
