# SEO Settings Report

**Date:** June 13, 2026  
**Scope:** Admin-managed global SEO, Open Graph, verification, analytics, and schema  
**Route:** `/admin/platform/seo`

---

## Executive Summary

Admins can manage all global SEO settings from **Platform → SEO Settings** without editing code. Settings are stored as JSON in the `site_settings.seo_settings` column and applied dynamically to Next.js metadata, robots.txt, sitemap, JSON-LD schema, verification meta tags, and analytics scripts.

---

## 1. Database Schema

**Migration file:** `supabase/seo-settings-schema.sql`

```sql
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS seo_settings JSONB DEFAULT NULL;
```

Stored on the existing **singleton** `site_settings` row (same table as HTML snippets and favicon).

### JSON document shape

```json
{
  "siteName": "HyperScripter",
  "siteTitle": "HyperScripter – AI TikTok Script Generator",
  "metaDescription": "...",
  "metaKeywords": "TikTok script generator, ...",
  "canonicalUrl": "https://hyperscripter.com",
  "authorName": "HyperScripter",
  "indexWebsite": true,
  "followLinks": true,
  "ogTitle": "...",
  "ogDescription": "...",
  "ogImageUrl": "/uploads/seo/og-image.png",
  "ogType": "website",
  "twitterCard": "summary_large_image",
  "googleSiteVerification": "",
  "bingSiteVerification": "",
  "yandexVerification": "",
  "pinterestVerification": "",
  "googleAnalyticsId": "G-XXXXXXXX",
  "googleTagManagerId": "GTM-XXXXXXX",
  "microsoftClarityId": "",
  "metaPixelId": "",
  "enableOrganizationSchema": true,
  "organizationName": "HyperScripter",
  "organizationLogoUrl": "https://hyperscripter.com/logo.svg",
  "organizationWebsiteUrl": "https://hyperscripter.com",
  "organizationSocialProfiles": ["https://twitter.com/..."],
  "updatedAt": "2026-06-13T12:00:00.000Z"
}
```

**Run migration:** Execute `supabase/seo-settings-schema.sql` in Supabase after `site-settings-schema.sql`.

---

## 2. API Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/admin/seo-settings` | Admin | Load SEO settings + validation |
| `PUT` | `/api/admin/seo-settings` | Admin | Save SEO settings |
| `POST` | `/api/admin/seo-settings` | Admin | Reset defaults (`{ "action": "reset" }`) |
| `POST` | `/api/admin/seo-settings/og-image` | Admin | Upload OG image (multipart `ogImage`) |

### OG image upload

- **Storage:** `public/uploads/seo/og-image.{png|jpg|webp}`
- **Max size:** 5 MB
- **Formats:** `.png`, `.jpg`, `.jpeg`, `.webp`
- Automatically updates `ogImageUrl` in `seo_settings`

---

## 3. Admin UI

**Route:** `/admin/platform/seo`  
**File:** `src/app/admin/(panel)/platform/seo/page.tsx`

### Sidebar

```
Platform
 ├── AI Settings
 ├── Email Settings
 ├── Header & Footer
 ├── Favicon Settings
 ├── SEO Settings        ← new
 └── Site Settings
```

### Sections

| Section | Fields |
|---------|--------|
| **Global SEO** | Site name, site title, meta description, keywords, canonical URL, author, index/follow toggles |
| **Open Graph** | OG title, description, image URL, upload, OG type, Twitter card |
| **Verification** | Google, Bing, Yandex, Pinterest |
| **Analytics** | GA4, GTM, Microsoft Clarity, Meta Pixel |
| **Organization Schema** | Enable toggle, business name, logo URL, website URL, social profiles |

### Actions

| Button | Behavior |
|--------|----------|
| **Save Changes** | `PUT /api/admin/seo-settings` → toast: *"SEO settings saved successfully"* |
| **Preview Metadata** | In-panel preview + opens homepage in new tab |
| **Reset Defaults** | Restores built-in defaults from `site-config.ts` |
| **Discard** | Reverts unsaved form changes |
| **Upload OG Image** | `POST /api/admin/seo-settings/og-image` |

### SEO Validation

Live validation panel checks:
- Site name required (error)
- Title length 30–70 chars (warning)
- Description length 120–160 chars (warning)
- Valid canonical URL (error)
- Keywords present (warning)
- Valid OG image URL format (error)

---

## 4. Metadata Integration

### Core module: `src/lib/seo.ts`

Refactored to load CMS settings:

| Function | Purpose |
|----------|---------|
| `getResolvedSeoSettings()` | Cached server loader (`src/lib/seo-settings/server.ts`) |
| `buildMetadata(seo, options)` | Sync metadata builder from SEO config |
| `createMetadata(options)` | Async — loads SEO settings and builds metadata |
| `organizationSchema()` | Uses CMS org settings (returns `null` if disabled) |
| `websiteSchema()` | Uses CMS site name/URL/description |
| `softwareApplicationSchema()` | Uses CMS site name/description |
| `breadcrumbSchema()` | Uses CMS canonical base URL |
| `articleSchema()` | Uses CMS author/org defaults |

