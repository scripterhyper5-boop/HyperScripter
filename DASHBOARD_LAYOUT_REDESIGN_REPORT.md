# Dashboard Layout Redesign Report

**Date:** June 14, 2026  
**Goal:** Modern SaaS layout (TubeScripter / Notion / Stripe / Linear feel) with sticky sidebar and full-width content

---

## Before vs After

| Aspect | Before (fixed + spacer) | After |
|--------|-------------------------|-------|
| Sidebar positioning | `fixed` + invisible width spacer | `sticky top-0` in normal flex flow |
| Visual gap | Large empty column from spacer hack | Content starts immediately beside sidebar |
| Content width | `max-w-5xl` centered (narrow column) | Full-width content area with consistent padding |
| Sidebar attachment | Floated over page, detached feel | Flex sibling — feels part of the layout |
| Scrolling | Main-only scroll (`h-screen overflow-hidden`) | Natural page scroll; sidebar stays via `sticky` |
| Sidebar shadow | Heavy `shadow-sm` on rail | Border-only rail (cleaner, attached) |
| Padding | Inconsistent `pt-20` on desktop | Mobile top padding for menu; normal padding on `lg+` |

---

## Root Cause of Poor UX

The scroll fix used **`position: fixed`** plus a **duplicate width spacer** in the document flow. That reserved sidebar width twice visually — creating dead whitespace and making the main content feel pushed away from navigation.

---

## Layout Structure

### After (User Dashboard + Admin)

```
┌─────────────────────────────────────────────────────────┐
│ flex min-h-screen                                       │
│ ┌──────────────┬────────────────────────────────────────┤
│ │ Sidebar      │ Main (flex-1, full width)              │
│ │ sticky       │                                          │
│ │ top-0        │  dashboard-page / admin-page             │
│ │ h-screen     │  (w-full padding, no max-width cap)      │
│ │ self-start   │                                          │
│ │ shrink-0     │                                          │
│ │              │  ← page scrolls naturally                │
│ │ nav overflow │                                          │
│ │ -y-auto      │                                          │
│ └──────────────┴────────────────────────────────────────┘
└─────────────────────────────────────────────────────────┘
```

### Key CSS pattern

```html
<div class="flex min-h-screen">
  <aside class="sticky top-0 h-screen shrink-0 self-start ..." />
  <main class="flex-1 min-w-0">
    <div class="dashboard-page">...</div>
  </main>
</div>
```

**Why `self-start`:** In a flex row, items stretch by default. `self-start` lets the sticky sidebar align to the top and stick correctly while the main column grows.

**Why no `overflow-hidden` on shell:** Allows natural document scroll with sticky sidebar — matches Notion/Linear behavior.

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/dashboard/layout.tsx` | `flex min-h-screen`; removed `max-w-5xl`; full-width `dashboard-page` |
| `src/app/admin/(panel)/layout.tsx` | Same flex pattern; full-width `admin-page` |
| `src/components/dashboard/sidebar.tsx` | Removed fixed + spacer; `sticky top-0 self-start` |
| `src/components/admin/sidebar.tsx` | Removed fixed + spacer; `sticky top-0 self-start` |
| `src/components/dashboard/sidebar-provider.tsx` | Auto-collapse on tablet (768–1023px) |
| `src/app/globals.css` | Added `.dashboard-page` and `.admin-page` padding utilities |

---

## Responsive Behavior

| Breakpoint | User Dashboard | Admin Panel |
|------------|----------------|-------------|
| **Mobile (< lg)** | Hamburger → slide-out drawer; full-width content; `pt-16` for menu button | Same drawer pattern |
| **Tablet (768–1023px)** | Sidebar auto-collapses to icon rail (68px); user can expand manually | Drawer only (< lg); full sidebar at `lg+` |
| **Desktop (lg+)** | Sticky sidebar (218px or 68px collapsed); content flush beside rail | Sticky 256px sidebar |

### Scroll behavior

- **Page scroll:** Single scrollbar on the document — no nested main scroll
- **Sidebar nav:** Internal `overflow-y-auto` when menu exceeds viewport height
- **No double scrollbars:** Main does not use `overflow-y-auto`
- **Sidebar visibility:** `sticky top-0 h-screen` keeps navigation accessible while scrolling

---

## UI Improvements

### Spacing & alignment

- **`.dashboard-page`:** `px-4 sm:px-6 lg:px-8`, `py-6 lg:py-8`, mobile `pt-16` for hamburger
- **`.admin-page`:** Slightly wider desktop padding (`lg:px-10`)
- Removed `max-w-5xl` constraint on user dashboard for fuller SaaS layout

### Visual style (preserved light theme)

- White sidebar rail with `border-r` only (no floating shadow)
- Gray-50 main background
- Existing `saas-card`, rounded corners, and purple accents unchanged

### Collapse preserved

- User dashboard collapse/expand animation retained on sidebar width
- Tablet auto-collapse for better use of horizontal space

---

## Verification Checklist

- [ ] Desktop: sidebar stays visible while scrolling long pages
- [ ] Desktop: no empty gap between sidebar and content
- [ ] Desktop: content uses full available width
- [ ] Mobile: drawer opens/closes correctly
- [ ] Tablet: dashboard sidebar auto-collapses
- [ ] Long sidebar menus scroll inside the rail only
- [ ] Single page scrollbar (no double scroll)

---

*End of report.*
