# Hero Layout Optimization Report

**Date:** June 13, 2026  
**Scope:** Homepage hero section — above-the-fold density, typography dominance, and product preview placement  
**Reference style:** TubeScripter, Jasper, Copy.ai, Notion AI, Framer

---

## Executive Summary

The hero was redesigned from a tall, loosely spaced block into a **conversion-focused, above-the-fold layout** that fits navbar + copy + CTA + product preview top within ~85vh. Headline typography was scaled to SaaS-standard dominance (72–96px desktop), vertical gaps were tightened, and the browser mockup now sits directly under CTAs with negative margin overlap into the next section.

---

## 1. Hero Section Dimensions

| Property | Before | After |
|----------|--------|-------|
| Section height | Implicit ~120vh+ (large `py-16`–`py-24` + tall preview gap) | `min-h-[85vh]` flex column |
| Top padding | `py-16 sm:py-20 lg:py-24` (64–96px both sides) | `pt-16 sm:pt-[4.5rem]` only (navbar clearance) |
| Bottom padding | 64–96px | `pb-0` (preview bleeds into next section) |
| Copy container max-width | `max-w-4xl` (896px) | `max-w-[900px]` |
| Preview top margin | `mt-12 sm:mt-14 lg:mt-16` (48–64px) | `mt-6 sm:mt-8` (24–32px) |
| Preview bottom overlap | None | `-mb-16 sm:-mb-20 lg:-mb-28` |
| Layout model | Stacked block with loose spacing | `flex flex-col` + `flex-1` container for vertical distribution |

---

## 2. Spacing Changes

| Element | Before | After | Delta |
|---------|--------|-------|-------|
| Badge → Headline | `mb-4` on badge (16px) | `mb-3 sm:mb-4` (12–16px) | Tighter on mobile |
| Headline → Subheadline | `mt-5` (20px) | `mt-4 sm:mt-5` (16–20px) | Slightly tighter |
| Subheadline → CTA | `mt-8` (32px) | `mt-6 sm:mt-8` (24–32px) | Within 24–32px target |
| CTA → Preview | `mt-12`–`mt-16` (48–64px) | `mt-6 sm:mt-8` (24–32px) | **−24px to −48px** |
| Section vertical padding | 128–192px total (top + bottom) | ~64–72px top only | **~60–120px saved** |
| CTA microcopy | `mt-3` | `mt-3` | Unchanged |

---

## 3. Typography Changes

### Headline (`StaggeredHeadline`)

| Breakpoint | Before | After |
|------------|--------|-------|
| Mobile | `text-4xl` (36px), `font-bold` (700) | `text-4xl` (36px), `font-extrabold` (800) |
| `sm` | `text-5xl` (48px) | `text-5xl` (48px) |
| `lg` | `text-5xl` (48px) | `text-7xl` (72px) |
| `xl` | `text-6xl` (60px) | `text-8xl` (96px) |
| Max width | None (inherited from parent) | `max-w-[900px] mx-auto` |
| Line height | `leading-[1.1]` | `leading-[1.05]` / `xl:leading-[1.02]` |
| Font weight | 700 | **800** |

Desktop headline now hits the **72px–96px** target range and visually dominates the page.

### Subheadline

| Property | Before | After |
|----------|--------|-------|
| Max width | `max-w-2xl` (672px) | `max-w-[700px]` |
| Font size | `text-base sm:text-lg` (16–18px) | `text-lg sm:text-xl lg:text-[22px]` (18–22px) |
| Line height | `leading-relaxed` | `leading-relaxed` / `lg:leading-[1.55]` |
| Alignment | Center | Center |

---

## 4. CTA Section

| Property | Before | After |
|----------|--------|-------|
| Gap from subheadline | 32px (`mt-8`) | 24–32px (`mt-6 sm:mt-8`) |
| Button layout | Motion stagger wrapper | Direct flex row, `gap-3 sm:gap-4` |
| Button size | `size="lg"` default | Explicit `h-12 px-8 text-base` |
| Animation | `whileInView` scroll-triggered | `animate` on load (faster above-fold reveal) |

---

## 5. Product Preview

### Placement

