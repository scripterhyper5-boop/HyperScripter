# Favicon Settings Report

**Date:** June 13, 2026  
**Scope:** Admin-managed favicon upload, preview, replace, and remove  
**Route:** `/admin/platform/favicon`

---

## Executive Summary

Admins can upload, preview, replace, and remove the website favicon from **Platform → Favicon Settings**. Files are stored in `public/uploads/favicon/`, metadata is saved in the `site_settings.favicon` JSONB column, and the root layout injects dynamic `<link rel="icon">` tags on every page.

---

## 1. Database Changes

**Migration file:** `supabase/favicon-settings-schema.sql`

```sql
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS favicon JSONB DEFAULT NULL;
```

Stored on the existing **singleton** `site_settings` row (same pattern as head/body snippets).

### JSON document shape

```json
{
  "url": "/uploads/favicon/favicon.png",
  "icon16Url": "/uploads/favicon/favicon-16x16.png",
  "icon32Url": "/uploads/favicon/favicon-32x32.png",
  "appleTouchIconUrl": "/uploads/favicon/apple-touch-icon.png",
  "type": "png",
  "updatedAt": "2026-06-13T12:00:00.000Z"
}
```

| Field | Description |
|-------|-------------|
| `url` | Primary favicon file |
| `icon16Url` | Auto-generated 16×16 PNG |
| `icon32Url` | Auto-generated 32×32 PNG |
| `appleTouchIconUrl` | Auto-generated 180×180 PNG |
| `type` | `png`, `svg`, or `ico` |
| `updatedAt` | ISO timestamp |

**Default (no custom upload):** `null` in DB → site uses `/logo.svg`

**Run migration:** Execute `supabase/favicon-settings-schema.sql` in Supabase SQL Editor after `site-settings-schema.sql`.

---

## 2. Storage Path

| Path | Purpose |
|------|---------|
| `public/uploads/favicon/` | Uploaded favicon files (publicly served) |
| `public/uploads/favicon/.gitkeep` | Keeps directory in git |

### Generated files (on upload)

| File | Size |
|------|------|
| `favicon.png` / `favicon.svg` / `favicon.ico` | Original upload |
| `favicon-16x16.png` | 16×16 |
| `favicon-32x32.png` | 32×32 |
| `apple-touch-icon.png` | 180×180 (Apple Touch Icon) |

Uploading a new favicon **clears the directory** first (except `.gitkeep`), then writes fresh files.

---

## 3. Upload API

**Endpoint:** `/api/admin/favicon`  
**Auth:** Admin session required (`getAdminServerSession()`)

| Method | Action |
|--------|--------|
| `GET` | Load current favicon settings + active resolved URL |
| `POST` | Upload favicon (`multipart/form-data`, field: `favicon`) |
| `DELETE` | Remove custom favicon, revert to default |

### POST validation

| Rule | Limit |
|------|-------|
| Max file size | **2 MB** |
| Allowed formats | `.png`, `.svg`, `.ico` |
| MIME types | `image/png`, `image/svg+xml`, `image/x-icon`, `image/vnd.microsoft.icon` |

### Processing pipeline

1. Validate admin session + file
2. Clear `public/uploads/favicon/`
3. Save original file
4. Use **sharp** to generate 16×16, 32×32, and 180×180 PNGs (including from SVG/ICO sources)
5. Persist JSON to `site_settings.favicon`
6. Return `{ message: "Favicon updated successfully", favicon }`

### Files

| File | Role |
|------|------|
| `src/app/api/admin/favicon/route.ts` | API handlers |
| `src/lib/favicon/process-upload.ts` | sharp resize/generation |
| `src/lib/favicon/storage.ts` | Filesystem read/write/clear |
| `src/lib/favicon/validation.ts` | Server + client validation |
| `src/lib/db/site-settings.ts` | `getFaviconSettings()`, `updateFaviconSettings()` |

---

## 4. Website Integration

### Root layout (`src/app/layout.tsx`)

