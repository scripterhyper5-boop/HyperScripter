import "server-only";

import { cache } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  DEFAULT_HEADER_FOOTER_SETTINGS,
  type HeaderFooterSettingsView,
} from "@/lib/header-footer/types";
import {
  sanitizeFooterSettings,
  sanitizeHeaderFooterSettings,
  sanitizeHeaderSettings,
} from "@/lib/header-footer/validation";

export type { HeaderFooterSettingsView } from "@/lib/header-footer/types";

interface DbHeaderFooterSettings {
  id: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

function toView(row: DbHeaderFooterSettings | null): HeaderFooterSettingsView {
  if (!row) return { ...DEFAULT_HEADER_FOOTER_SETTINGS };

  const sanitized = sanitizeHeaderFooterSettings(row.settings);
  return {
    id: row.id,
    header: sanitized.header,
    footer: sanitized.footer,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchHeaderFooterSettings(): Promise<HeaderFooterSettingsView> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return { ...DEFAULT_HEADER_FOOTER_SETTINGS };

  try {
    const { data, error } = await supabase
      .from("header_footer_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      if (error.code === "PGRST205" || error.code === "42P01") {
        console.warn(
          "[getHeaderFooterSettings] table missing — run header-footer-settings-schema.sql"
        );
        return { ...DEFAULT_HEADER_FOOTER_SETTINGS };
      }
      console.error("[getHeaderFooterSettings]", error.message);
      return { ...DEFAULT_HEADER_FOOTER_SETTINGS };
    }

    return toView((data as DbHeaderFooterSettings | null) ?? null);
  } catch (error) {
    console.error("[getHeaderFooterSettings]", error);
    return { ...DEFAULT_HEADER_FOOTER_SETTINGS };
  }
}

/** Per-request deduplicated header/footer loader */
export const getHeaderFooterSettings = cache(fetchHeaderFooterSettings);

export interface HeaderFooterSettingsInput {
  header?: unknown;
  footer?: unknown;
}

export async function upsertHeaderFooterSettings(
  input: HeaderFooterSettingsInput
): Promise<HeaderFooterSettingsView> {
  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");

  const current = await fetchHeaderFooterSettings();
  const settings = {
    header: sanitizeHeaderSettings(input.header ?? current.header),
    footer: sanitizeFooterSettings(input.footer ?? current.footer),
  };

  const payload = {
    settings,
    updated_at: new Date().toISOString(),
  };

  if (current.id) {
    const { data, error } = await supabase
      .from("header_footer_settings")
      .update(payload)
      .eq("id", current.id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return toView(data as DbHeaderFooterSettings);
  }

  const { data, error } = await supabase
    .from("header_footer_settings")
    .insert({
      ...payload,
      created_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return toView(data as DbHeaderFooterSettings);
}

export async function resetHeaderFooterSettings(): Promise<HeaderFooterSettingsView> {
  return upsertHeaderFooterSettings({ ...DEFAULT_HEADER_FOOTER_SETTINGS });
}