| Property | Before | After |
|----------|--------|-------|
| Position in layout | Separate block 48–64px below CTA | **24–32px below CTA** |
| Overlap | None | Negative margin bleeds into Why HyperScripter section |
| Z-index | Default | `z-10` (floats above next section background) |
| Large-screen nudge | None | `lg:translate-y-2` |

### Mockup sizing (`DashboardMockup`)

New `variant="hero"` prop for above-the-fold context:

| Variant | Height |
|---------|--------|
| **Before (default only)** | `420px` → `620px` (sm → lg) |
| **After — hero** | `min(420px, 42vh)` → `min(520px, 46vh)` |
| **After — default** | Unchanged for other sections |

Hero variant uses **viewport-relative caps** so the browser chrome + HOOK section remain visible within 85vh on typical laptop screens, while still showing a large, credible product window.

### Animation

| Property | Before | After (hero) |
|----------|--------|--------------|
| Entry Y offset | `y: 48` | `y: 32` |
| Duration | 0.75s | 0.65s |
| Hover lift | `-6px` | `-4px` |

---

## 6. Above-the-Fold Visibility

Target stack (all visible without scrolling on 1080p):

```
┌─────────────────────────────────────┐
│ Navbar (fixed, h-16)                │
├─────────────────────────────────────┤
│ Badge                               │
│ HEADLINE (72–96px, weight 800)      │
│ Subheadline (22px, max 700px)       │
│ [Start for free] [See it in action] │
│ No credit card required…            │
├─────────────────────────────────────┤
│ ┌─ Generated Script Preview ─────┐  │
│ │ 🎣 HOOK                        │  │  ← top of mockup visible
│ │ …                              │  │
│ └────────────────────────────────┘  │
└─────────────────────────────────────┘  ← ~85vh
         │ mockup overlaps ↓
```

---

## 7. Screenshot / Preview Improvements

| Issue | Fix |
|-------|-----|
| Huge empty gap before preview | Reduced CTA → preview gap from 48–64px to 24–32px |
| Preview felt disconnected | Preview starts immediately under CTAs; overlaps next section |
| Headline felt small vs. whitespace | Scaled to 72–96px desktop with weight 800 |
| Hero felt taller than content | `min-h-[85vh]` replaces excessive vertical padding |
| Product not visible on landing | Hero mockup variant capped to ~42–46vh so HOOK is above fold |
| Weak visual hierarchy | Larger headline + tighter copy block + prominent browser chrome |

---

## 8. Files Modified

| File | Changes |
|------|---------|
| `src/components/sections/hero.tsx` | `min-h-[85vh]`, reduced padding/gaps, overlap margin, hero mockup variant |
| `src/components/marketing/staggered-headline.tsx` | 72–96px scale, `font-extrabold`, `max-w-[900px]` |
| `src/components/marketing/dashboard-mockup.tsx` | `variant="hero"` with viewport-capped heights |

---

## 9. Responsive Notes

- **Mobile:** Headline stays readable at 36px; preview uses `min(420px, 42vh)` to avoid pushing copy off-screen.
- **Tablet:** Progressive scale through `md:text-6xl`.
- **Desktop (lg+):** Full 72px headline, 22px subheadline, centered layout.
- **Large screens (xl):** 96px headline; `max-w-[900px]` / `max-w-[1100px]` prevent runaway line lengths and empty side gutters.

---

## 10. Verification Checklist

- [ ] Navbar + badge + headline + subheadline + CTAs visible at 100% zoom on 1440×900
- [ ] Browser chrome + HOOK section visible without scrolling
- [ ] Headline reads as the dominant element
- [ ] No excessive whitespace between CTA and preview
- [ ] Mockup overlaps cleanly into Why HyperScripter section
- [ ] Mobile (375px): copy remains readable; preview still hints at product

---

## 11. Optional Follow-ups

1. Add `scroll-mt-24` to `#product-preview` if anchor scroll feels tight under fixed navbar.
2. A/B test `min-h-[80vh]` vs `85vh` on ultrawide monitors.
3. Consider `prefers-reduced-motion` static layout audit for hero animate vs whileInView consistency.
