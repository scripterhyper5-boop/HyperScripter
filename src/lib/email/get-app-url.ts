import "server-only";

import { siteConfig } from "@/lib/site-config";

export function getAppUrl(): string {
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  const base = envUrl || siteConfig.url;
  return base.replace(/\/$/, "");
}
