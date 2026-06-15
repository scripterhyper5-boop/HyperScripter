import { NextResponse } from "next/server";
import { getAdminServerSession } from "@/lib/auth/session";
import { listAllBlogPosts, createBlogPost } from "@/lib/db/blog-posts";
import type { ContentStatus } from "@/lib/supabase/types";

export async function GET() {
  const session = await getAdminServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const posts = await listAllBlogPosts();
    return NextResponse.json({ posts });
  } catch (error) {
    console.error("[GET /api/admin/blog]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load blog posts" },
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
      excerpt?: string;
      content: string;
      status: ContentStatus;
    };

    if (!body.title?.trim() || !body.slug?.trim()) {
      return NextResponse.json({ error: "Title and slug are required" }, { status: 400 });
    }

    const post = await createBlogPost({
      title: body.title.trim(),
      slug: body.slug.trim(),
      excerpt: body.excerpt?.trim(),
      content: body.content ?? "",
      status: body.status ?? "draft",
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error("[POST /api/admin/blog]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create blog post" },
      { status: 500 }
    );
  }
}
