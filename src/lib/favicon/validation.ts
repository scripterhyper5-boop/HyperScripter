import {
  FAVICON_MAX_BYTES,
  type FaviconSettings,
  type FaviconType,
} from "@/lib/favicon/types";

export function sanitizeFaviconSettings(value: unknown): FaviconSettings | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const url = typeof record.url === "string" ? record.url.trim() : "";
  const type = record.type;

  if (!url || (type !== "png" && type !== "svg" && type !== "ico")) {
    return null;
  }

  const updatedAt =
    typeof record.updatedAt === "string" ? record.updatedAt : new Date().toISOString();

  return {
    url,
    type: type as FaviconType,
    updatedAt,
    icon16Url: typeof record.icon16Url === "string" ? record.icon16Url : undefined,
    icon32Url: typeof record.icon32Url === "string" ? record.icon32Url : undefined,
    appleTouchIconUrl:
      typeof record.appleTouchIconUrl === "string" ? record.appleTouchIconUrl : undefined,
  };
}

export function validateFaviconFile(file: File): string | null {
  if (file.size > FAVICON_MAX_BYTES) {
    return "File size must be 2MB or less";
  }

  const lower = file.name.toLowerCase();
  const allowedExt = lower.endsWith(".png") || lower.endsWith(".svg") || lower.endsWith(".ico");
  const allowedMime =
    file.type === "image/png" ||
    file.type === "image/svg+xml" ||
    file.type === "image/x-icon" ||
    file.type === "image/vnd.microsoft.icon" ||
    file.type === "";

  if (!allowedExt) {
    return "Only .png, .svg, and .ico files are allowed";
  }

  if (!allowedMime) {
    return "Invalid file type. Only PNG, SVG, and ICO are allowed";
  }

  return null;
}
