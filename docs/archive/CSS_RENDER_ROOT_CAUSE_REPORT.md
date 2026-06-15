# CSS Render Root Cause Report

**Date:** June 15, 2026  
**Symptoms:** Dashboard and admin pages render as plain HTML — blue underlined links, no Tailwind layout, default serif font  
**Action:** Root-cause audit + fix applied (no redesign)

---

## Executive Summary

| Finding | Result |
|---------|--------|
| Tailwind / PostCSS configuration | ✅ **Correct** — not the root cause |
| `globals.css` import in `layout.tsx` | ✅ Present |
| CSS compilation | ✅ Produces ~110 KB with utilities |
| **Root cause** | ❌ **Corrupted `.next` cache + multiple concurrent `npm run dev` processes** |
| CSS file at runtime | Returns **404** or page returns **500** without `<link rel="stylesheet">` |
| Fix applied | Cleared `.next`, killed stale servers, moved Tailwind to `dependencies` |

---

## 1. Configuration Audit

### `src/app/globals.css`

| Check | Status |
|-------|--------|
| `@import "tailwindcss"` | ✅ Tailwind v4 syntax |
| `@source "../**/*.{js,ts,jsx,tsx,mdx}"` | ✅ Scans `src/components`, `src/lib`, etc. |
| `@theme inline` tokens | ✅ Light theme variables |
| `.admin-page`, `.dashboard-sidebar` utilities | ✅ Defined in `@layer utilities` |
| `@keyframes hero-grid-pan` | ✅ Outside `@layer utilities` (valid) |

**CLI compile test:**

```bash
npx @tailwindcss/cli -i src/app/globals.css -o test.css
# → 110,331 bytes in ~500ms, includes .bg-gray-50, .flex, etc.
```

### `tailwind.config.*`

**Not present** — expected for Tailwind CSS v4 (CSS-first configuration in `globals.css`).

### `postcss.config.mjs`

```js
plugins: { "@tailwindcss/postcss": {} }
```

✅ Correct for Tailwind v4 + Next.js.

### `src/app/layout.tsx`

```tsx
import "./globals.css";
```

✅ Single CSS entry point at root layout. All routes (dashboard, admin) inherit this.

### Other layouts

| Layout | Imports CSS? | Required? |
|--------|--------------|-----------|
| `src/app/admin/layout.tsx` | No | ✅ Inherits root |
| `src/app/dashboard/layout.tsx` | No | ✅ Inherits root |
| `src/app/admin/(panel)/layout.tsx` | No | ✅ Inherits root |

### `package.json` dependencies

| Package | Role | Fix applied |
|---------|------|-------------|
| `tailwindcss` | Tailwind v4 engine | **Moved to `dependencies`** (was `devDependencies`) |
| `@tailwindcss/postcss` | PostCSS plugin | **Moved to `dependencies`** (was `devDependencies`) |
| `tailwind-merge` | Class merging utility | ✅ In dependencies |

**Why move Tailwind to `dependencies`:** PostCSS/Tailwind must run during `next build` on Vercel and any CI environment. Keeping them only in `devDependencies` can break CSS compilation when `npm install --omit=dev` is used.

---

## 2. Root Cause

### Primary: Corrupted `.next` build cache

The HTML renders (React works — you see nav links, icons, content) but **the browser never receives a working stylesheet**.

**Evidence collected during this audit:**

| Test | Port 3000 (stale server) | Port 3000 (after `dev:reset`) |
|------|--------------------------|-------------------------------|
| `GET /admin/login` | ❌ Error / no stylesheet | ✅ 200, 1 stylesheet |
| `GET /_next/static/css/app/layout.css` | ⚠️ Sometimes 200 from wrong build | ✅ 200, 118,803 bytes |
| `GET /dashboard` | ❌ 500 `clientReferenceManifest` error | ✅ Redirects correctly |
| HTML contains `class="flex ..."` | ❌ On error responses | ✅ Yes |
| Terminal | `Port 3000 is in use, using 3001` | Single server on 3000 |