### Applied automatically

| Output | Source |
|--------|--------|
| `<title>` | `siteTitle` or `{page} \| {siteName}` |
| `<meta name="description">` | `metaDescription` |
| `<meta name="keywords">` | `metaKeywords` (comma-separated) |
| `<link rel="canonical">` | `canonicalUrl` + page path |
| `<meta name="robots">` | `indexWebsite` + `followLinks` |
| `og:title` | `ogTitle` |
| `og:description` | `ogDescription` |
| `og:image` | `ogImageUrl` |
| `og:type` | `ogType` |
| `twitter:card` | `twitterCard` |
| `twitter:title` / `twitter:description` / `twitter:image` | From OG fields |

### Root layout

`src/app/layout.tsx` → `generateMetadata()` uses `buildMetadata(seo)` merged with favicon icons.

### robots.txt & sitemap

- `src/app/robots.ts` — respects `indexWebsite`, uses `canonicalUrl` for sitemap URL
- `src/app/sitemap.ts` — uses `canonicalUrl` as base for all URLs

### JSON-LD

Homepage `organizationSchema`, `websiteSchema`, `softwareApplicationSchema` now read from CMS settings.

---

## 5. Verification Code Integration

Injected via Next.js `metadata.verification` in `buildMetadata()`:

| Provider | Meta tag |
|----------|----------|
| Google | `google-site-verification` |
| Bing | `msvalidate.01` |
| Yandex | `yandex-verification` |
| Pinterest | `p:domain_verify` |

Empty fields are omitted from output.

---

## 6. Analytics Integration

**Component:** `src/components/site-seo-analytics.tsx`  
**Injected in:** root layout `<body>` (after body-start snippet)

| Service | ID format | Injection |
|---------|-----------|-----------|
| Google Analytics 4 | `G-` or `UA-` | gtag.js via `next/script` |
| Google Tag Manager | `GTM-` | GTM head script + noscript iframe |
| Microsoft Clarity | alphanumeric | Clarity tag script |
| Meta Pixel | numeric | Facebook `fbevents.js` + PageView |

Scripts only load when the corresponding ID field is set in admin.

---

## 7. Default Values

Defined in `src/lib/seo-settings/types.ts` (`DEFAULT_SEO_SETTINGS`), seeded from `src/lib/site-config.ts`:

| Field | Default |
|-------|---------|
| siteName | HyperScripter |
| siteTitle | HyperScripter – AI TikTok Script Generator |
| metaDescription | From siteConfig.description |
| canonicalUrl | https://hyperscripter.com |
| ogImageUrl | /og-image.png |
| ogType | website |
| twitterCard | summary_large_image |
| indexWebsite / followLinks | true |
| enableOrganizationSchema | true |
| organizationSocialProfiles | Twitter + GitHub from siteConfig |

If `seo_settings` is `null` in DB, defaults are used automatically.

---

## 8. File Inventory

### New files

| File |
|------|
| `supabase/seo-settings-schema.sql` |
| `public/uploads/seo/.gitkeep` |
| `src/lib/seo-settings/types.ts` |
| `src/lib/seo-settings/validation.ts` |
| `src/lib/seo-settings/resolve.ts` |
| `src/lib/seo-settings/storage.ts` |
| `src/lib/seo-settings/server.ts` |
| `src/app/api/admin/seo-settings/route.ts` |
| `src/app/api/admin/seo-settings/og-image/route.ts` |
| `src/app/admin/(panel)/platform/seo/page.tsx` |
| `src/components/site-seo-analytics.tsx` |

### Modified files

| File | Change |
|------|--------|
| `src/lib/seo.ts` | CMS-driven metadata + schema |
| `src/lib/site-settings/types.ts` | Added `seoSettings` field |
| `src/lib/db/site-settings.ts` | `getSeoSettings`, `updateSeoSettings`, `resetSeoSettings` |
| `src/app/layout.tsx` | SEO metadata + analytics injection |
| `src/app/robots.ts` | CMS index/canonical |
| `src/app/sitemap.ts` | CMS canonical base URL |
| `src/app/page.tsx` | Async org schema |
| `src/components/admin/sidebar.tsx` | SEO Settings menu item |
| All pages using `createMetadata` | Changed to async `generateMetadata()` |

---

## 9. Setup Checklist

1. Run `supabase/seo-settings-schema.sql` in Supabase
2. Log in as admin → **Platform → SEO Settings**
3. Review defaults → **Save Changes**
4. Upload OG image if needed
5. Add verification codes and analytics IDs
6. View page source on homepage — confirm `<title>`, `og:*`, `twitter:*` tags
7. Check `/robots.txt` and `/sitemap.xml` use your canonical URL

---

## 10. Notes

- `site-config.ts` remains as fallback defaults; CMS overrides on the public site
- Dashboard/admin/auth pages use `noIndex: true` per-page regardless of global index setting
- Organization schema is omitted from homepage JSON-LD when disabled in admin
- OG images uploaded via admin are stored in `public/uploads/seo/` (not committed to git by default)
