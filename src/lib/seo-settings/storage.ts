import "server-only";

import fs from "fs/promises";
import path from "path";
import { SEO_OG_IMAGE_DIR } from "@/lib/seo-settings/types";

const SEO_DIR = path.join(process.cwd(), "public", "uploads", "seo");

export async function ensureSeoUploadDir(): Promise<void> {
  await fs.mkdir(SEO_DIR, { recursive: true });
}

export async function clearOgImages(): Promise<void> {
  await ensureSeoUploadDir();
  const files = await fs.readdir(SEO_DIR);
  await Promise.all(
    files
      .filter((file) => file !== ".gitkeep" && file.startsWith("og-image"))
      .map((file) => fs.unlink(path.join(SEO_DIR, file)).catch(() => undefined))
  );
}

export async function saveOgImage(buffer: Buffer, ext: string): Promise<string> {
  await clearOgImages();
  const filename = `og-image.${ext.replace(".", "")}`;
  const filePath = path.join(SEO_DIR, filename);
  await fs.writeFile(filePath, buffer);
  return `${SEO_OG_IMAGE_DIR}/${filename}`;
}
