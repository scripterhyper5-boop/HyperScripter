import { NextResponse } from "next/server";
import { getAdminServerSession } from "@/lib/auth/session";
import { testGeminiConnection } from "@/lib/gemini-client";

export async function POST() {
  const session = await getAdminServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await testGeminiConnection();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[POST /api/admin/ai/test]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Connection test failed",
      },
      { status: 500 }
    );
  }
}
