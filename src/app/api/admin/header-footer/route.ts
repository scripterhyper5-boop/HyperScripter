import { NextResponse } from "next/server";
import { getAdminServerSession } from "@/lib/auth/session";
import {
  getHeaderFooterSettings,
  upsertHeaderFooterSettings,
} from "@/lib/db/header-footer-settings";

export async function GET() {
  const session = await getAdminServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await getHeaderFooterSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("[GET /api/admin/header-footer]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load settings" },
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
    const body = (await request.json()) as { header?: unknown; footer?: unknown };
    const settings = await upsertHeaderFooterSettings({
      header: body.header,
      footer: body.footer,
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("[PUT /api/admin/header-footer]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getAdminServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { action?: unknown };
    if (body.action !== "reset") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const { resetHeaderFooterSettings } = await import("@/lib/db/header-footer-settings");
    const settings = await resetHeaderFooterSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("[POST /api/admin/header-footer]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reset settings" },
      { status: 500 }
    );
  }
}
