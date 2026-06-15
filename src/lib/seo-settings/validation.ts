import {
  DEFAULT_SEO_SETTINGS,
  type OgType,
  type SeoSettings,
  type TwitterCardType,
} from "@/lib/seo-settings/types";

const MAX_TEXT = 500;
const MAX_LONG = 2000;
const MAX_URL = 2048;
const MAX_PROFILES = 20;

function trim(value: unknown, fallback = "", max = MAX_TEXT): string {
  if (typeof value !== "string") return fallback;
  return value.trim().slice(0, max);
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function sanitizeProfiles(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const profiles = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, MAX_PROFILES);
  return profiles.length > 0 ? profiles : fallback;
}

export function sanitizeSeoSettings(value: unknown): SeoSettings {
  const fallback = DEFAULT_SEO_SETTINGS;
  if (!value || typeof value !== "object") return { ...fallback };

  const record = value as Record<string, unknown>;
  const ogType = record.ogType === "article" ? "article" : "website";
  const twitterCard: TwitterCardType =
    record.twitterCard === "summary" ? "summary" : "summary_large_image";

  return {
    siteName: trim(record.siteName, fallback.siteName) || fallback.siteName,
    siteTitle: trim(record.siteTitle, fallback.siteTitle, MAX_LONG) || fallback.siteTitle,
    metaDescription:
      trim(record.metaDescription, fallback.metaDescription, MAX_LONG) ||
      fallback.metaDescription,
    metaKeywords: trim(record.metaKeywords, fallback.metaKeywords, MAX_LONG),
    canonicalUrl: trim(record.canonicalUrl, fallback.canonicalUrl, MAX_URL) || fallback.canonicalUrl,
    authorName: trim(record.authorName, fallback.authorName) || fallback.authorName,
    indexWebsite: bool(record.indexWebsite, fallback.indexWebsite),
    followLinks: bool(record.followLinks, fallback.followLinks),
    ogTitle: trim(record.ogTitle, fallback.ogTitle, MAX_LONG) || fallback.ogTitle,
    ogDescription:
      trim(record.ogDescription, fallback.ogDescription, MAX_LONG) || fallback.ogDescription,
    ogImageUrl: trim(record.ogImageUrl, fallback.ogImageUrl, MAX_URL) || fallback.ogImageUrl,
    ogType: ogType as OgType,
    twitterCard,
    googleSiteVerification: trim(record.googleSiteVerification),
    bingSiteVerification: trim(record.bingSiteVerification),
    yandexVerification: trim(record.yandexVerification),
    pinterestVerification: trim(record.pinterestVerification),
    googleAnalyticsId: trim(record.googleAnalyticsId),
    googleTagManagerId: trim(record.googleTagManagerId),
    microsoftClarityId: trim(record.microsoftClarityId),
    metaPixelId: trim(record.metaPixelId),
    enableOrganizationSchema: bool(
      record.enableOrganizationSchema,
      fallback.enableOrganizationSchema
    ),
    organizationName:
      trim(record.organizationName, fallback.organizationName) || fallback.organizationName,
    organizationLogoUrl:
      trim(record.organizationLogoUrl, fallback.organizationLogoUrl, MAX_URL) ||
      fallback.organizationLogoUrl,
    organizationWebsiteUrl:
      trim(record.organizationWebsiteUrl, fallback.organizationWebsiteUrl, MAX_URL) ||
      fallback.organizationWebsiteUrl,
    organizationSocialProfiles: sanitizeProfiles(
      record.organizationSocialProfiles,
      fallback.organizationSocialProfiles
    ),
    updatedAt:
      typeof record.updatedAt === "string" ? record.updatedAt : new Date().toISOString(),
  };
}

export interface SeoValidationIssue {
  field: string;
  level: "warning" | "error";
  message: string;
}

export function validateSeoSettings(settings: SeoSettings): SeoValidationIssue[] {
  const issues: SeoValidationIssue[] = [];

  if (!settings.siteName.trim()) {
    issues.push({ field: "siteName", level: "error", message: "Site name is required." });
  }

  if (settings.siteTitle.length < 30 || settings.siteTitle.length > 70) {
    issues.push({
      field: "siteTitle",
      level: "warning",
      message: "Site title should be between 30 and 70 characters for best SEO.",
    });
  }

  if (settings.metaDescription.length < 120 || settings.metaDescription.length > 160) {
    issues.push({
      field: "metaDescription",
      level: "warning",
      message: "Meta description should be between 120 and 160 characters.",
    });
  }

  try {
    new URL(settings.canonicalUrl);
  } catch {
    issues.push({
      field: "canonicalUrl",
      level: "error",
      message: "Canonical URL must be a valid absolute URL.",
    });
  }

  if (!settings.metaKeywords.trim()) {
    issues.push({
      field: "metaKeywords",
      level: "warning",
      message: "Add meta keywords to improve topical relevance.",
    });
  }

  if (settings.ogImageUrl && !settings.ogImageUrl.startsWith("/") && !settings.ogImageUrl.startsWith("http")) {
    issues.push({
      field: "ogImageUrl",
      level: "error",
      message: "OG image URL must be an absolute or root-relative path.",
    });
  }

  return issues;
}

export function validateOgImageFile(file: File): string | null {
  if (file.size > 5 * 1024 * 1024) return "OG image must be 5MB or less";

  const lower = file.name.toLowerCase();
  const allowed =
    lower.endsWith(".png") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".webp");

  if (!allowed) return "Only .png, .jpg, .jpeg, and .webp images are allowed";
  return null;
}
