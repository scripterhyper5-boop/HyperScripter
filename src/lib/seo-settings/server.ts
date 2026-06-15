import "server-only";

import { cache } from "react";
import { getSiteSettings } from "@/lib/db/site-settings";
import { resolveSeoSettings, type ResolvedSeoSettings } from "@/lib/seo-settings/resolve";

export const getResolvedSeoSettings = cache(async (): Promise<ResolvedSeoSettings> => {
  const settings = await getSiteSettings();
  return resolveSeoSettings(settings.seoSettings);
});
