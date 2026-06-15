import { NextResponse } from "next/server";
import { getAdminServerSession } from "@/lib/auth/session";
import {
  getAdminAiSettingsView,
  upsertAiSetting,
  GEMINI_PROVIDER,
  invalidateImportCache,
} from "@/lib/db/ai-settings";

export async function GET() {
  const session = await getAdminServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await getAdminAiSettingsView();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("[GET /api/admin/ai]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load AI settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const session = await getAdminServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { apiKey?: string };
    const apiKey = body.apiKey?.trim();

    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 });
    }

    const row = await upsertAiSetting(GEMINI_PROVIDER, apiKey);
    invalidateImportCache();

    const settings = await getAdminAiSettingsView();
    return NextResponse.json({
      ...settings,
      updatedAt: row.updated_at,
      status: "connected" as const,
    });
  } catch (error) {
    console.error("[PUT /api/admin/ai]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save API key" },
      { status: 500 }
    );
  }
}
