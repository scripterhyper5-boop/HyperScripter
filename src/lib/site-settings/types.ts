import type { FaviconSettings } from "@/lib/favicon/types";
import { sanitizeFaviconSettings } from "@/lib/favicon/validation";
import type { SeoSettings } from "@/lib/seo-settings/types";
import { sanitizeSeoSettings } from "@/lib/seo-settings/validation";

export interface SiteSettingsView {
  id: string | null;
  headCode: string;
  bodyStartCode: string;
  bodyEndCode: string;
  favicon: FaviconSettings | null;
  seoSettings: SeoSettings | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export const EMPTY_SITE_SETTINGS: SiteSettingsView = {
  id: null,
  headCode: "",
  bodyStartCode: "",
  bodyEndCode: "",
  favicon: null,
  seoSettings: null,
  createdAt: null,
  updatedAt: null,
};

export function parseFaviconFromDb(value: unknown): FaviconSettings | null {
  return sanitizeFaviconSettings(value);
}

export function parseSeoSettingsFromDb(value: unknown): SeoSettings | null {
  if (!value || typeof value !== "object") return null;
  return sanitizeSeoSettings(value);
}