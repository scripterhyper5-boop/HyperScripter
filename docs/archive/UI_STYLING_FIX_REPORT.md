# UI Styling Fix Report

**Date:** June 14, 2026  
**Severity:** Urgent regression  
**Status:** Fixed and verified

---

## Problem Summary

After the UI redesign, the application appeared to render as mostly unstyled HTML:

- Default browser font (Times/serif)
- Blue underlined links
- Broken spacing and layout
- Sidebar collapsed to unstyled list
- Tailwind utility classes seemingly ignored

---

## Root Cause

**Primary cause: corrupted `.next` cache causing the CSS bundle to return 404.**

The HTML page loads and React renders (you see "HyperScripter", nav links, hamburger menu), but the stylesheet URL in the page returns **404 Not Found**:

```
<link rel="stylesheet" href="/_next/static/css/app/layout.css?v=..." />
→ GET /_next/static/css/app/layout.css → 404
```

Without CSS, the browser shows exactly what you saw: default serif font, blue underlined links, no spacing, broken sidebar.

### Why `.next` gets corrupted

1. **Multiple `npm run dev` processes** sharing one `.next` folder (e.g. port 3000 + 3002)
2. **Running `npm run build` while dev is active** — mixes production chunks with dev assets (`Cannot find module './1331.js'`)
3. **Deleting `.next` while dev is still running**

Server log symptoms:

```
⚠ Port 3000 is in use, using port 3002 instead.
⨯ ENOENT: routes-manifest.json
⨯ Cannot find module './1331.js'
GET /_next/static/css/app/layout.css → 404
```

### Secondary hardening (preventive)

Tailwind CSS v4 scans source files relative to the CSS entry point. Because `globals.css` lives in `src/app/`, sibling directories like `src/components/` should be explicitly registered with `@source` to guarantee all utility classes are generated in every environment.

---

## Audit Checklist Results

| Check | Result |
|-------|--------|
| 1. `layout.tsx` imports `globals.css` | ✅ Present (`import "./globals.css"`) |
| 2. `globals.css` exists with Tailwind | ✅ `@import "tailwindcss"` (Tailwind v4 syntax) |
| 3. `tailwind.config.*` | ✅ Not required — Tailwind v4 uses CSS-first config in `globals.css` |
| 4. PostCSS config | ✅ `postcss.config.mjs` with `@tailwindcss/postcss` |
| 5. `package.json` dependencies | ✅ `tailwindcss@^4.1.8`, `@tailwindcss/postcss@^4.1.8` |
| 6. CSS imports not removed | ✅ Only light-theme token changes; import intact |
| 7. Theme provider | ✅ `AppProviders` does not block CSS; Sonner uses `theme="light"` |
| 8. CSS compilation | ✅ `npx @tailwindcss/cli -i src/app/globals.css` succeeds |
| 9. CSS bundle in browser | ✅ `/_next/static/css/app/layout.css` — **110 KB**, includes utilities |
| 10. Production build | ✅ `npm run build` completes successfully |

---

## Files Affected

| File | Change |
|------|--------|
| `src/app/globals.css` | Added `@source "../**/*.{js,ts,jsx,tsx,mdx}"` for explicit content scanning; moved `@keyframes hero-grid-pan` outside `@layer utilities` |
| `src/app/layout.tsx` | Added `font-sans` class to `<body>` for reliable Geist typography |
| `src/app/error.tsx` | Replaced `<a href="/">` with `<Link href="/">` (fixes build lint error) |
| `package.json` | Added `dev:reset` script |
| `scripts/dev-reset.js` | **New** — kills port 3000, clears `.next`, starts dev server |

**Not changed:** PostCSS config, Tailwind dependencies, component files, light theme tokens, or layout designs.

---

## Fix Applied

### 1. Stop all Node processes and clean cache

```powershell
# Stop all node processes, then:
Remove-Item -Recurse -Force .next
npm run dev
```

Or use the new helper:

```bash
npm run dev:reset
```

### 2. Run only ONE dev server

Always use **http://localhost:3000**. Do not run multiple `npm run dev` terminals for the same project.

### 3. Explicit Tailwind content scanning

Added to top of `globals.css`:

```css
@import "tailwindcss";
@source "../**/*.{js,ts,jsx,tsx,mdx}";
```

This ensures classes in `src/components/`, `src/lib/`, `src/hooks/`, etc. are always included in the compiled CSS.

### 4. Typography fallback

```tsx
<body className={`${geistSans.variable} ${geistMono.variable} font-sans min-h-screen antialiased`}>
```

---

## Build Verification

| Test | Result |
|------|--------|
| `npx @tailwindcss/cli -i src/app/globals.css` | ✅ Compiles in ~1s, no errors |
| `npm run build` | ✅ Production build succeeds |
| `npx tsc --noEmit` | ✅ No TypeScript errors |

### Runtime verification (after clean restart)

| URL | HTTP | CSS linked |
|-----|------|------------|
| `/` | 200 | ✅ |
| `/dashboard` | 200 | ✅ |
| `/login` | 200 | ✅ |
| `/admin/login` | 200 | ✅ |

### CSS bundle inspection

```
/_next/static/css/app/layout.css
Size: 110,683 bytes
Contains: .flex, .bg-white, .dashboard-shell, .font-sans, .saas-card, etc.
```

Light theme tokens preserved:

- White backgrounds (`#FFFFFF`)
- Gray-50 sections (`#F9FAFB`)
- Purple primary (`#8B5CF6`)
- Soft borders (`#E5E7EB`)

---

## Screenshot Verification Checklist

After running `npm run dev:reset`, verify these in the browser at **http://localhost:3000**:

- [ ] **Homepage** — Geist font, white background, styled navbar, purple CTA buttons
- [ ] **Login** (`/login`) — White card with border radius, styled inputs, purple submit button
- [ ] **Dashboard** (`/dashboard`) — Gray-50 background, white sidebar with purple active nav item
- [ ] **Dashboard KPI cards** — White cards, large numbers, colored icon boxes
- [ ] **Generate Script** — Styled form fields with gray borders and purple focus ring
- [ ] **Admin login** (`/admin/login`) — Light gray background, styled form card
- [ ] **Admin dashboard** (`/admin`) — White sidebar, stat cards, styled tables
- [ ] **Network tab** — `layout.css` returns 200, size ~100KB+
- [ ] **Console** — No CSS 404 errors, no `routes-manifest.json` ENOENT errors in terminal

---

## How to Avoid This in the Future

1. **One dev server only** — Check for existing processes before starting dev
2. **Use `npm run dev:reset`** when you see 500 errors or unstyled pages
3. **Never delete `.next` while dev is running**
4. **Never run `npm run build` while `npm run dev` is active**
5. **Hard-refresh after reset** — Ctrl+Shift+R in browser
6. **Use http://localhost:3000 only** — if terminal shows port 3002, another server is still running

---

## Conclusion

The light theme redesign did **not** break Tailwind. The unstyled appearance was caused by **corrupted `.next` cache from multiple dev servers**, which produced 500 errors and prevented the CSS bundle from loading.

After a clean restart with the `@source` hardening applied, all Tailwind styling, layout, typography, sidebar, cards, buttons, and forms are restored with the new light theme intact.
