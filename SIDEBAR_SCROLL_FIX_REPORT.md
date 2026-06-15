# Sidebar Scroll Fix Report

**Date:** June 14, 2026  
**Issue:** Sidebar scrolled with page content instead of staying fixed

---

## Root Cause

Both dashboard and admin layouts used **`min-h-screen`** on the outer shell without **`overflow-hidden`**. When main content exceeded the viewport height, the **entire document scrolled** — including the sidebar.

The sidebar used **`position: sticky`** inside a growing flex container. Sticky only works relative to a scrolling ancestor; when the page body scrolls, the sidebar moves with it.

Additionally, scroll was applied at the wrong level (`overflow-auto` on main while the shell could still grow beyond `100vh`), causing a **single page scrollbar** that scrolled everything together.

---

## Fix Applied

### Pattern: Fixed sidebar + width spacer + isolated main scroll

```
┌─────────────────────────────────────────────┐
│  Shell: h-screen overflow-hidden (no scroll) │
│  ┌──────────┬──────────────────────────────┐│
│  │ Spacer   │  Main: flex-1 overflow-y-auto ││
│  │ (width)  │  (only this area scrolls)     ││
│  │          │                               ││
│  │ fixed    │                               ││
│  │ sidebar  │                               ││
│  │ overlay  │                               ││
│  └──────────┴──────────────────────────────┘│
└─────────────────────────────────────────────┘
```

1. **Shell** — `h-screen overflow-hidden` locks layout to viewport height
2. **Spacer div** — reserves horizontal space matching sidebar width (supports collapse animation on user dashboard)
3. **Sidebar** — `fixed left-0 top-0 h-screen` stays visible; internal nav uses `overflow-y-auto` for long menus
4. **Main** — `flex-1 overflow-y-auto min-w-0` is the only vertical scroll container

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/dashboard/layout.tsx` | Shell `h-screen overflow-hidden`; main `overflow-y-auto min-w-0` |
| `src/app/admin/(panel)/layout.tsx` | Same shell pattern; removed extra sidebar wrapper |
| `src/components/dashboard/sidebar.tsx` | Fixed sidebar + animated width spacer; mobile drawer `flex flex-col h-screen` |
| `src/components/admin/sidebar.tsx` | Fixed sidebar + 256px spacer; mobile drawer flex column |

---

## Layout Structure

### Before

```
dashboard-shell (flex min-h-screen)     ← grows with content, page scrolls
├── aside (sticky top-0 h-screen)       ← scrolls away with page
└── main (flex-1 overflow-auto)         ← also participates in page scroll
```

### After

```
dashboard-shell (flex h-screen overflow-hidden)   ← locked to viewport
├── spacer (animated width, lg only)              ← reserves sidebar space
├── aside (fixed left-0 top-0 h-screen, lg)       ← always visible
│   └── nav (flex-1 overflow-y-auto)              ← sidebar menu scrolls internally if needed
└── main (flex-1 overflow-y-auto min-w-0)         ← content scrolls here only
```

Admin panel follows the same pattern with a fixed `w-64` (256px) spacer.

---

## Responsive Behavior

| Breakpoint | Sidebar | Main content |
|------------|---------|--------------|
| **Desktop (lg+)** | Fixed left, full viewport height; collapse/expand animates spacer + fixed panel width | Scrolls independently; no horizontal overlap |
| **Mobile (< lg)** | Hidden by default; hamburger opens fixed overlay drawer | Full width; `pt-20` for menu button; body scroll in main only |
| **Long nav menus** | Internal `overflow-y-auto` on `<nav>` inside sidebar | Unaffected — sidebar nav scrolls inside fixed panel |

### Preserved functionality

- User dashboard sidebar collapse/expand (218px ↔ 68px) via animated spacer + fixed `motion.aside`
- Mobile drawer with backdrop (unchanged behavior)
- Admin nested nav items
- Support unread badges

### Double scrollbar prevention

- Shell: `overflow-hidden` — no shell-level scroll
- Main: single `overflow-y-auto`
- Sidebar: `overflow-hidden` on panel; only inner `<nav>` scrolls when menu exceeds viewport

---

## Verification Checklist

- [ ] User dashboard: scroll long page — sidebar stays fixed on left
- [ ] User dashboard: collapse/expand sidebar — main content reflows correctly
- [ ] User dashboard: mobile menu opens/closes without page scroll issues
- [ ] Admin panel: scroll long page — sidebar stays fixed
- [ ] Admin panel: many nav items — sidebar nav scrolls internally if needed
- [ ] No double scrollbars on desktop
- [ ] Hamburger button remains accessible on mobile while scrolling content

---

*End of report.*