- **`generateMetadata()`** — sets Next.js `icons` from DB favicon
- **`<SiteFaviconLinks />`** — explicit `<link>` tags in `<head>`:

```html
<link rel="icon" sizes="16x16" …>
<link rel="icon" sizes="32x32" …>
<link rel="icon" …>
<link rel="shortcut icon" …>
<link rel="apple-touch-icon" sizes="180x180" …>
```

### Component

`src/components/site-favicon-links.tsx` — resolves custom vs default favicon URLs.

### Default favicon

When `site_settings.favicon` is `null`, the site uses **`/logo.svg`** (existing file in `public/`).

No hardcoded favicon.ico references remain in layout.

---

## 5. Admin UI

**Route:** `/admin/platform/favicon`  
**File:** `src/app/admin/(panel)/platform/favicon/page.tsx`

### Sidebar

```
Platform
 ├── AI Settings
 ├── Email Settings
 ├── Header & Footer
 ├── Favicon Settings   ← new
 └── Site Settings
```

### Features

| Feature | Implementation |
|---------|----------------|
| **Current favicon** | Shows active file, type, URL, last updated |
| **Upload** | File picker → local preview |
| **Replace** | Same file picker (overwrites on save) |
| **Remove** | `DELETE` API → reverts to `/logo.svg` |
| **Save Changes** | `POST` upload → toast: *"Favicon updated successfully"* |
| **Discard** | Clears unsaved file selection |

### Preview panel

| Preview | Description |
|---------|-------------|
| Browser tab | Mock browser chrome with favicon in tab |
| 16×16 | Small icon |
| 32×32 | Standard icon |
| 48×48 | Medium (scaled display) |
| 180×180 | Apple Touch Icon |

Unsaved uploads preview via `blob:` URL before Save.

---

## 6. Security

| Control | Detail |
|---------|--------|
| Authentication | Admin-only API routes |
| File size | Max 2 MB |
| File type | Extension + MIME validation |
| Sanitization | `sanitizeFaviconSettings()` on DB read/write |
| Storage | Local `public/uploads/favicon/` only — no arbitrary paths |

---

## 7. Dependencies

| Package | Purpose |
|---------|---------|
| `sharp` | Rasterize SVG/ICO/PNG and generate sized variants |

---

## 8. File Inventory

### New files

| File |
|------|
| `supabase/favicon-settings-schema.sql` |
| `public/uploads/favicon/.gitkeep` |
| `src/lib/favicon/types.ts` |
| `src/lib/favicon/validation.ts` |
| `src/lib/favicon/storage.ts` |
| `src/lib/favicon/process-upload.ts` |
| `src/app/api/admin/favicon/route.ts` |
| `src/app/admin/(panel)/platform/favicon/page.tsx` |
| `src/components/site-favicon-links.tsx` |

### Modified files

| File | Change |
|------|--------|
| `src/lib/site-settings/types.ts` | Added `favicon` field |
| `src/lib/db/site-settings.ts` | Favicon get/update helpers |
| `src/app/layout.tsx` | Dynamic metadata + favicon links |
| `src/components/admin/sidebar.tsx` | Favicon Settings menu item |
| `package.json` | Added `sharp` |

---

## 9. Setup Checklist

1. Run `supabase/favicon-settings-schema.sql` in Supabase
2. Ensure `public/uploads/favicon/` is writable by the Next.js process
3. Go to **Platform → Favicon Settings**
4. Upload a `.png`, `.svg`, or `.ico` file (≤ 2 MB)
5. Click **Save Changes**
6. Hard-refresh the homepage and verify the browser tab icon

---

## 10. Notes

- Uploaded files in `public/uploads/favicon/` are served statically by Next.js
- Consider adding `public/uploads/favicon/*` to `.gitignore` in production (keep `.gitkeep`)
- Removing favicon deletes uploaded files and sets DB `favicon` to `null`
- SVG uploads keep the original SVG plus generated PNG variants for sized icons
