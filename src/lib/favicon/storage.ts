import "server-only";

import fs from "fs/promises";
import path from "path";
import {
  FAVICON_PUBLIC_DIR,
  type FaviconSettings,
  type FaviconType,
} from "@/lib/favicon/types";

const FAVICON_DIR = path.join(process.cwd(), "public", "uploads", "favicon");

export function getFaviconStorageDir(): string {
  return FAVICON_DIR;
}

export async function ensureFaviconDir(): Promise<void> {
  await fs.mkdir(FAVICON_DIR, { recursive: true });
}

export async function clearFaviconFiles(): Promise<void> {
  await ensureFaviconDir();
  const files = await fs.readdir(FAVICON_DIR);
  await Promise.all(
    files
      .filter((file) => file !== ".gitkeep")
      .map((file) => fs.unlink(path.join(FAVICON_DIR, file)).catch(() => undefined))
  );
}

export function publicFaviconPath(filename: string): string {
  return `${FAVICON_PUBLIC_DIR}/${filename}`;
}

export async function writeFaviconFile(filename: string, data: Buffer): Promise<string> {
  await ensureFaviconDir();
  const filePath = path.join(FAVICON_DIR, filename);
  await fs.writeFile(filePath, data);
  return publicFaviconPath(filename);
}

export async function removeUploadedFavicon(): Promise<void> {
  await clearFaviconFiles();
}

export function buildFaviconSettings(
  type: FaviconType,
  mainUrl: string,
  generated?: Pick<FaviconSettings, "icon16Url" | "icon32Url" | "appleTouchIconUrl">
): FaviconSettings {
  return {
    url: mainUrl,
    icon16Url: generated?.icon16Url,
    icon32Url: generated?.icon32Url,
    appleTouchIconUrl: generated?.appleTouchIconUrl,
    type,
    updatedAt: new Date().toISOString(),
  };
}
