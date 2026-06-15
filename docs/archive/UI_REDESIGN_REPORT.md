# HyperScripter UI Redesign Report

**Date:** June 13, 2026  
**Scope:** UI/UX only — no API, route, or database changes  
**Goal:** Replace the dark-heavy dashboard with a clean, bright, professional SaaS interface inspired by TubeScripter, Stripe, Notion, Vercel, and Linear — while keeping the purple brand identity.

---

## Before vs After Summary

| Area | Before | After |
|------|--------|-------|
| **Theme mode** | Forced `dark` on `<html>`, near-black OKLCH tokens | Light-first semantic tokens on `:root` |
| **Dashboard shell** | `#050505` background, violet radial glow overlay | `#F9FAFB` (gray-50) with white sidebar |
| **Sidebar** | Glass/black, white-alpha borders, gradient active indicator | White bg, `border-border`, purple active state |
| **Cards** | `#0b0b0b` dashboard-card, glassmorphism | White cards, 16px radius, soft border + shadow |
| **KPI stats** | Small text, glass cards | 3xl numbers, colored icon containers |
| **Tables** | `border-white/5`, subtle dark hover | White bg, sticky gray-50 headers, row hover |
| **Forms/inputs** | Semi-transparent dark inputs | White inputs, gray borders, purple focus ring |
| **Buttons** | White-on-black glow, heavy violet shadows | Purple primary, white secondary with border |
| **Charts** | Dark grid lines, dark tooltips | Light grid `#E5E7EB`, white tooltips |
| **Toasts** | Dark `#0B0B0B` theme | Light white toasts with soft shadow |

---

## Theme System

### Foundation

| File | Change |
|------|--------|
| `src/app/globals.css` | Complete light token palette; new SaaS utility classes |
| `src/app/layout.tsx` | Removed forced `className="dark"` from `<html>` |
| `components.json` | Unchanged (shadcn still uses CSS variables) |

### CSS Variables (`:root`)

```css
--background: #ffffff;
--foreground: #111827;      /* gray-900 */
--card: #ffffff;
--muted: #f8fafc;           /* section gray */
--muted-foreground: #6b7280;/* gray-500 */
--primary: #8b5cf6;         /* purple */
--secondary: #f9fafb;       /* gray-50 */
--border: #e5e7eb;
--ring: #8b5cf6;
--destructive: #ef4444;
--violet: #8b5cf6;
--indigo: #6366f1;
--success: #10b981;
--radius: 1rem;             /* 16px cards */
```

### New Utility Classes

| Class | Purpose |
|-------|---------|
| `.saas-card` | White card, 16px radius, border, soft shadow |
| `.saas-card-hover` | Card with hover border/shadow transition |
| `.saas-section` | Muted gray section container |
| `.kpi-icon-violet` | Purple icon container for KPI cards |
| `.kpi-icon-indigo` | Indigo icon container |
| `.kpi-icon-success` | Green icon container |
| `.dashboard-shell` | Gray-50 app background |
| `.dashboard-sidebar` | White sidebar background |
| `.dashboard-main` | Gray-50 content area |
| `.dashboard-card` | Alias → white SaaS card style |

### Removed / Replaced Patterns

- Glassmorphism (`.glass`, `.glass-strong` with backdrop-blur)
- Heavy glow utilities (`.glow-violet`, `.glow-cyan`)
- Hardcoded hex backgrounds (`#050505`, `#080808`, `#0b0b0b`)
- White-alpha borders (`border-white/10`, `bg-white/5`)
- Dark semi-transparent overlays on inputs (`bg-black/20`)

---

## Color Palette

| Role | Hex | Usage |
|------|-----|-------|
| **Primary** | `#8B5CF6` | Buttons, active nav, links, focus ring |
| **Secondary** | `#6366F1` | Accent charts, secondary KPI icons |
| **Background** | `#FFFFFF` | Cards, inputs, sidebar |
| **Section bg** | `#F9FAFB` / `#F8FAFC` | Page shell, muted sections |
| **Border** | `#E5E7EB` | Cards, tables, dividers |
| **Text primary** | `#111827` | Headings, values |
| **Text secondary** | `#374151` | Body copy |
| **Text muted** | `#6B7280` | Labels, descriptions |
| **Success** | `#10B981` | Status badges, success states |
| **Danger** | `#EF4444` | Destructive buttons, errors |

---

## Components Updated

### UI Primitives (`src/components/ui/`)

| Component | Updates |
|-----------|---------|
| `button.tsx` | Purple primary; white secondary/outline; added `destructive`; simplified `violet-glow` |
| `card.tsx` | `rounded-2xl` (16px) |
| `input.tsx` | White bg, purple focus ring with offset |
| `textarea.tsx` | Same as input |
| `select.tsx` | White trigger background |
| `table.tsx` | White container, sticky gray-50 header, row hover |
| `badge.tsx` | Light muted variant |
| `data-state.tsx` | White loading/empty; light red error |
| `dropdown-menu.tsx` | White popover, gray focus |
| `sonner.tsx` | `theme="light"`, white toast |
| `skeleton.tsx` | Gray-200 pulse on light bg |

### Layout & Navigation

| Component | Updates |
|-----------|---------|
| `dashboard/sidebar.tsx` | White sidebar, purple active items, user card footer |
| `admin/sidebar.tsx` | Matching light admin nav with nested items |
| `dashboard/layout.tsx` | Removed dark gradient overlay; increased padding |
| `admin/(panel)/layout.tsx` | `bg-gray-50` shell |
| `(auth)/layout.tsx` | Light gray bg, subtle grid |
| `admin/login/layout.tsx` | Light admin login shell |

