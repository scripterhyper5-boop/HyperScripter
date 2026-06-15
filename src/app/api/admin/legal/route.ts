import { NextResponse } from "next/server";
import { getAdminServerSession } from "@/lib/auth/session";
import { listLegalPages, createLegalPage } from "@/lib/db/legal-pages";
import type { ContentStatus } from "@/lib/supabase/types";

export async function GET() {
  const session = await getAdminServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const pages = await listLegalPages();
    return NextResponse.json({ pages });
  } catch (error) {
    console.error("[GET /api/admin/legal]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load legal pages" },
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
    const body = (await request.json()) as {
      title: string;
      slug: string;
      content: string;
      status: ContentStatus;
    };

    if (!body.title?.trim() || !body.slug?.trim()) {
      return NextResponse.json({ error: "Title and slug are required" }, { status: 400 });
    }

    const page = await createLegalPage({
      title: body.title.trim(),
      slug: body.slug.trim(),
      content: body.content ?? "",
      status: body.status ?? "draft",
    });

    return NextResponse.json({ page });
  } catch (error) {
    console.error("[POST /api/admin/legal]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create legal page" },
      { status: 500 }
    );
  }
}
