import { NextResponse } from "next/server";
import { getAdminServerSession } from "@/lib/auth/session";
import { updateBlogPost, deleteBlogPost } from "@/lib/db/blog-posts";
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
      excerpt?: string;
      content?: string;
      status?: ContentStatus;
    };

    const post = await updateBlogPost(id, body);
    return NextResponse.json({ post });
  } catch (error) {
    console.error("[PATCH /api/admin/blog/:id]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update blog post" },
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
    await deleteBlogPost(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/blog/:id]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete blog post" },
      { status: 500 }
    );
  }
}
