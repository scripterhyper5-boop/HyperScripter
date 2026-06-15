import { NextResponse } from "next/server";
import { getHeaderFooterSettings } from "@/lib/db/header-footer-settings";

export async function GET() {
  try {
    const settings = await getHeaderFooterSettings();
    return NextResponse.json({
      header: settings.header,
      footer: settings.footer,
    });
  } catch (error) {
    console.error("[GET /api/header-footer]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load settings" },
      { status: 500 }
    );
  }
}
