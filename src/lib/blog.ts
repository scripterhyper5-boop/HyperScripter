export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  readingTime: string;
  category: string;
  author: string;
  content: string;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** Deterministic date formatting to avoid SSR/client locale hydration mismatches. */
export function formatBlogDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "tiktok-hooks-that-stop-the-scroll",
    title: "7 TikTok Hooks That Stop the Scroll in 2025",
    description:
      "Learn the hook formulas top creators use to capture attention in the first second — and how to adapt them for any niche.",
    publishedAt: "2025-05-28",
    readingTime: "6 min read",
    category: "Growth",
    author: "HyperScripter Team",
    content: `The first second of your TikTok determines everything. If your hook doesn't land, the algorithm moves on — and so does your audience.

## The Pattern Interrupt

Start with something unexpected. "Stop doing X" or "Nobody talks about Y" creates immediate curiosity.

## The POV Format

POV hooks put viewers inside a scenario. They're relatable, shareable, and work across every niche.

## The Bold Claim

Make a statement that's defensible but surprising. Back it up in the next 5 seconds or lose trust.

Use HyperScripter to generate hooks tailored to your topic and tone in seconds.`,
  },
  {
    slug: "script-structure-for-viral-shorts",
    title: "The Script Structure Behind Every Viral Short",
    description:
      "Hook, tension, payoff, CTA — the four-part framework that turns ideas into retention machines.",
    publishedAt: "2025-05-15",
    readingTime: "8 min read",
    category: "Strategy",
    author: "HyperScripter Team",
    content: `Every viral short follows a predictable structure. Master it, and you stop guessing.

## 1. Hook (0–3 seconds)

One line. One promise. Zero filler.

## 2. Tension (3–15 seconds)

Build the problem or curiosity gap. This is where retention is won or lost.

## 3. Payoff (15–45 seconds)

Deliver the value. Be specific, be actionable.

## 4. CTA (final 3 seconds)

Tell them exactly what to do next — follow, save, comment.

HyperScripter generates all four parts automatically based on your inputs.`,
  },
  {
    slug: "hashtag-strategy-for-creators",
    title: "Hashtag Strategy That Actually Works in 2025",
    description:
      "Forget generic hashtag lists. Here's how to build a tagging strategy that complements your content, not clutters it.",
    publishedAt: "2025-05-02",
    readingTime: "5 min read",
    category: "Tips",
    author: "HyperScripter Team",
    content: `Hashtags aren't dead — bad hashtags are.

## Mix Three Tiers

Use a blend of broad (#fyp), niche (#yourtopic), and branded tags. HyperScripter generates this mix automatically.

## Match Intent

Your hashtags should describe what the video delivers, not just what's trending.

## Less Is More

5–8 targeted hashtags outperform 30 generic ones every time.`,
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getAllBlogSlugs(): string[] {
  return blogPosts.map((post) => post.slug);
}

/** Load published posts from Supabase with static fallback. */
export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
  try {
    const { listPublishedBlogPosts } = await import("@/lib/db/blog-posts");
    const { isSupabaseConfigured } = await import("@/lib/supabase");
    if (isSupabaseConfigured()) {
      const posts = await listPublishedBlogPosts();
      if (posts.length > 0) return posts;
    }
  } catch (error) {
    console.error("[blog] Supabase fetch failed:", error);
  }
  return blogPosts;
}

/** Load a single published post from Supabase with static fallback. */
export async function getPublishedBlogPost(slug: string): Promise<BlogPost | undefined> {
  try {
    const { getPublishedBlogPostBySlug } = await import("@/lib/db/blog-posts");
    const { isSupabaseConfigured } = await import("@/lib/supabase");
    if (isSupabaseConfigured()) {
      const post = await getPublishedBlogPostBySlug(slug);
      if (post) return post;
    }
  } catch (error) {
    console.error("[blog] Supabase fetch failed:", error);
  }
  return getBlogPost(slug);
}

export async function getAllPublishedBlogSlugs(): Promise<string[]> {
  const posts = await getPublishedBlogPosts();
  return posts.map((post) => post.slug);
}
