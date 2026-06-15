# Hero Preview Redesign Report

**Date:** June 15, 2026  
**Goal:** Replace generic floating dashboard card with a realistic, large script-generation app preview

---

## Before vs After

| Aspect | Before | After |
|--------|--------|-------|
| **Size** | `max-w-lg` (~512px), small card | Up to **1100px** wide, **420–620px** tall |
| **Layout** | Side-by-side with headline (cramped) | Centered below hero copy — **dominates section** |
| **Chrome** | Gray dots, URL bar, mini sidebar skeleton | Mac traffic lights + **"Generated Script Preview"** title |
| **Content** | Generic hook + short script + hashtags | **HOOK**, **INTRO**, **B-ROLL NOTE** sections + metadata footer |
| **Decorations** | Floating pills (+340% retention, 2.1s, hashtags) | **Removed** — realistic app only |
| **Effects** | 3D tilt, glow blobs, floating animation | Fade-up on load, subtle hover lift |
| **Feel** | Marketing sticker collage | Professional SaaS application window |

---

## Component Structure

```
DashboardMockup
└── motion wrapper (fade-up + hover lift)
    └── Browser window (rounded-[20px], white, border, shadow)
        ├── Title bar (#fafafa)
        │   ├── ● red  ● yellow  ● green
        │   └── "Generated Script Preview"
        ├── Scrollable script body
        │   ├── 🎣 HOOK section
        │   ├── 🚀 INTRO section
        │   └── 🎬 B-ROLL NOTE section
        └── Metadata footer
            ├── Tutorial • 5 min • Professional Tone
            └── Full script: 847 words
```

---

## Design Tokens

| Property | Value |
|----------|-------|
| Background | `#ffffff` |
| Section background | `#fafafa` |
| Border | `#e5e7eb` |
| Radius | `20px` |
| Shadow | `0 20px 50px -12px rgba(0,0,0,0.12)` |
| Traffic lights | `#ff5f57`, `#febc2e`, `#28c840` |
| Typography | `text-sm` / `text-[15px]`, `leading-relaxed` / `leading-7` |

---

## Script Content

### Section 1 — HOOK
> What if I told you that 90% of creators lose views because of one simple mistake?

### Section 2 — INTRO
> Today we're breaking down the exact framework top creators use to hook viewers in the first 3 seconds — and keep them watching until the end.

### Section 3 — B-ROLL NOTE
> Show: analytics dashboard, creator editing footage, before/after engagement metrics overlay.

### Footer metadata
- Tutorial • 5 min • Professional Tone
- Full script: 847 words

---

## Animation

| Effect | Implementation |
|--------|----------------|
| **Load** | Container fades up (`opacity 0→1`, `y 48→0`, 0.75s) |
| **Sections** | Staggered fade-up (0.1s delay each) |
| **Hover** | Subtle lift (`y: -6`) on entire window |
| **Reduced motion** | All motion disabled when `prefers-reduced-motion` |

---

## Removed Elements

- Floating chip: "Generated in 2.1s"
- Floating chip: "+340% retention"
- Floating chip: "Smart hashtags included"
- Animated gradient glow backgrounds
- 3D perspective tilt on mouse move
- Floating Y-axis bob animation
- Mini sidebar skeleton
- Hashtag pills inside preview
- `glow-violet` class

---

## Hero Layout Change

**Before:** `lg:grid-cols-2` — copy left, small mockup right

**After:** Stacked centered layout
1. Headline + CTA (centered, `max-w-4xl`)
2. Full-width mockup below (`mt-12 lg:mt-16`)

This gives the preview room to scale to 900–1100px without competing with copy.

---

## Responsive Behavior

| Breakpoint | Width | Height |
|------------|-------|--------|
| Mobile | `100%` (with page padding) | `420px` |
| `sm` | `100%`, max `1100px` | `500px` |
| `md` | centered, max `1100px` | `560px` |
| `lg` | centered, max `1100px` | `620px` |

- `min-w-0` + `overflow-x-hidden` on script body prevents horizontal overflow
- Internal `overflow-y-auto` on content area if sections exceed height
- Title truncates on very narrow screens
- Browser chrome and traffic lights scale proportionally

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/marketing/dashboard-mockup.tsx` | Complete rewrite — browser window script preview |
| `src/components/sections/hero.tsx` | Stacked layout; mockup centered below copy |

---

## Verification Checklist

- [ ] Desktop: preview ~900–1100px wide, dominates hero
- [ ] Mac traffic lights visible (red, yellow, green)
- [ ] Title reads "Generated Script Preview"
- [ ] Three script sections with emoji labels
- [ ] Footer metadata visible
- [ ] No floating badges/pills
- [ ] Fade-up animation on page load
- [ ] Subtle hover lift on desktop
- [ ] Mobile: no horizontal overflow, window scales down

---

*End of report.*
