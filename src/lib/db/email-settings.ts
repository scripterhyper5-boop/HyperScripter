import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { decryptApiKey, encryptApiKey } from "@/lib/crypto/api-key-encryption";
import type { EmailSettingsInput, EmailSettingsView } from "@/lib/email/types";

export interface DbEmailSettings {
  id: string;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  sender_name: string;
  sender_email: string;
  created_at: string;
  updated_at: string;
}

const EMPTY: EmailSettingsView = {
  id: null,
  smtpHost: "",
  smtpPort: 587,
  smtpUsername: "",
  smtpPasswordConfigured: false,
  senderName: "HyperScripter",
  senderEmail: "",
  updatedAt: null,
};

function toView(row: DbEmailSettings | null): EmailSettingsView {
  if (!row) return { ...EMPTY };
  return {
    id: row.id,
    smtpHost: row.smtp_host ?? "",
    smtpPort: row.smtp_port ?? 587,
    smtpUsername: row.smtp_username ?? "",
    smtpPasswordConfigured: Boolean(row.smtp_password?.trim()),
    senderName: row.sender_name ?? "HyperScripter",
    senderEmail: row.sender_email ?? "",
    updatedAt: row.updated_at,
  };
}

export async function getEmailSettings(): Promise<EmailSettingsView> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return { ...EMPTY };

  try {
    const { data, error } = await supabase
      .from("email_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      if (error.code === "PGRST205" || error.code === "42P01") {
        console.warn("[getEmailSettings] email_settings table missing — run email-schema.sql");
        return { ...EMPTY };
      }
      console.error("[getEmailSettings]", error.message);
      return { ...EMPTY };
    }

    return toView((data as DbEmailSettings | null) ?? null);
  } catch (error) {
    console.error("[getEmailSettings]", error);
    return { ...EMPTY };
  }
}

export async function getEmailSettingsWithPassword(): Promise<{
  settings: EmailSettingsView;
  smtpPassword: string;
} | null> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("email_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as DbEmailSettings;
  let smtpPassword = "";

  if (row.smtp_password?.trim()) {
    try {
      smtpPassword = decryptApiKey(row.smtp_password);
    } catch {
      console.error("[getEmailSettingsWithPassword] Failed to decrypt SMTP password");
      return null;
    }
  }

  return {
    settings: toView(row),
    smtpPassword,
  };
}

export async function upsertEmailSettings(input: EmailSettingsInput): Promise<EmailSettingsView> {
  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");

  const existing = await getEmailSettings();
  const payload: Record<string, unknown> = {
    smtp_host: input.smtpHost?.trim() ?? "",
    smtp_port: input.smtpPort ?? 587,
    smtp_username: input.smtpUsername?.trim() ?? "",
    sender_name: input.senderName?.trim() || "HyperScripter",
    sender_email: input.senderEmail?.trim().toLowerCase() ?? "",
    updated_at: new Date().toISOString(),
  };

  if (input.smtpPassword?.trim()) {
    payload.smtp_password = encryptApiKey(input.smtpPassword.trim());
  }

  if (existing.id) {
    const { data, error } = await supabase
      .from("email_settings")
      .update(payload)
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return toView(data as DbEmailSettings);
  }

  const { data, error } = await supabase
    .from("email_settings")
    .insert({
      ...payload,
      smtp_password: input.smtpPassword?.trim()
        ? encryptApiKey(input.smtpPassword.trim())
        : "",
      created_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return toView(data as DbEmailSettings);
}

export function isEmailConfigured(
  settings: EmailSettingsView,
  smtpPassword: string
): boolean {
  return Boolean(
    settings.smtpHost.trim() &&
      settings.smtpPort > 0 &&
      settings.smtpUsername.trim() &&
      smtpPassword.trim() &&
      settings.senderEmail.trim()
  );
}
