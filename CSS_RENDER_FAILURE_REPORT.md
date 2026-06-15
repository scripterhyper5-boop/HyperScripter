# CSS Render Failure Report

**Date:** June 15, 2026  
**Severity:** Critical (admin + all routes appear unstyled)  
**Scope:** Frontend styling audit — no redesign, root-cause analysis only

---

## Symptom Summary

The admin panel (and likely all routes) renders as plain HTML:

- Default browser serif font (Times)
- Blue/purple underlined links
- Sidebar collapsed to an unstyled vertical link list
- Tailwind utility classes present in JSX but not applied
- Icons render (SVG) but with no layout/spacing rules

This pattern is **not** caused by missing Tailwind classes in components. The DOM and React tree are correct; **the stylesheet is not being applied in the browser.**

---

## Root Cause

### Primary: CSS bundle fails to load at runtime (`.next` cache corruption)

The HTML response includes a stylesheet link:

```html
<link rel="stylesheet" href="/_next/static/css/app/layout.css?v=..." />
```

When the browser requests that URL and receives **404** or an error page, every Tailwind class is ignored and the page looks exactly like your screenshot.

**This is a dev-server / build-artifact problem, not a source-code styling bug.**

Common triggers on this project:

| Trigger | What happens |
|---------|----------------|
| **Multiple `npm run dev` processes** | Terminal shows `Port 3000 is in use, using 3001 instead` — browser may still hit the stale server on 3000 |
| **`npm run build` while dev is running** | Mixes production chunks with dev assets; CSS path 404s |
| **Deleting `.next` while dev is still running** | Partial rebuild; `routes-manifest.json` ENOENT |
| **Hard refresh on wrong port** | HTML from one server, CSS requested from another |

Server log signatures when broken:

```
⚠ Port 3000 is in use by process XXXX, using available port 3001 instead.
⨯ ENOENT: routes-manifest.json
⨯ Cannot find module './1331.js'
GET /_next/static/css/app/layout.css → 404
```

### Secondary (already mitigated): Tailwind v4 content scanning

After the white-theme migration, `globals.css` lives in `src/app/` while components live in `src/components/`. Tailwind v4 needs explicit `@source` to scan sibling directories. This was fixed previously and is present in the current file.

### Ruled out

| Suspected cause | Verdict |
|-----------------|---------|
| White-theme migration broke Tailwind | **No** — only CSS variable/token values changed |
| `globals.css` not imported | **No** — imported in root `src/app/layout.tsx` |
| Missing `tailwind.config.*` | **No** — Tailwind v4 uses CSS-first config |
| Admin layout missing CSS import | **No** — admin inherits root layout; separate import not needed |
| PostCSS misconfigured | **No** — `@tailwindcss/postcss` plugin present |
| Admin-specific route bypasses root layout | **No** — `app/admin/layout.tsx` only passes `children` |
| CSS not generated at build time | **No** — build produces ~118 KB CSS bundles |

---

## Audit Checklist Results

### 1. `src/app/layout.tsx`

| Check | Result |
|-------|--------|
| `import "./globals.css"` | ✅ Line 19 |
| `<html>` / `<body>` present | ✅ |
| `font-sans` on body | ✅ |
| Geist font variables | ✅ |

**Note:** A manual `<head>` block exists for favicon + site head snippets. This does **not** block CSS injection in Next.js 15 (verified: stylesheet `<link>` is present in HTML output). However, malformed content in **Admin → Site Settings → Head code** could theoretically break document parsing — check if issue persists after cache reset.

### 2. `src/app/globals.css`

| Check | Result |
|-------|--------|
| `@import "tailwindcss"` | ✅ Tailwind v4 syntax |
| `@source "../**/*.{js,ts,jsx,tsx,mdx}"` | ✅ Scans `src/components`, `src/lib`, etc. |
| `@theme inline` tokens | ✅ Light theme variables |
| `@layer base` / `@layer utilities` | ✅ Valid |
| `@keyframes hero-grid-pan` | ✅ Outside `@layer utilities` (valid) |
| `.admin-page`, `.dashboard-sidebar` utilities | ✅ Defined |

### 3. `tailwind.config.*`

| Check | Result |
|-------|--------|
| File exists | **N/A** — not required for Tailwind v4 |
| Config location | CSS-first in `globals.css` |

### 4. `postcss.config.mjs`

```js
plugins: { "@tailwindcss/postcss": {} }
```

✅ Correct for Tailwind v4.

### 5. White-theme migration changes

From `UI_REDESIGN_REPORT.md` / `globals.css`:

- Removed `className="dark"` from `<html>` (was forcing dark mode)
- Replaced OKLCH dark tokens with light `:root` hex values
- Added SaaS utility classes (`.saas-card`, `.dashboard-shell`, etc.)

**None of these changes remove or break the Tailwind pipeline.** The migration is not the root cause.

### 6. CSS import order

| File | Imports CSS? |
|------|-------------|
| `src/app/layout.tsx` | ✅ `import "./globals.css"` (only entry point — correct) |
| `src/app/admin/layout.tsx` | Pass-through only (correct) |
| `src/app/admin/(panel)/layout.tsx` | No import needed (correct) |
| `src/app/dashboard/layout.tsx` | No import needed (correct) |

Single CSS entry point at root layout is the correct Next.js App Router pattern.

### 7. Build output for CSS bundles

**Production build (`npm run build`):** ✅ Compiled successfully

| Artifact | Status |
|----------|--------|
| `.next/static/css/4da944d5a46fa504.css` | ✅ ~118 KB, Tailwind v4.3 |
| `.next/static/css/5eacd01f773eed7f.css` | ✅ Present |
| `.next/static/css/fd8cb407a7e59580.css` | ✅ Present |

