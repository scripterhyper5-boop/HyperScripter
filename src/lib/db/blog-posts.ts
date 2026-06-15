import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { dbBlogPostToPublic } from "@/lib/db/mappers";
import type { ContentStatus, DbBlogPost } from "@/lib/supabase/types";

export type BlogPostInput = {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  status: ContentStatus;
};

export async function listPublishedBlogPosts() {
  const supabase = createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => dbBlogPostToPublic(row as DbBlogPost));
}

export async function getPublishedBlogPostBySlug(slug: string) {
  const supabase = createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? dbBlogPostToPublic(data as DbBlogPost) : null;
}

export async function listAllBlogPosts() {
  const supabase = createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const post = row as DbBlogPost;
    return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? "",
    content: post.content,
    featuredImage: "",
    seoTitle: post.title,
    metaDescription: post.excerpt ?? "",
    status: post.status,
    updatedAt: post.updated_at.slice(0, 10),
  };
  });
}

export async function createBlogPost(input: BlogPostInput) {
  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");

  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt ?? null,
      content: input.content,
      status: input.status,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateBlogPost(id: string, input: Partial<BlogPostInput>) {
  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");

  const { data, error } = await supabase
    .from("blog_posts")
    .update({
      ...(input.title !== undefined && { title: input.title }),
      ...(input.slug !== undefined && { slug: input.slug }),
      ...(input.excerpt !== undefined && { excerpt: input.excerpt }),
      ...(input.content !== undefined && { content: input.content }),
      ...(input.status !== undefined && { status: input.status }),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteBlogPost(id: string) {
  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");

  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
