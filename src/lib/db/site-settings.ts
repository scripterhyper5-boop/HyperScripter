import "server-only";

import { cache } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { FaviconSettings } from "@/lib/favicon/types";
import { sanitizeFaviconSettings } from "@/lib/favicon/validation";
import type { SeoSettings } from "@/lib/seo-settings/types";
import { DEFAULT_SEO_SETTINGS } from "@/lib/seo-settings/types";
import { sanitizeSeoSettings } from "@/lib/seo-settings/validation";
import {
  EMPTY_SITE_SETTINGS,
  parseFaviconFromDb,
  parseSeoSettingsFromDb,
  type SiteSettingsView,
} from "@/lib/site-settings/types";

export type { SiteSettingsView } from "@/lib/site-settings/types";

export interface DbSiteSettings {
  id: string;
  head_code: string;
  body_start_code: string;
  body_end_code: string;
  favicon: unknown;
  seo_settings: unknown;
  created_at: string;
  updated_at: string;
}

function toView(row: DbSiteSettings | null): SiteSettingsView {
  if (!row) return { ...EMPTY_SITE_SETTINGS };
  return {
    id: row.id,
    headCode: row.head_code ?? "",
    bodyStartCode: row.body_start_code ?? "",
    bodyEndCode: row.body_end_code ?? "",
    favicon: parseFaviconFromDb(row.favicon),
    seoSettings: row.seo_settings ? parseSeoSettingsFromDb(row.seo_settings) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchSiteSettings(): Promise<SiteSettingsView> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return { ...EMPTY_SITE_SETTINGS };

  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      if (error.code === "PGRST205" || error.code === "42P01") {
        console.warn("[getSiteSettings] site_settings table missing — run site-settings-schema.sql");
        return { ...EMPTY_SITE_SETTINGS };
      }
      console.error("[getSiteSettings]", error.message);
      return { ...EMPTY_SITE_SETTINGS };
    }

    return toView((data as DbSiteSettings | null) ?? null);
  } catch (error) {
    console.error("[getSiteSettings]", error);
    return { ...EMPTY_SITE_SETTINGS };
  }
}

/** Per-request deduplicated site settings loader */
export const getSiteSettings = cache(fetchSiteSettings);

export interface SiteSettingsInput {
  headCode?: string;
  bodyStartCode?: string;
  bodyEndCode?: string;
}

export async function upsertSiteSettings(input: SiteSettingsInput): Promise<SiteSettingsView> {
  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");

  const existing = await fetchSiteSettings();

  const payload = {
    head_code: input.headCode ?? existing.headCode,
    body_start_code: input.bodyStartCode ?? existing.bodyStartCode,
    body_end_code: input.bodyEndCode ?? existing.bodyEndCode,
    updated_at: new Date().toISOString(),
  };

  if (existing.id) {
    const { data, error } = await supabase
      .from("site_settings")
      .update(payload)
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return toView(data as DbSiteSettings);
  }

  const { data, error } = await supabase
    .from("site_settings")
    .insert({
      ...payload,
      favicon: null,
      seo_settings: null,
      created_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return toView(data as DbSiteSettings);
}

export async function getFaviconSettings(): Promise<FaviconSettings | null> {
  const settings = await getSiteSettings();
  return settings.favicon;
}

export async function updateFaviconSettings(
  favicon: FaviconSettings | null
): Promise<SiteSettingsView> {
  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");

  const existing = await fetchSiteSettings();
  const sanitized = favicon ? sanitizeFaviconSettings(favicon) : null;

  const payload = {
    favicon: sanitized,
    updated_at: new Date().toISOString(),
  };

  if (existing.id) {
    const { data, error } = await supabase
      .from("site_settings")
      .update(payload)
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return toView(data as DbSiteSettings);
  }

  const { data, error } = await supabase
    .from("site_settings")
    .insert({
      head_code: "",
      body_start_code: "",
      body_end_code: "",
      favicon: sanitized,
      seo_settings: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return toView(data as DbSiteSettings);
}

export async function getSeoSettings(): Promise<SeoSettings | null> {
  const settings = await getSiteSettings();
  return settings.seoSettings;
}

export async function updateSeoSettings(seo: SeoSettings): Promise<SiteSettingsView> {
  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");

  const existing = await fetchSiteSettings();
  const sanitized = sanitizeSeoSettings({
    ...seo,
    updatedAt: new Date().toISOString(),
  });

  const payload = {
    seo_settings: sanitized,
    updated_at: new Date().toISOString(),
  };

  if (existing.id) {
    const { data, error } = await supabase
      .from("site_settings")
      .update(payload)
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return toView(data as DbSiteSettings);
  }

  const { data, error } = await supabase
    .from("site_settings")
    .insert({
      head_code: "",
      body_start_code: "",
      body_end_code: "",
      favicon: null,
      seo_settings: sanitized,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return toView(data as DbSiteSettings);
}

export async function resetSeoSettings(): Promise<SiteSettingsView> {
  return updateSeoSettings({ ...DEFAULT_SEO_SETTINGS, updatedAt: new Date().toISOString() });
}