**Dev server (`npm run dev`):**

| URL | HTTP | Size |
|-----|------|------|
| `/_next/static/css/app/layout.css` | 200 | 118,803 bytes |
| Contains `bg-gray-50`, `min-h-screen`, `text-violet`, `.flex` | ✅ | |
| Contains `.admin-page`, `.dashboard-sidebar` | ✅ | |

**Tailwind CLI (independent compile):**

```bash
npx @tailwindcss/cli -i src/app/globals.css -o test.css
# → 110 KB in 634ms, no errors
```

---

## Broken Files

### Source code: **none**

All configuration and imports are correct. No file in `src/` needs a styling fix.

### Runtime artifacts: **`.next/` cache (when corrupted)**

When broken, the `.next` folder contains stale or mixed dev/production chunks. The CSS file referenced in HTML does not exist on disk or is served from the wrong process.

| State | File / symptom |
|-------|----------------|
| Corrupted | `.next/static/css/app/layout.css` → 404 |
| Healthy | Same path → 200, ~110–120 KB |

---

## Exact Fix

### Step 1 — Stop all dev servers

On Windows PowerShell:

```powershell
# Kill anything listening on ports 3000–3010, or close all terminals running npm run dev
```

Or use the project helper (recommended):

```powershell
npm run dev:reset
```

This script (`scripts/dev-reset.js`):

1. Kills processes on ports 3000–3010
2. Deletes `.next`
3. Starts a single `npm run dev` on port 3000

### Step 2 — Use only one URL

Open **http://localhost:3000** (not 3001/3002).

If the terminal says `Port 3000 is in use`, another process is still running — kill it before continuing.

### Step 3 — Hard refresh the browser

`Ctrl + Shift + R` (or clear cache for localhost).

### Step 4 — Verify CSS in DevTools

1. Open `/admin/blog` (or any admin page)
2. **Network** tab → filter `css`
3. Confirm `layout.css` → **Status 200**, size **> 100 KB**
4. **Elements** tab → select `<body>` → **Computed** → `font-family` should include Geist, not Times

### Step 5 — If still broken, check site head injection

Admin → **Platform → Site Settings → Head code**

Remove all content temporarily. If styling returns, a malformed snippet in head code is breaking the document. Only `script`, `meta`, `link`, `style`, `noscript` tags are supported.

### Rules to prevent recurrence

1. **Never** run `npm run build` while `npm run dev` is active
2. **Never** delete `.next` while dev is running
3. Run **only one** dev server per project
4. Use `npm run dev:reset` when pages suddenly look unstyled

---

## Verification Steps

### Quick pass/fail

| # | Test | Expected | Pass |
|---|------|----------|------|
| 1 | `npm run dev:reset` completes without error | Single server on :3000 | [ ] |
| 2 | `GET /_next/static/css/app/layout.css` | 200, > 100 KB | [ ] |
| 3 | `/` homepage | Geist font, white bg, purple buttons | [ ] |
| 4 | `/admin/login` | Gray bg, styled card, violet icon box | [ ] |
| 5 | `/admin/blog` (authenticated) | White sidebar, gray-50 main, styled table | [ ] |
| 6 | `/dashboard` | White sidebar, gray-50 shell | [ ] |
| 7 | Network tab — no CSS 404 | No red `layout.css` entries | [ ] |
| 8 | Terminal — no ENOENT / module errors | Clean request logs | [ ] |
| 9 | `npm run build` (dev stopped first) | Build succeeds, CSS in `.next/static/css/` | [ ] |

### Visual checks on admin (after fix)

- [ ] Sidebar: white background, fixed width, purple active nav item
- [ ] Links: gray text, no underline (except hover)
- [ ] Blog page: styled table, purple "Create post" button
- [ ] Mobile: hamburger button positioned top-left (not inline with nav list)
- [ ] Sign out: styled text button at bottom of sidebar, not default gray `<button>`

### curl / PowerShell check

```powershell
$r = Invoke-WebRequest -Uri "http://localhost:3000/" -UseBasicParsing
[regex]::Matches($r.Content, '<link[^>]+stylesheet[^>]+>').Value
# Must return a layout.css link

$c = Invoke-WebRequest -Uri "http://localhost:3000/_next/static/css/app/layout.css" -UseBasicParsing
$c.StatusCode   # Must be 200
$c.Content.Length  # Must be > 100000
```

---

## Architecture Reference

```
src/app/layout.tsx
  └── import "./globals.css"          ← single CSS entry (required)
        └── @import "tailwindcss"
        └── @source "../**/*"        ← scans src/components, src/lib, …
        └── @theme inline            ← design tokens
        └── @layer base / utilities  ← .admin-page, .dashboard-sidebar, …

postcss.config.mjs
  └── @tailwindcss/postcss           ← compiles CSS at build/dev time

app/admin/layout.tsx                 ← pass-through, no CSS import needed
app/admin/(panel)/layout.tsx         ← AdminSidebar + admin-page wrapper
```

---

## Conclusion

The admin panel is **not missing styles in source code**. Tailwind v4, PostCSS, `globals.css`, and the root layout import chain are all correctly configured. The white-theme migration did not break CSS compilation.

The unstyled rendering is caused by **the browser failing to load `/_next/static/css/app/layout.css`**, almost always due to a **corrupted `.next` cache from concurrent dev servers or build/dev conflicts**.

**Fix:** `npm run dev:reset` → use http://localhost:3000 only → hard refresh → confirm `layout.css` returns 200 in Network tab.

No component or theme redesign is required.
