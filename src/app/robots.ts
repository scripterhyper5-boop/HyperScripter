import type { MetadataRoute } from "next";
import { getResolvedSeoSettings } from "@/lib/seo-settings/server";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const seo = await getResolvedSeoSettings();
  const baseUrl = seo.canonicalUrl.replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: seo.indexWebsite ? "/" : undefined,
      disallow: seo.indexWebsite ? undefined : "/",
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
