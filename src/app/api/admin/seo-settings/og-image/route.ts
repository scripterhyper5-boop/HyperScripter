import { NextResponse } from "next/server";
import { getAdminServerSession } from "@/lib/auth/session";
import { getSeoSettings, updateSeoSettings } from "@/lib/db/site-settings";
import { resolveSeoSettings } from "@/lib/seo-settings/resolve";
import { saveOgImage } from "@/lib/seo-settings/storage";
import { SEO_OG_IMAGE_MAX_BYTES } from "@/lib/seo-settings/types";
import { sanitizeSeoSettings } from "@/lib/seo-settings/validation";

function detectImageExt(mimeType: string, filename: string): string | null {
  const lower = filename.toLowerCase();
  if (mimeType === "image/png" || lower.endsWith(".png")) return "png";
  if (mimeType === "image/jpeg" || lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
    return "jpg";
  }
  if (mimeType === "image/webp" || lower.endsWith(".webp")) return "webp";
  return null;
}

export async function POST(request: Request) {
  const session = await getAdminServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("ogImage");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No OG image provided" }, { status: 400 });
    }

    if (file.size > SEO_OG_IMAGE_MAX_BYTES) {
      return NextResponse.json({ error: "OG image must be 5MB or less" }, { status: 400 });
    }

    const ext = detectImageExt(file.type, file.name);
    if (!ext) {
      return NextResponse.json(
        { error: "Only .png, .jpg, .jpeg, and .webp images are allowed" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ogImageUrl = await saveOgImage(buffer, ext);

    const current = resolveSeoSettings(await getSeoSettings());
    const seo = sanitizeSeoSettings({ ...current, ogImageUrl });
    await updateSeoSettings(seo);

    return NextResponse.json({ ogImageUrl, seo, message: "OG image uploaded successfully" });
  } catch (error) {
    console.error("[POST /api/admin/seo-settings/og-image]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload OG image" },
      { status: 500 }
    );
  }
}
