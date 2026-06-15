export const siteConfig = {
  name: "HyperScripter",
  tagline: "AI TikTok Script Generator",
  description:
    "Generate viral TikTok scripts in seconds. HyperScripter crafts hooks, full scripts, CTAs, captions, and hashtags tailored to your topic, tone, and audience.",
  url: "https://hyperscripter.com",
  ogImage: "/og-image.png",
  links: {
    twitter: "https://twitter.com/hyperscripter",
    github: "https://github.com/hyperscripter",
  },
  creator: "HyperScripter",
} as const;

export type SiteConfig = typeof siteConfig;
