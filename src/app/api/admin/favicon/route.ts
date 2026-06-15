import { NextResponse } from "next/server";
import { getAdminServerSession } from "@/lib/auth/session";
import { getFaviconSettings, updateFaviconSettings } from "@/lib/db/site-settings";
import {
  detectFaviconType,
  processFaviconUpload,
} from "@/lib/favicon/process-upload";
import { clearFaviconFiles, removeUploadedFavicon } from "@/lib/favicon/storage";
import { FAVICON_MAX_BYTES, resolveFaviconForSite } from "@/lib/favicon/types";

export async function GET() {
  const session = await getAdminServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const favicon = await getFaviconSettings();
    return NextResponse.json({
      favicon,
      active: resolveFaviconForSite(favicon),
      isCustom: Boolean(favicon?.url),
    });
  } catch (error) {
    console.error("[GET /api/admin/favicon]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load favicon" },
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
    const formData = await request.formData();
    const file = formData.get("favicon");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No favicon file provided" }, { status: 400 });
    }

    if (file.size > FAVICON_MAX_BYTES) {
      return NextResponse.json({ error: "File size must be 2MB or less" }, { status: 400 });
    }

    const type = detectFaviconType(file.type, file.name);
    if (!type) {
      return NextResponse.json(
        { error: "Only .png, .svg, and .ico files are allowed" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await clearFaviconFiles();
    const favicon = await processFaviconUpload(buffer, type);
    await updateFaviconSettings(favicon);

    return NextResponse.json({ favicon, message: "Favicon updated successfully" });
  } catch (error) {
    console.error("[POST /api/admin/favicon]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload favicon" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const session = await getAdminServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await removeUploadedFavicon();
    await updateFaviconSettings(null);
    return NextResponse.json({ message: "Favicon updated successfully", favicon: null });
  } catch (error) {
    console.error("[DELETE /api/admin/favicon]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to remove favicon" },
      { status: 500 }
    );
  }
}