**Typical triggers:**

1. **Multiple `npm run dev` processes** — second server on port 3001 while browser still uses port 3000
2. **`npm run build` while `npm run dev` is running** — mixes production and dev chunks
3. **Deleting `.next` while dev is still running** — partial rebuild

**Server log signatures:**

```
⚠ Port 3000 is in use by process XXXX, using available port 3001 instead.
Invariant: Expected clientReferenceManifest to be defined.
GET /_next/static/css/app/layout.css → 404 (or stale hash)
```

### Ruled out

| Suspected cause | Verdict |
|-----------------|---------|
| White-theme migration broke Tailwind | ❌ Only CSS variable values changed |
| Missing `globals.css` import | ❌ Imported in root layout |
| Wrong `@source` path | ❌ CLI compile includes all utilities |
| Manual `<head>` in layout blocks CSS | ❌ Stylesheet `<link>` present on healthy server |
| Missing `tailwind.config.js` | ❌ Not required for Tailwind v4 |
| Tailwind classes not in source scan | ❌ `.flex`, `bg-gray-50` in compiled CSS |

---

## 3. Fix Applied

### 1. Reset dev environment (immediate)

```powershell
npm run dev:reset
```

This script (`scripts/dev-reset.js`):

- Kills processes on ports 3000–3010
- Deletes `.next`
- Starts a single dev server on **http://localhost:3000**

### 2. Move Tailwind to production dependencies

**File:** `package.json`

Moved `tailwindcss` and `@tailwindcss/postcss` from `devDependencies` → `dependencies` so CSS always compiles during Vercel/CI builds.

Run after pulling:

```bash
npm install
```

### 3. Browser hard refresh

After reset: `Ctrl + Shift + R` on `http://localhost:3000`

---

## 4. Verification Steps

| # | Check | Expected |
|---|-------|----------|
| 1 | Only one `npm run dev` running | Terminal shows port **3000** only |
| 2 | `http://localhost:3000/admin/login` | Styled card, gray background, violet accents |
| 3 | `http://localhost:3000/dashboard` | Redirects to login (if logged out) with styles |
| 4 | DevTools → Network → `layout.css` | **200**, size **> 100 KB** |
| 5 | DevTools → Elements → `<body>` | `class` includes `font-sans` |
| 6 | Terminal | No `clientReferenceManifest` errors |

### PowerShell quick test

```powershell
$r = Invoke-WebRequest -Uri "http://localhost:3000/admin/login" -UseBasicParsing
[regex]::Matches($r.Content, '<link[^>]+stylesheet[^>]+>').Count  # Must be >= 1
```

---

## 5. Prevention

| Rule | Why |
|------|-----|
| Run **only one** dev server | Avoids port split and cache corruption |
| Use `npm run dev:reset` when unstyled | Clears `.next` and kills stale PIDs |
| Never run `npm run build` while dev is active | Mixes chunk types |
| Never delete `.next` while dev is running | Partial rebuild |
| Always use **http://localhost:3000** | If terminal shows 3001, another server is still running |
| Hard refresh after reset | Clears browser cache of old CSS hashes |

---

## 6. Vercel / Production Note

If unstyled pages appear **only on Vercel** (not locally):

1. Confirm build logs show `Compiled successfully`
2. Set all env vars (see `docs/archive/VERCEL_DEPLOYMENT_REPORT.md`)
3. Ensure `tailwindcss` + `@tailwindcss/postcss` are in `dependencies` (fixed in this audit)
4. Check deployment → Network → `/_next/static/css/*.css` returns 200

Local unstyled rendering is **not** a Tailwind config bug — it is a **stale `.next` artifact** problem.

---

## 7. Sign-Off

| Item | Status |
|------|--------|
| Configuration correct | ✅ |
| Root cause identified | ✅ Corrupted `.next` / multiple dev servers |
| Fix applied | ✅ `dev:reset` + Tailwind moved to `dependencies` |
| Redesign required | ❌ None |
