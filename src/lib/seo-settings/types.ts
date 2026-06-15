import { siteConfig } from "@/lib/site-config";

export type OgType = "website" | "article";
export type TwitterCardType = "summary" | "summary_large_image";

export interface SeoSettings {
  siteName: string;
  siteTitle: string;
  metaDescription: string;
  metaKeywords: string;
  canonicalUrl: string;
  authorName: string;
  indexWebsite: boolean;
  followLinks: boolean;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
  ogType: OgType;
  twitterCard: TwitterCardType;
  googleSiteVerification: string;
  bingSiteVerification: string;
  yandexVerification: string;
  pinterestVerification: string;
  googleAnalyticsId: string;
  googleTagManagerId: string;
  microsoftClarityId: string;
  metaPixelId: string;
  enableOrganizationSchema: boolean;
  organizationName: string;
  organizationLogoUrl: string;
  organizationWebsiteUrl: string;
  organizationSocialProfiles: string[];
  updatedAt?: string;
}

export const DEFAULT_SEO_SETTINGS: SeoSettings = {
  siteName: siteConfig.name,
  siteTitle: `${siteConfig.name} – ${siteConfig.tagline}`,
  metaDescription: siteConfig.description,
  metaKeywords:
    "TikTok script generator, AI TikTok scripts, viral TikTok hooks, social media content, short form video scripts, TikTok captions, content creator tools",
  canonicalUrl: siteConfig.url,
  authorName: siteConfig.creator,
  indexWebsite: true,
  followLinks: true,
  ogTitle: `${siteConfig.name} – ${siteConfig.tagline}`,
  ogDescription: siteConfig.description,
  ogImageUrl: siteConfig.ogImage,
  ogType: "website",
  twitterCard: "summary_large_image",
  googleSiteVerification: "",
  bingSiteVerification: "",
  yandexVerification: "",
  pinterestVerification: "",
  googleAnalyticsId: "",
  googleTagManagerId: "",
  microsoftClarityId: "",
  metaPixelId: "",
  enableOrganizationSchema: true,
  organizationName: siteConfig.name,
  organizationLogoUrl: `${siteConfig.url}/logo.svg`,
  organizationWebsiteUrl: siteConfig.url,
  organizationSocialProfiles: [siteConfig.links.twitter, siteConfig.links.github],
};

export const SEO_OG_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const SEO_OG_IMAGE_DIR = "/uploads/seo";
export const SEO_PREVIEW_QUERY = "seo-preview";
export const SEO_PREVIEW_KEY = "seo-preview-draft";
