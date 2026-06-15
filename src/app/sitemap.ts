import type { MetadataRoute } from "next";
import { getAllPublishedBlogSlugs } from "@/lib/blog";
import { getResolvedSeoSettings } from "@/lib/seo-settings/server";

const LEGAL_SLUGS = ["privacy-policy", "terms-of-service", "cookie-policy"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const seo = await getResolvedSeoSettings();
  const baseUrl = seo.canonicalUrl.replace(/\/$/, "");
  const slugs = await getAllPublishedBlogSlugs();
  const blogEntries = slugs.map((slug) => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const legalEntries = LEGAL_SLUGS.map((slug) => ({
    url: `${baseUrl}/legal/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...legalEntries,
    ...blogEntries,
  ];
}
