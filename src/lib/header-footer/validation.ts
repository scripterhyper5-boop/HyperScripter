import {
  DEFAULT_FOOTER_SETTINGS,
  DEFAULT_HEADER_FOOTER_SETTINGS,
  DEFAULT_HEADER_SETTINGS,
  type FooterSettings,
  type HeaderFooterSettingsView,
  type HeaderSettings,
  type NavLink,
  type SocialLinks,
} from "@/lib/header-footer/types";

const MAX_TEXT = 500;
const MAX_URL = 2048;
const MAX_LINKS = 20;

function trimString(value: unknown, fallback = "", max = MAX_TEXT): string {
  if (typeof value !== "string") return fallback;
  return value.trim().slice(0, max);
}

function sanitizeNavLinks(value: unknown, fallback: NavLink[]): NavLink[] {
  if (!Array.isArray(value)) return fallback;

  const links: NavLink[] = [];
  for (const item of value.slice(0, MAX_LINKS)) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const label = trimString(record.label);
    const url = trimString(record.url, "", MAX_URL);
    if (!label || !url) continue;
    links.push({ label, url });
  }

  return links.length > 0 ? links : fallback;
}

function sanitizeSocialLinks(value: unknown, fallback: SocialLinks): SocialLinks {
  const base = { ...fallback };
  if (!value || typeof value !== "object") return base;

  const record = value as Record<string, unknown>;
  const keys = ["twitter", "youtube", "linkedin", "facebook", "instagram", "discord"] as const;

  for (const key of keys) {
    base[key] = trimString(record[key], base[key], MAX_URL);
  }

  return base;
}

function sanitizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function sanitizeHeaderSettings(value: unknown): HeaderSettings {
  const fallback = DEFAULT_HEADER_SETTINGS;
  if (!value || typeof value !== "object") return { ...fallback };

  const record = value as Record<string, unknown>;
  return {
    logoText: trimString(record.logoText, fallback.logoText) || fallback.logoText,
    navigation: sanitizeNavLinks(record.navigation, fallback.navigation),
    ctaText: trimString(record.ctaText, fallback.ctaText) || fallback.ctaText,
    ctaUrl: trimString(record.ctaUrl, fallback.ctaUrl, MAX_URL) || fallback.ctaUrl,
    showNavigation: sanitizeBoolean(record.showNavigation, fallback.showNavigation),
    showCta: sanitizeBoolean(record.showCta, fallback.showCta),
  };
}

export function sanitizeFooterSettings(value: unknown): FooterSettings {
  const fallback = DEFAULT_FOOTER_SETTINGS;
  if (!value || typeof value !== "object") return { ...fallback };

  const record = value as Record<string, unknown>;
  return {
    companyName:
      trimString(record.companyName, fallback.companyName) || fallback.companyName,
    copyright: trimString(record.copyright, fallback.copyright) || fallback.copyright,
    description: trimString(record.description, fallback.description, 1000),
    quickLinks: sanitizeNavLinks(record.quickLinks, fallback.quickLinks),
    privacyPolicyUrl: trimString(
      record.privacyPolicyUrl,
      fallback.privacyPolicyUrl,
      MAX_URL
    ),
    termsOfServiceUrl: trimString(
      record.termsOfServiceUrl,
      fallback.termsOfServiceUrl,
      MAX_URL
    ),
    socialLinks: sanitizeSocialLinks(record.socialLinks, fallback.socialLinks),
    showDescription: sanitizeBoolean(record.showDescription, fallback.showDescription),
    showQuickLinks: sanitizeBoolean(record.showQuickLinks, fallback.showQuickLinks),
    showLegalLinks: sanitizeBoolean(record.showLegalLinks, fallback.showLegalLinks),
    showSocialLinks: sanitizeBoolean(record.showSocialLinks, fallback.showSocialLinks),
  };
}

export function sanitizeHeaderFooterSettings(
  value: unknown
): HeaderFooterSettingsView {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_HEADER_FOOTER_SETTINGS };
  }

  const record = value as Record<string, unknown>;
  return {
    header: sanitizeHeaderSettings(record.header),
    footer: sanitizeFooterSettings(record.footer),
  };
}
