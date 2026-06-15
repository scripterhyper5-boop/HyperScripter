import { NextResponse } from "next/server";
import { getAdminServerSession } from "@/lib/auth/session";
import {
  getSeoSettings,
  resetSeoSettings,
  updateSeoSettings,
} from "@/lib/db/site-settings";
import { resolveSeoSettings } from "@/lib/seo-settings/resolve";
import { sanitizeSeoSettings, validateSeoSettings } from "@/lib/seo-settings/validation";

export async function GET() {
  const session = await getAdminServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stored = await getSeoSettings();
    const seo = resolveSeoSettings(stored);
    return NextResponse.json({
      seo,
      isCustom: Boolean(stored),
      validation: validateSeoSettings(seo),
    });
  } catch (error) {
    console.error("[GET /api/admin/seo-settings]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load SEO settings" },
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
    const body = await request.json();
    const seo = sanitizeSeoSettings(body);
    const validation = validateSeoSettings(seo);
    const hasErrors = validation.some((issue) => issue.level === "error");
    if (hasErrors) {
      return NextResponse.json(
        { error: "Fix validation errors before saving.", validation },
        { status: 400 }
      );
    }

    await updateSeoSettings(seo);
    return NextResponse.json({
      seo,
      validation,
      message: "SEO settings saved successfully",
    });
  } catch (error) {
    console.error("[PUT /api/admin/seo-settings]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save SEO settings" },
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

    await resetSeoSettings();
    const seo = resolveSeoSettings(await getSeoSettings());
    return NextResponse.json({
      seo,
      validation: validateSeoSettings(seo),
      message: "SEO settings reset to defaults",
    });
  } catch (error) {
    console.error("[POST /api/admin/seo-settings]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reset SEO settings" },
      { status: 500 }
    );
  }
}
