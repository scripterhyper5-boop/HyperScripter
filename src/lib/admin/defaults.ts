import type { AdminSettings } from "@/lib/admin/types";

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  general: {
    siteName: "HyperScripter",
    logo: "",
    domain: "",
  },
  seo: {
    defaultTitle: "HyperScripter — AI TikTok Script Generator",
    defaultDescription: "Generate viral TikTok scripts in seconds.",
    ogImage: "/og-image.png",
  },
  ai: {
    openaiApiKey: "",
    defaultModel: "gpt-4o",
  },
  appearance: {
    theme: "dark",
    brandColors: "Violet #8B5CF6 · Cyan #06B6D4",
  },
};
