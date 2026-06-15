-- HyperScripter seed data (content only — users sync from Clerk on signup)
-- Run after schema.sql in Supabase SQL Editor

-- Blog posts
INSERT INTO blog_posts (title, slug, excerpt, content, status) VALUES
  (
    '7 TikTok Hooks That Stop the Scroll in 2025',
    'tiktok-hooks-that-stop-the-scroll',
    'Learn the hook formulas top creators use to capture attention in the first second.',
    'The first second of your TikTok determines everything. If your hook doesn''t land, the algorithm moves on — and so does your audience.

## The Pattern Interrupt

Start with something unexpected. "Stop doing X" or "Nobody talks about Y" creates immediate curiosity.',
    'published'
  ),
  (
    'The Script Structure Behind Every Viral Short',
    'script-structure-for-viral-shorts',
    'Hook, tension, payoff, CTA — the four-part framework that turns ideas into retention machines.',
    'Every viral short follows a predictable structure. Master it, and you stop guessing.

## 1. Hook (0–3 seconds)

One line. One promise. Zero filler.',
    'published'
  ),
  (
    'Hashtag Strategy That Actually Works in 2025',
    'hashtag-strategy-for-creators',
    'Forget generic hashtag lists. Build a tagging strategy that complements your content.',
    'Hashtags aren''t dead — bad hashtags are.

## Mix Three Tiers

Use a blend of broad, niche, and branded tags.',
    'published'
  )
ON CONFLICT (slug) DO NOTHING;

-- Legal pages
INSERT INTO legal_pages (title, slug, content, status) VALUES
  ('Privacy Policy', 'privacy-policy', '<h1>Privacy Policy</h1><p>HyperScripter respects your privacy.</p>', 'published'),
  ('Terms of Service', 'terms-of-service', '<h1>Terms of Service</h1><p>By using HyperScripter, you agree to these terms.</p>', 'published'),
  ('Cookie Policy', 'cookie-policy', '<h1>Cookie Policy</h1><p>We use cookies to improve your experience.</p>', 'published'),
  ('Refund Policy', 'refund-policy', '<h1>Refund Policy</h1><p>Refund eligibility and timelines.</p>', 'draft'),
  ('DMCA Policy', 'dmca-policy', '<h1>DMCA Policy</h1><p>Copyright infringement notices.</p>', 'draft'),
  ('Contact Us', 'contact-us', '<h1>Contact Us</h1><p>Reach our support team.</p>', 'published')
ON CONFLICT (slug) DO NOTHING;
