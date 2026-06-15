import type { SeoSettings } from "@/lib/seo-settings/types";
import { DEFAULT_SEO_SETTINGS } from "@/lib/seo-settings/types";
import { sanitizeSeoSettings } from "@/lib/seo-settings/validation";

export type ResolvedSeoSettings = SeoSettings;

export function resolveSeoSettings(stored: SeoSettings | null | undefined): ResolvedSeoSettings {
  if (!stored) return { ...DEFAULT_SEO_SETTINGS };
  return sanitizeSeoSettings(stored);
}

export function absoluteUrl(base: string, path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalizedBase = base.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}
