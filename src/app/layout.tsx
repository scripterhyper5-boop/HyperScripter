import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import { HydrationExtensionGuard } from "@/components/hydration-extension-guard";
import { SiteSeoAnalytics } from "@/components/site-seo-analytics";
import {
  SiteBodySnippet,
  SiteHeadSnippet,
} from "@/components/site-settings-injection";
import { SiteFaviconLinks } from "@/components/site-favicon-links";
import { getSiteSettings } from "@/lib/db/site-settings";
import {
  getFaviconMimeType,
  isFaviconConfigured,
  resolveFaviconForSite,
} from "@/lib/favicon/types";
import { buildMetadata } from "@/lib/seo";
import { getResolvedSeoSettings } from "@/lib/seo-settings/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const [siteSettings, seo] = await Promise.all([getSiteSettings(), getResolvedSeoSettings()]);
  const base = buildMetadata(seo);
  const favicon = resolveFaviconForSite(siteSettings.favicon);

  if (!isFaviconConfigured(siteSettings.favicon)) {
    return {
      ...base,
      icons: {
        icon: [{ url: favicon.url, type: getFaviconMimeType(favicon.type) }],
        shortcut: favicon.url,
        apple: favicon.url,
      },
    };
  }

  const icons: Metadata["icons"] = {
    icon: [
      ...(favicon.icon16Url
        ? [{ url: favicon.icon16Url, sizes: "16x16", type: "image/png" as const }]
        : []),
      ...(favicon.icon32Url
        ? [{ url: favicon.icon32Url, sizes: "32x32", type: "image/png" as const }]
        : []),
      { url: favicon.url, type: getFaviconMimeType(favicon.type) },
    ],
    shortcut: favicon.url,
    apple: favicon.appleTouchIconUrl ?? favicon.url,
  };

  return { ...base, icons };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteSettings = await getSiteSettings();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <SiteFaviconLinks favicon={siteSettings.favicon} />
        <SiteHeadSnippet html={siteSettings.headCode} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans min-h-screen antialiased`}
        suppressHydrationWarning
      >
        <SiteBodySnippet html={siteSettings.bodyStartCode} />
        <SiteSeoAnalytics seoSettings={siteSettings.seoSettings} />
        <HydrationExtensionGuard />
        <AppProviders>{children}</AppProviders>
        <SiteBodySnippet html={siteSettings.bodyEndCode} />
      </body>
    </html>
  );
}
