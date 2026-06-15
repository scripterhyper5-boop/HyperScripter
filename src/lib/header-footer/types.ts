export interface NavLink {
  label: string;
  url: string;
}

export interface HeaderSettings {
  logoText: string;
  navigation: NavLink[];
  ctaText: string;
  ctaUrl: string;
  showNavigation: boolean;
  showCta: boolean;
}

export interface SocialLinks {
  twitter: string;
  youtube: string;
  linkedin: string;
  facebook: string;
  instagram: string;
  discord: string;
}

export interface FooterSettings {
  companyName: string;
  copyright: string;
  description: string;
  quickLinks: NavLink[];
  privacyPolicyUrl: string;
  termsOfServiceUrl: string;
  socialLinks: SocialLinks;
  showDescription: boolean;
  showQuickLinks: boolean;
  showLegalLinks: boolean;
  showSocialLinks: boolean;
}

export interface HeaderFooterSettingsView {
  id?: string;
  header: HeaderSettings;
  footer: FooterSettings;
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_HEADER_SETTINGS: HeaderSettings = {
  logoText: "HyperScripter",
  navigation: [
    { label: "Features", url: "#features" },
    { label: "How It Works", url: "#how-it-works" },
    { label: "Use Cases", url: "#use-cases" },
    { label: "Pricing", url: "#pricing" },
    { label: "FAQ", url: "#faq" },
  ],
  ctaText: "Dashboard",
  ctaUrl: "/dashboard",
  showNavigation: true,
  showCta: true,
};

export const DEFAULT_FOOTER_SETTINGS: FooterSettings = {
  companyName: "HyperScripter",
  copyright: "© 2026 HyperScripter. All rights reserved.",
  description:
    "AI-powered TikTok script generator for creators who ship fast.",
  quickLinks: [
    { label: "Features", url: "/#features" },
    { label: "How it works", url: "/#how-it-works" },
    { label: "Pricing", url: "/#pricing" },
    { label: "Blog", url: "/blog" },
    { label: "FAQ", url: "/#faq" },
  ],
  privacyPolicyUrl: "/legal/privacy-policy",
  termsOfServiceUrl: "/legal/terms-of-service",
  socialLinks: {
    twitter: "https://twitter.com/hyperscripter",
    youtube: "",
    linkedin: "",
    facebook: "",
    instagram: "",
    discord: "",
  },
  showDescription: true,
  showQuickLinks: true,
  showLegalLinks: true,
  showSocialLinks: true,
};

export const DEFAULT_HEADER_FOOTER_SETTINGS: HeaderFooterSettingsView = {
  header: DEFAULT_HEADER_SETTINGS,
  footer: DEFAULT_FOOTER_SETTINGS,
};

export const HEADER_FOOTER_PREVIEW_KEY = "hf-preview-draft";
export const HEADER_FOOTER_PREVIEW_QUERY = "hf-preview";
