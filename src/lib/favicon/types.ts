export type FaviconType = "png" | "svg" | "ico";

export interface FaviconSettings {
  url: string;
  icon16Url?: string;
  icon32Url?: string;
  appleTouchIconUrl?: string;
  type: FaviconType;
  updatedAt: string;
}

export const DEFAULT_FAVICON: FaviconSettings = {
  url: "/logo.svg",
  type: "svg",
  updatedAt: "",
};

export const FAVICON_MAX_BYTES = 2 * 1024 * 1024;

export const FAVICON_ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);

export const FAVICON_PUBLIC_DIR = "/uploads/favicon";

export function isFaviconConfigured(favicon: FaviconSettings | null | undefined): boolean {
  return Boolean(favicon?.url && favicon.url.startsWith(FAVICON_PUBLIC_DIR));
}

export function getFaviconMimeType(type: FaviconType): string {
  switch (type) {
    case "svg":
      return "image/svg+xml";
    case "ico":
      return "image/x-icon";
    default:
      return "image/png";
  }
}

export function resolveFaviconForSite(
  favicon: FaviconSettings | null | undefined
): FaviconSettings {
  if (isFaviconConfigured(favicon)) {
    return favicon!;
  }
  return DEFAULT_FAVICON;
}
