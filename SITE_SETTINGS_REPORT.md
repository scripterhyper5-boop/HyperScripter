# Site Settings — Implementation Report

## Overview

Admins can manage global HTML snippets (Google Analytics, AdSense, Search Console verification, Meta Pixel, etc.) from **Admin → Platform → Site Settings** without editing source files. Snippets are stored in Supabase and injected into every page via the root layout.

---

## Supabase Schema

**Migration file:** `supabase/site-settings-schema.sql`

Run in the Supabase SQL Editor **after** `schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS public.site_settings (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  head_code       TEXT        NOT NULL DEFAULT '',
  body_start_code TEXT        NOT NULL DEFAULT '',
  body_end_code   TEXT        NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only one row allowed
CREATE UNIQUE INDEX IF NOT EXISTS site_settings_singleton_idx
  ON public.site_settings ((true));
```

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `head_code` | TEXT | HTML injected into `<head>` |
| `body_start_code` | TEXT | HTML injected after `<body>` |
| `body_end_code` | TEXT | HTML injected before `</body>` |
| `created_at` | TIMESTAMPTZ | Row creation time |
| `updated_at` | TIMESTAMPTZ | Auto-updated on save |

**Single-row enforcement:** `site_settings_singleton_idx` is a unique index on the constant `(true)`, so only one configuration row can exist.

**RLS:** Enabled with a service-role policy (same pattern as `ai_settings`).

---

## APIs Created

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/admin/site-settings` | Admin only | Load current snippets |
| `PUT` | `/api/admin/site-settings` | Admin only | Save snippets |

**Files:**
- `src/app/api/admin/site-settings/route.ts`
- `src/lib/db/site-settings.ts`

**Request body (PUT):**
```json
{
  "headCode": "<meta name=\"google-site-verification\" content=\"xxxx\" />",
  "bodyStartCode": "",
  "bodyEndCode": "<script>...</script>"
}
```

**Response:**
```json
{
  "id": "uuid",
  "headCode": "...",
  "bodyStartCode": "...",
  "bodyEndCode": "...",
  "createdAt": "2026-06-13T...",
  "updatedAt": "2026-06-13T..."
}
```

---

## Admin UI Added

**Route:** `/admin/platform/site-settings`

**Sidebar:** Platform → Site Settings (nested under Platform)

**Files:**
- `src/app/admin/(panel)/platform/site-settings/page.tsx`
- `src/components/admin/sidebar.tsx` (nested Platform menu)

**Sections:**
1. **Head Code** — textarea with HTML syntax highlighting (`@uiw/react-textarea-code-editor`)
2. **Body Start Code** — injected after `<body>`
3. **Body End Code** — injected before `</body>`

**Actions:**
- **Save Changes** — `PUT /api/admin/site-settings`
- **Reset** — discards unsaved edits and restores last saved values

---

## Layout Injection Points

**File:** `src/app/layout.tsx`

Settings are loaded server-side on every request:

```tsx
const siteSettings = await getSiteSettings();

<html>
  <head>
    <SiteHeadSnippet html={siteSettings.headCode} />
  </head>
  <body>
    <SiteBodySnippet html={siteSettings.bodyStartCode} />
    {/* app content */}
    <SiteBodySnippet html={siteSettings.bodyEndCode} />
  </body>
</html>
```

**Injection components:** `src/components/site-settings-injection.tsx`

| Snippet | Component | Method |
|---------|-----------|--------|
| `head_code` | `SiteHeadSnippet` | Parses `script`, `meta`, `link`, `style`, `noscript` into React elements (server-rendered for crawlers) |
| `body_start_code` | `SiteBodySnippet` | `dangerouslySetInnerHTML` with `display: contents` |
| `body_end_code` | `SiteBodySnippet` | `dangerouslySetInnerHTML` with `display: contents` |

**Parser:** `src/lib/site-settings/parse-head-snippet.tsx`

---

## Security Checks

| Check | Implementation |
|-------|----------------|
| Admin-only API access | `getAdminServerSession()` on GET/PUT — returns `401` for non-admins |
| No public write API | Only `/api/admin/site-settings` exists; no user-facing mutation endpoint |
| Server-side load | Layout uses `getSiteSettings()` with service-role Supabase client |
| Admin-controlled HTML | Snippets are only editable by admins; rendered via `dangerouslySetInnerHTML` / parsed head tags |
| Graceful missing table | `PGRST205` returns empty settings instead of crashing the site |

**Note:** Snippets are trusted admin content (same trust model as CMS custom code). Only users with `role = 'admin'` can modify them.

---

## Supported Examples

### Google Search Console (Head Code)
```html
<meta name="google-site-verification" content="xxxx" />
```

### Google AdSense (Head or Body End)
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXX"></script>
```

### Google Analytics (Head Code)
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXX');
</script>
```

### Meta Pixel (Body End Code)
```html
<script>
  !function(f,b,e,v,n,t,s){...}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'YOUR_PIXEL_ID');
  fbq('track', 'PageView');
</script>
```

---

## Test Instructions

### 1. Apply migration

1. Open [Supabase SQL Editor](https://supabase.com/dashboard/project/jvinzixeqnmtvjizsqv/sql)
2. Run `supabase/site-settings-schema.sql`
3. Confirm table exists: `SELECT * FROM site_settings;` (empty initially)

### 2. Admin panel

1. Sign in as admin (`admin@hyperscripter.com` / `admin123`)
2. Open **Admin → Platform → Site Settings**
3. Paste a Search Console meta tag into **Head Code**
4. Click **Save Changes** — toast should confirm save
5. Edit a field, click **Reset** — values revert to last saved state

### 3. API authorization

```bash
# Without admin session → 401
curl -s http://localhost:3000/api/admin/site-settings

# With admin cookie → 200
curl -s http://localhost:3000/api/admin/site-settings -b "session=..."
```

### 4. Frontend injection

1. Save a distinctive snippet, e.g. head:
   ```html
   <meta name="test-injection" content="site-settings-ok" />
   ```
2. Open any public page (e.g. `/`)
3. View page source (`Ctrl+U`)
4. Confirm `<meta name="test-injection" content="site-settings-ok" />` appears inside `<head>`

### 5. Body injection

1. Add to **Body End Code**:
   ```html
   <!-- body-end-marker -->
   ```
2. View source — confirm comment appears before `</body>`

### 6. Non-admin blocked

1. Sign in as a regular user
2. Visit `/api/admin/site-settings` — expect `401 Unauthorized`
3. Visit `/admin/platform/site-settings` — admin panel should redirect/deny

---

## Files Changed / Added

| File | Purpose |
|------|---------|
| `supabase/site-settings-schema.sql` | Database migration |
| `src/lib/site-settings/types.ts` | Shared types |
| `src/lib/site-settings/parse-head-snippet.tsx` | Head HTML parser |
| `src/lib/db/site-settings.ts` | DB read/write |
| `src/app/api/admin/site-settings/route.ts` | Admin API |
| `src/app/admin/(panel)/platform/site-settings/page.tsx` | Admin UI |
| `src/components/site-settings-injection.tsx` | Layout injection |
| `src/components/admin/sidebar.tsx` | Platform submenu |
| `src/app/layout.tsx` | Root layout injection |
| `supabase/README.md` | Migration docs updated |

---

## Status

✅ Schema defined  
✅ Admin APIs (GET/PUT)  
✅ Admin UI with code editor  
✅ Root layout injection  
✅ Admin-only security  
✅ Single-row constraint  

**Required before use:** Run `site-settings-schema.sql` in Supabase.
