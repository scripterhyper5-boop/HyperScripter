import "server-only";

import sharp from "sharp";
import {
  buildFaviconSettings,
  publicFaviconPath,
  writeFaviconFile,
} from "@/lib/favicon/storage";
import type { FaviconSettings, FaviconType } from "@/lib/favicon/types";

function extensionForType(type: FaviconType): string {
  return type;
}

export async function processFaviconUpload(
  buffer: Buffer,
  type: FaviconType
): Promise<FaviconSettings> {
  const ext = extensionForType(type);
  const mainFilename = `favicon.${ext}`;
  const mainUrl = await writeFaviconFile(mainFilename, buffer);

  if (type === "svg") {
    try {
      const icon16Url = await writeFaviconFile(
        "favicon-16x16.png",
        await sharp(buffer, { density: 300 }).resize(16, 16).png().toBuffer()
      );
      const icon32Url = await writeFaviconFile(
        "favicon-32x32.png",
        await sharp(buffer, { density: 300 }).resize(32, 32).png().toBuffer()
      );
      const appleTouchIconUrl = await writeFaviconFile(
        "apple-touch-icon.png",
        await sharp(buffer, { density: 300 }).resize(180, 180).png().toBuffer()
      );

      return buildFaviconSettings(type, mainUrl, {
        icon16Url,
        icon32Url,
        appleTouchIconUrl,
      });
    } catch {
      return buildFaviconSettings(type, mainUrl);
    }
  }

  const pipeline = sharp(buffer, { failOn: "none" });
  const icon16Url = await writeFaviconFile(
    "favicon-16x16.png",
    await pipeline.clone().resize(16, 16, { fit: "cover" }).png().toBuffer()
  );
  const icon32Url = await writeFaviconFile(
    "favicon-32x32.png",
    await pipeline.clone().resize(32, 32, { fit: "cover" }).png().toBuffer()
  );
  const appleTouchIconUrl = await writeFaviconFile(
    "apple-touch-icon.png",
    await pipeline.clone().resize(180, 180, { fit: "cover" }).png().toBuffer()
  );

  return buildFaviconSettings(type, mainUrl, {
    icon16Url,
    icon32Url,
    appleTouchIconUrl,
  });
}

export function detectFaviconType(
  mimeType: string,
  filename: string
): FaviconType | null {
  const lower = filename.toLowerCase();
  if (mimeType === "image/svg+xml" || lower.endsWith(".svg")) return "svg";
  if (
    mimeType === "image/x-icon" ||
    mimeType === "image/vnd.microsoft.icon" ||
    lower.endsWith(".ico")
  ) {
    return "ico";
  }
  if (mimeType === "image/png" || lower.endsWith(".png")) return "png";
  return null;
}

export function previewUrlForSize(settings: FaviconSettings, size: number): string {
  if (size === 16 && settings.icon16Url) return settings.icon16Url;
  if (size === 32 && settings.icon32Url) return settings.icon32Url;
  if (size === 180 && settings.appleTouchIconUrl) return settings.appleTouchIconUrl;
  return settings.url;
}

export { publicFaviconPath };
