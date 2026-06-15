import "server-only";

import {
  decryptApiKey,
  encryptApiKey,
  maskApiKey,
} from "@/lib/crypto/api-key-encryption";
import { GEMINI_MODELS } from "@/lib/gemini-models";
import type { AdminAiSettingsView, AdminAiStatus } from "@/lib/admin/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const GEMINI_PROVIDER = "gemini";

export interface DbAiSetting {
  id: string;
  provider: string;
  api_key: string;
  created_at: string;
  updated_at: string;
}

let importChecked = false;

export async function getAiSettingByProvider(
  provider: string
): Promise<DbAiSetting | null> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("ai_settings")
    .select("*")
    .eq("provider", provider)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as DbAiSetting | null) ?? null;
}

export async function upsertAiSetting(
  provider: string,
  apiKey: string
): Promise<DbAiSetting> {
  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");

  const trimmed = apiKey.trim();
  if (!trimmed) throw new Error("API key is required");

  const encrypted = encryptApiKey(trimmed);
  const now = new Date().toISOString();

  const existing = await getAiSettingByProvider(provider);

  if (existing) {
    const { data, error } = await supabase
      .from("ai_settings")
      .update({ api_key: encrypted, updated_at: now })
      .eq("provider", provider)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return data as DbAiSetting;
  }

  const { data, error } = await supabase
    .from("ai_settings")
    .insert({
      provider,
      api_key: encrypted,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as DbAiSetting;
}

export async function getDecryptedApiKeyByProvider(
  provider: string
): Promise<string | null> {
  const row = await getAiSettingByProvider(provider);
  if (!row?.api_key) return null;

  try {
    return decryptApiKey(row.api_key);
  } catch {
    console.error(`[ai-settings] Failed to decrypt key for ${provider}`);
    return null;
  }
}

export async function ensureGeminiKeyImportedFromEnv(): Promise<void> {
  if (importChecked) return;
  importChecked = true;

  const existing = await getAiSettingByProvider(GEMINI_PROVIDER);
  if (existing) return;

  const envKey = process.env.GEMINI_API_KEY?.trim();
  if (!envKey) return;

  try {
    await upsertAiSetting(GEMINI_PROVIDER, envKey);
    console.log("[ai-settings] Imported GEMINI_API_KEY from environment");
  } catch (error) {
    console.error("[ai-settings] Failed to import GEMINI_API_KEY:", error);
  }
}

export async function getResolvedGeminiApiKey(): Promise<string | null> {
  await ensureGeminiKeyImportedFromEnv();

  const dbKey = await getDecryptedApiKeyByProvider(GEMINI_PROVIDER);
  if (dbKey) return dbKey;

  return process.env.GEMINI_API_KEY?.trim() || null;
}

export async function getAdminAiSettingsView(): Promise<AdminAiSettingsView> {
  await ensureGeminiKeyImportedFromEnv();

  const row = await getAiSettingByProvider(GEMINI_PROVIDER);
  const envKey = process.env.GEMINI_API_KEY?.trim();

  if (row) {
    let maskedApiKey: string | null = null;
    try {
      const decrypted = decryptApiKey(row.api_key);
      maskedApiKey = maskApiKey(decrypted);
    } catch {
      maskedApiKey = "************????";
    }

    return {
      provider: GEMINI_PROVIDER,
      maskedApiKey,
      status: "connected",
      model: GEMINI_MODELS.flash,
      updatedAt: row.updated_at,
      source: "database",
    };
  }

  if (envKey) {
    return {
      provider: GEMINI_PROVIDER,
      maskedApiKey: maskApiKey(envKey),
      status: "connected",
      model: GEMINI_MODELS.flash,
      updatedAt: null,
      source: "environment",
    };
  }

  return {
    provider: GEMINI_PROVIDER,
    maskedApiKey: null,
    status: "not_configured",
    model: GEMINI_MODELS.flash,
    updatedAt: null,
    source: null,
  };
}

export async function getAdminAiStatus(): Promise<AdminAiStatus> {
  try {
    const settings = await getAdminAiSettingsView();
    return {
      provider: settings.provider,
      status:
        settings.status === "not_configured" ? "disconnected" : "connected",
      model: settings.model,
      updatedAt: settings.updatedAt,
    };
  } catch {
    return {
      provider: "gemini",
      status: "disconnected",
      model: GEMINI_MODELS.flash,
      updatedAt: null,
    };
  }
}

export function invalidateImportCache(): void {
  importChecked = false;
}
