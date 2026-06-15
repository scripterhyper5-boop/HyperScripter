import type { Metadata } from "next";
import { absoluteUrl, type ResolvedSeoSettings } from "@/lib/seo-settings/resolve";
import { getResolvedSeoSettings } from "@/lib/seo-settings/server";

export interface MetadataOptions {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  ogType?: "website" | "article";
}

export function buildMetadata(
  seo: ResolvedSeoSettings,
  {
    title,
    description,
    path = "",
    image,
    noIndex = false,
    ogType,
  }: MetadataOptions = {}
): Metadata {
  const pageTitle = title ? `${title} | ${seo.siteName}` : seo.siteTitle;
  const pageDescription = description ?? seo.metaDescription;
  const baseUrl = seo.canonicalUrl.replace(/\/$/, "");
  const url = `${baseUrl}${path}`;
  const ogImage = absoluteUrl(baseUrl, image ?? seo.ogImageUrl);
  const keywords = seo.metaKeywords
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  const shouldIndex = !noIndex && seo.indexWebsite;
  const shouldFollow = !noIndex && seo.followLinks;

  return {
    metadataBase: new URL(baseUrl),
    title: pageTitle,
    description: pageDescription,
    keywords,
    authors: [{ name: seo.authorName, url: baseUrl }],
    creator: seo.authorName,
    publisher: seo.siteName,
    robots: {
      index: shouldIndex,
      follow: shouldFollow,
      googleBot: { index: shouldIndex, follow: shouldFollow },
    },
    alternates: { canonical: url },
    openGraph: {
      type: ogType ?? seo.ogType,
      locale: "en_US",
      url,
      title: title ? pageTitle : seo.ogTitle,
      description: description ?? seo.ogDescription,
      siteName: seo.siteName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: seo.ogTitle,
        },
      ],
    },
    twitter: {
      card: seo.twitterCard,
      title: title ? pageTitle : seo.ogTitle,
      description: description ?? seo.ogDescription,
      images: [ogImage],
    },
    verification: {
      google: seo.googleSiteVerification || undefined,
      yandex: seo.yandexVerification || undefined,
      other: {
        ...(seo.bingSiteVerification
          ? { "msvalidate.01": seo.bingSiteVerification }
          : {}),
        ...(seo.pinterestVerification
          ? { "p:domain_verify": seo.pinterestVerification }
          : {}),
      },
    },
  };
}

export async function createMetadata(options: MetadataOptions = {}): Promise<Metadata> {
  const seo = await getResolvedSeoSettings();
  return buildMetadata(seo, options);
}

export async function organizationSchema(seo?: ResolvedSeoSettings) {
  const config = seo ?? (await getResolvedSeoSettings());
  if (!config.enableOrganizationSchema) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: config.organizationName,
    url: config.organizationWebsiteUrl,
    logo: config.organizationLogoUrl,
    description: config.metaDescription,
    sameAs: config.organizationSocialProfiles.filter(Boolean),
  };
}

export async function websiteSchema(seo?: ResolvedSeoSettings) {
  const config = seo ?? (await getResolvedSeoSettings());

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: config.siteName,
    url: config.organizationWebsiteUrl,
    description: config.metaDescription,
    publisher: {
      "@type": "Organization",
      name: config.organizationName,
    },
  };
}

export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export async function breadcrumbSchema(
  items: { name: string; url: string }[],
  seo?: ResolvedSeoSettings
) {
  const config = seo ?? (await getResolvedSeoSettings());
  const baseUrl = config.canonicalUrl.replace(/\/$/, "");

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.url}`,
    })),
  };
}

export async function articleSchema({
  title,
  description,
  slug,
  publishedAt,
  author,
}: {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  author?: string;
}) {
  const config = await getResolvedSeoSettings();
  const baseUrl = config.canonicalUrl.replace(/\/$/, "");

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    url: `${baseUrl}/blog/${slug}`,
    datePublished: publishedAt,
    dateModified: publishedAt,
    author: {
      "@type": "Person",
      name: author ?? config.authorName,
    },
    publisher: {
      "@type": "Organization",
      name: config.organizationName,
      logo: {
        "@type": "ImageObject",
        url: config.organizationLogoUrl,
      },
    },
  };
}

export async function softwareApplicationSchema(seo?: ResolvedSeoSettings) {
  const config = seo ?? (await getResolvedSeoSettings());

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: config.siteName,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description: config.metaDescription,
  };
}