### Shared Dashboard/Admin

| Component | Updates |
|-----------|---------|
| `admin/stat-card.tsx` | Modern KPI layout, 3xl values, icon containers |
| `dashboard/dashboard-stats.tsx` | Matching KPI cards |
| `admin/page-header.tsx` | Unchanged (already token-based) |
| `admin/loading-skeleton.tsx` | Light card skeletons |
| `admin/empty-state.tsx` | Dashed border, violet icon |
| `admin/charts.tsx` | Light grid, white tooltips, brand colors |
| `dashboard/script-section-card.tsx` | SaaS card styling |
| `dashboard/dashboard-overview.tsx` | Light quick-start section |

### Auth Forms

| Component | Updates |
|-----------|---------|
| `login-form.tsx` | SaaS card wrapper |
| `signup-form.tsx` | SaaS card wrapper |
| `forgot-password-form.tsx` | SaaS card wrapper |
| `reset-password-form.tsx` | SaaS card wrapper |
| `admin-login-form.tsx` | SaaS card wrapper |
| `auth-form-skeleton.tsx` | Light skeleton |

---

## Pages Redesigned

### User Dashboard

| Route | Key view files |
|-------|----------------|
| `/dashboard` | `dashboard-overview.tsx`, `dashboard-stats.tsx` |
| `/dashboard/generate` | `script-generator-form.tsx` |
| `/dashboard/scripts` | `script-history.tsx`, `scripts/page.tsx` |
| `/dashboard/scripts/[id]` | `script-detail-view.tsx` |
| `/dashboard/saved` | `saved/page.tsx` |
| `/dashboard/billing` | `billing/page.tsx` |
| `/dashboard/referrals` | `referrals-view.tsx` |
| `/dashboard/support` | `support-view.tsx`, `support-conversation.tsx` |
| `/dashboard/settings` | `profile-settings-form.tsx`, `change-password-form.tsx` |
| `/dashboard/help` | `help/page.tsx` |
| `/dashboard/team/*` | `team-*-view.tsx` files |

### Admin Dashboard

| Route | Key files |
|-------|-----------|
| `/admin` | `(panel)/page.tsx` |
| `/admin/users` | `users/page.tsx`, user modals |
| `/admin/support` | `support/page.tsx` |
| `/admin/scripts` | `scripts/page.tsx` |
| `/admin/blog` | `blog/page.tsx`, `blog-markdown-editor.tsx` |
| `/admin/analytics` | `analytics/page.tsx`, `charts.tsx` |
| `/admin/pricing` | `pricing/page.tsx` |
| `/admin/growth/referrals` | `growth/referrals/page.tsx` |
| `/admin/platform/*` | site-settings, email-settings pages |
| `/admin/settings/ai` | `settings/ai/page.tsx` |
| `/admin/legal` | `legal/page.tsx`, `legal-tiptap-editor.tsx` |

### Marketing (inherits light tokens)

| Section | File |
|---------|------|
| Navbar | `sections/navbar.tsx` — white scrolled state |
| Hero | `sections/hero.tsx`, `hero-background.tsx` — subtle purple blobs |
| Features, Pricing, CTA, Footer | All section components updated |
| Dashboard mockup | `marketing/dashboard-mockup.tsx` — light preview |

---

## Layout Improvements

1. **Sidebar**
   - Fixed white background with `border-r border-border`
   - Purple (`bg-violet/10 text-violet`) active menu state
   - Section labels in uppercase gray-400
   - User profile card at bottom with gray-50 background
   - Mobile drawer with light overlay (`bg-gray-900/20`)

2. **Content area**
   - Gray-50 page background for depth vs white cards
   - Increased vertical padding (`lg:py-10`)
   - Max-width containers preserved (`max-w-5xl` user, `max-w-7xl` admin)

3. **Cards**
   - Consistent 16px border radius
   - `border-border` + `shadow-sm`
   - Hover states via `saas-card-hover`

4. **Page headers**
   - Bold gray-900 titles
   - Muted gray-500 descriptions
   - Action buttons aligned right on desktop

---

## Responsive Improvements

| Breakpoint | Behavior |
|------------|----------|
| **Mobile** | Hamburger menu, full-width cards, stacked KPI grid |
| **sm (640px+)** | 2-column KPI grid |
| **lg (1024px+)** | Persistent sidebar, reduced top padding (no hamburger offset) |
| **xl (1280px+)** | 3-column KPI grid on dashboard |

- Tables scroll horizontally inside rounded white containers
- Chart cards stack vertically on mobile, 2-column on `lg`
- Form fields full-width on mobile with consistent 44px touch height (`h-11`)

---

## Charts

| Chart | Style |
|-------|-------|
| User Growth | Purple area (`#8B5CF6`), light grid |
| Script Trend | Indigo bars (`#6366F1`) |
| Subscriptions | Purple / indigo / green pie segments |
| Tooltips | White card, gray label, bold value |

---

## What Was NOT Changed

- All API routes and server logic
- Database schemas and queries
- Route structure and navigation paths
- Authentication flows
- Stripe/billing integration
- Referral commission logic
- Feature flags and plan gating

---

## Verification

- `npx tsc --noEmit` — passes with no TypeScript errors
- All existing routes and functionality preserved
- Semantic tokens ensure future theme tweaks via `globals.css` only

---

## Recommended Follow-ups (Optional)

1. Add a theme toggle (light/dark) if dark mode is desired later — `@custom-variant dark` is already wired
2. Screenshot comparison for marketing page hero on mobile
3. Admin referrals table — add commission column to match user dashboard (backend already supports it)

---

*Report generated as part of the HyperScripter UI redesign — June 2026.*
