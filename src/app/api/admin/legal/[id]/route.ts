import { NextResponse } from "next/server";
import { getAdminServerSession } from "@/lib/auth/session";
import { updateLegalPage, deleteLegalPage } from "@/lib/db/legal-pages";
import type { ContentStatus } from "@/lib/supabase/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getAdminServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const body = (await request.json()) as {
      title?: string;
      slug?: string;
      content?: string;
      status?: ContentStatus;
    };

    const page = await updateLegalPage(id, body);
    return NextResponse.json({ page });
  } catch (error) {
    console.error("[PATCH /api/admin/legal/:id]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update legal page" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getAdminServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    await deleteLegalPage(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/legal/:id]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete legal page" },
      { status: 500 }
    );
  }
}
