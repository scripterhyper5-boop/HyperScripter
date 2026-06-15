import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { dbLegalPageToApp } from "@/lib/db/mappers";
import type { ContentStatus } from "@/lib/supabase/types";

export type LegalPageInput = {
  title: string;
  slug: string;
  content: string;
  status: ContentStatus;
};

export async function listLegalPages() {
  const supabase = createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("legal_pages")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => dbLegalPageToApp(row as import("@/lib/supabase/types").DbLegalPage));
}

export async function getPublishedLegalPageBySlug(slug: string) {
  const supabase = createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("legal_pages")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? dbLegalPageToApp(data as import("@/lib/supabase/types").DbLegalPage) : null;
}

export async function createLegalPage(input: LegalPageInput) {
  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");

  const { data, error } = await supabase
    .from("legal_pages")
    .insert({
      title: input.title,
      slug: input.slug,
      content: input.content,
      status: input.status,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return dbLegalPageToApp(data as import("@/lib/supabase/types").DbLegalPage);
}

export async function updateLegalPage(id: string, input: Partial<LegalPageInput>) {
  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");

  const { data, error } = await supabase
    .from("legal_pages")
    .update({
      ...(input.title !== undefined && { title: input.title }),
      ...(input.slug !== undefined && { slug: input.slug }),
      ...(input.content !== undefined && { content: input.content }),
      ...(input.status !== undefined && { status: input.status }),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return dbLegalPageToApp(data as import("@/lib/supabase/types").DbLegalPage);
}

export async function deleteLegalPage(id: string) {
  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");

  const { error } = await supabase.from("legal_pages").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
