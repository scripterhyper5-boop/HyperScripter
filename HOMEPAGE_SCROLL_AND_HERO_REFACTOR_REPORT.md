# Homepage Scroll & Hero Refactor Report

**Date:** June 13, 2026  
**Scope:** Fix double vertical scrollbar on landing page; split hero from product preview; simplify homepage section order

---

## Executive Summary

The homepage had a **nested scroll container** caused by the hero section’s `overflow-x-hidden` combined with `min-h-[85vh]` and an embedded product mockup. That forced the hero into its own scrollable region alongside the browser scrollbar.

The fix removes all scroll-creating wrappers from the landing page, confines document scrolling to `html`, strips the hero down to conversion copy only, and moves the browser mockup into a dedicated **Generated Script Preview** section directly below the hero.

---

## 1. Root Cause of Double Scrollbar

### Primary cause

The hero section used:

```tsx
className="relative flex min-h-[85vh] flex-col overflow-x-hidden ..."
```

**CSS behavior:** When `overflow-x` is set to `hidden` (or any value other than `visible`) on an element, and `overflow-y` is `visible`, the browser computes `overflow-y` as **`auto`**. That turns the hero `<section>` into a **nested scroll container** whenever its content exceeded the viewport — which happened because:

1. `min-h-[85vh]` forced a tall hero region
2. The embedded `DashboardMockup` added 420–520px+ of content
3. Negative overlap margins (`-mb-16` to `-mb-28`) pushed layout boundaries further

Result: **two vertical scrollbars** — one on `<html>`/viewport and one on the hero section.

### Contributing factors

| Factor | Effect |
|--------|--------|
| `flex flex-1` on hero inner container | Expanded hero to fill min-height, increasing overflow risk |
| `overflow-hidden` on mockup inner body | Clipped mockup content (cosmetic only; not the page scrollbar) |
| Hero `overflow-x-hidden` | Intended to clip parallax blobs; inadvertently created Y-axis scroll |

### Not the cause

- `overflow-hidden` on rounded cards (Features, CTA, etc.) — clips decoration only
- `StaggeredHeadline` `overflow-hidden` on line spans — text animation clip only
- Dashboard/admin `h-screen` sidebars — not used on homepage

---

## 2. Fixes Applied

### Scroll architecture

| Layer | Before | After |
|-------|--------|-------|
| `html` | `scroll-smooth` only | `overflow-x: clip; overflow-y: auto` — **single document scroll** |
| `body` | Default | `overflow-x: clip; overflow-y: visible` — no nested scroll |
| Hero `<section>` | `overflow-x-hidden min-h-[85vh]` | No overflow, no min-height — natural content height |
| Mockup | Fixed heights + `overflow-hidden` inner scroll area | Natural height, no inner scroll — content flows with page |

### Hero content (Section 1)

Hero now contains **only**:

- Badge: "Now in public beta"
- Headline: Ship viral TikTok / scripts 10× faster
- Description paragraph
- CTAs: Start for free · See it in action
- Footer line: No credit card required · Free plan available

**Removed from hero:** `DashboardMockup`, overlap margins, `min-h-[85vh]`, `overflow-x-hidden`, `flex-1` layout.

### Generated Script Preview (Section 2)

New file: `src/components/sections/generated-script-preview.tsx`

- `id="generated-script-preview"` (anchor for CTA + navbar)
- Title: **Generated Script Preview**
- Subtitle: See how HyperScripter generates hooks, scripts, CTAs, and content structure in seconds.
- Full-width centered `DashboardMockup` (max 1100px)

### Homepage section order

| # | Section | Component |
|---|---------|-----------|
| — | Navbar | `Navbar` |
| 1 | Hero (copy only) | `Hero` |
| 2 | Generated Script Preview | `GeneratedScriptPreview` |
| 3 | Features | `Features` |
| 4 | How it works | `HowItWorks` |
| 5 | Pricing | `Pricing` |
| 6 | FAQ | `FAQ` |
| — | Footer | `Footer` |

**Removed from homepage flow:** `WhyHyperScripter`, `ProductPreview` (tabbed demo), `UseCases`, `CTA` — components remain in codebase for reuse but are no longer on `/`.

### Navbar

- Added **Preview** → `#generated-script-preview`
- Removed **Use cases** (section no longer on homepage)

---

## 3. Before / After Layout Structure

### Before

