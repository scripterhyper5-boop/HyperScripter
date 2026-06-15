import { NextResponse } from "next/server";
import { getAdminServerSession } from "@/lib/auth/session";
import { getSiteSettings, upsertSiteSettings } from "@/lib/db/site-settings";

export async function GET() {
  const session = await getAdminServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await getSiteSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("[GET /api/admin/site-settings]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load site settings" },
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
    const body = (await request.json()) as {
      headCode?: unknown;
      bodyStartCode?: unknown;
      bodyEndCode?: unknown;
    };

    const settings = await upsertSiteSettings({
      headCode: typeof body.headCode === "string" ? body.headCode : "",
      bodyStartCode: typeof body.bodyStartCode === "string" ? body.bodyStartCode : "",
      bodyEndCode: typeof body.bodyEndCode === "string" ? body.bodyEndCode : "",
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("[PUT /api/admin/site-settings]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save site settings" },
      { status: 500 }
    );
  }
}
