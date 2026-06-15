import "server-only";

import type { ScriptHistoryItem } from "@/lib/auth/script-history";
import type { GeneratorInput, GeneratorOutput } from "@/lib/generator";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { dbScriptToHistoryItem, historyItemToDbScript } from "@/lib/db/mappers";

export async function listScriptsByUser(userId: string): Promise<ScriptHistoryItem[]> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("scripts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => dbScriptToHistoryItem(row as import("@/lib/supabase/types").DbScript));
}

export async function getScriptById(
  userId: string,
  scriptId: string
): Promise<ScriptHistoryItem | null> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("scripts")
    .select("*")
    .eq("id", scriptId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? dbScriptToHistoryItem(data as import("@/lib/supabase/types").DbScript) : null;
}

export async function createScript(
  userId: string,
  input: GeneratorInput,
  output: GeneratorOutput
): Promise<ScriptHistoryItem> {
  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");

  const item: Omit<ScriptHistoryItem, "id" | "createdAt"> = {
    topic: input.topic,
    niche: input.niche,
    videoType: input.videoType,
    tone: input.tone ?? "casual",
    hookStyle: input.hookStyle,
    audience: input.audience ?? "",
    videoLength: input.videoLength ?? "30s",
    keywords: input.keywords,
    callToAction: input.callToAction,
    output,
  };

  const row = historyItemToDbScript(userId, item);
  const { data, error } = await supabase
    .from("scripts")
    .insert(row)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return dbScriptToHistoryItem(data as import("@/lib/supabase/types").DbScript);
}

export async function updateScript(
  userId: string,
  scriptId: string,
  updates: { topic?: string; output?: Partial<GeneratorOutput> }
): Promise<ScriptHistoryItem | null> {
  const existing = await getScriptById(userId, scriptId);
  if (!existing) return null;

  const merged: ScriptHistoryItem = {
    ...existing,
    topic: updates.topic ?? existing.topic,
    output: updates.output
      ? { ...existing.output, ...updates.output }
      : existing.output,
  };

  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");

  const row = historyItemToDbScript(userId, merged);
  const { data, error } = await supabase
    .from("scripts")
    .update({
      title: row.title,
      niche: row.niche,
      video_type: row.video_type,
      tone: row.tone,
      hook_style: row.hook_style,
      content: row.content,
    })
    .eq("id", scriptId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return dbScriptToHistoryItem(data as import("@/lib/supabase/types").DbScript);
}

export async function deleteScript(userId: string, scriptId: string): Promise<boolean> {
  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");

  const { error } = await supabase
    .from("scripts")
    .delete()
    .eq("id", scriptId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  return true;
}

export async function listAllScriptsForAdmin() {
  const supabase = createServerSupabaseClient();
  if (!supabase) return [];

  const { data: scripts, error } = await supabase
    .from("scripts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);

  const userIds = [...new Set((scripts ?? []).map((s) => s.user_id))];
  const userMap = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name, email")
      .in("id", userIds);

    for (const user of users ?? []) {
      userMap.set(user.id, user.full_name || user.email);
    }
  }

  return (scripts ?? []).map((row) => {
    const scriptRow = row as import("@/lib/supabase/types").DbScript;
    const item = dbScriptToHistoryItem(scriptRow);
    return {
      id: item.id,
      title: item.topic,
      user: userMap.get(scriptRow.user_id) ?? "Unknown",
      createdAt: item.createdAt,
      videoType: item.videoType ?? "—",
      tone: item.tone ?? "—",
    };
  });
}

export { recordScriptGeneration as recordScriptUsage } from "@/lib/db/usage";