```
Navbar (fixed)
└── main
    └── Hero [overflow-x-hidden, min-h-85vh, SCROLLABLE]
        ├── Badge + Headline + Description + CTAs
        └── DashboardMockup (hero variant, clipped heights)
    ├── WhyHyperScripter
    ├── ProductPreview (tabbed card, id=product-preview)
    ├── Features
    ├── HowItWorks
    ├── UseCases
    ├── Pricing
    ├── FAQ
    └── CTA
Footer
```

### After

```
html [overflow-y: auto]  ← ONLY scrollbar
└── body [overflow-y: visible]
    ├── Navbar (fixed)
    └── main
        ├── Hero [natural height, no overflow]
        │   └── Badge + Headline + Description + CTAs only
        ├── GeneratedScriptPreview
        │   └── Title + Subtitle + DashboardMockup (full size)
        ├── Features
        ├── HowItWorks
        ├── Pricing
        └── FAQ
    Footer
```

---

## 4. Files Changed

| File | Change |
|------|--------|
| `src/components/sections/hero.tsx` | Removed mockup; removed `min-h-[85vh]`, `overflow-x-hidden`, flex stretch; compact padding |
| `src/components/sections/generated-script-preview.tsx` | **New** — dedicated preview section |
| `src/components/marketing/dashboard-mockup.tsx` | Removed `hero` variant; removed fixed heights & inner `overflow-hidden`; natural document flow |
| `src/app/page.tsx` | New section order; removed WhyHyperScripter, ProductPreview, UseCases, CTA |
| `src/app/globals.css` | `html`/`body` overflow rules for single scroll |
| `src/components/sections/navbar.tsx` | Preview link; removed Use cases |

### Unchanged (audited, no homepage scroll impact)

- `src/app/layout.tsx` — `min-h-screen` on body is fine (does not create scroll container)
- Dashboard/admin layouts — `h-screen` sidebars scoped to app routes only
- `product-preview.tsx`, `why-hyperscripter.tsx`, etc. — retained but not mounted on homepage

---

## 5. Spacing Summary

| Area | Before | After |
|------|--------|-------|
| Hero top | `pt-16` + `min-h-[85vh]` | `pt-20 sm:pt-24 lg:pt-28` (navbar clearance) |
| Hero bottom | `pb-0` + negative mockup overlap | `pb-14 sm:pb-16 lg:pb-20` |
| CTA → Preview gap | 24–32px + mockup in hero | Hero ends; preview section starts with `py-16`–`py-24` |
| Preview section | N/A in hero | Large centered mockup, `mt-10`–`mt-14` below heading |

---

## 6. Verification: Single Scrollbar

### Manual checklist

1. Open `/` at 100% zoom (1440×900 and 1920×1080)
2. Inspect hero `<section>` in DevTools → **Computed → overflow-y** should be `visible` (not `auto`)
3. Scroll the page — only the **browser/viewport** scrollbar moves
4. No inner scrollbar appears inside hero, main, or mockup
5. Hero shows copy only; preview appears in section 2 after scrolling slightly

### DevTools command

In browser console on homepage:

```js
[...document.querySelectorAll('*')].filter(el => {
  const s = getComputedStyle(el);
  return (s.overflowY === 'auto' || s.overflowY === 'scroll') && el.scrollHeight > el.clientHeight;
}).map(el => ({ tag: el.tagName, class: el.className, id: el.id }));
```

**Expected result:** Empty array `[]` or only `HTML` if the document itself scrolls (which is correct — one scrollbar).

### What was removed to pass verification

- `overflow-x-hidden` on hero
- `min-h-[85vh]` on hero
- `variant="hero"` viewport-capped mockup heights
- `overflow-hidden` + `min-h-0 flex-1` scroll trap inside mockup body

---

## 7. Responsive Notes

- Hero stays compact on all breakpoints — no forced viewport height
- Preview section uses full container width with `max-w-[1100px]` centered mockup
- `scroll-mt-20` on preview section offsets fixed navbar when using anchor links
- Horizontal bleed from hero parallax blobs clipped at `html { overflow-x: clip }` instead of hero overflow

---

## 8. Optional Follow-ups

1. Reintroduce `WhyHyperScripter` or `UseCases` below Features if needed — ensure no `overflow-x-hidden` + tall `min-h` combos
2. Delete or repurpose unused `product-preview.tsx` if tabbed demo is permanently retired
3. Add E2E test asserting zero nested `overflow-y: auto` scrollers on `/`
