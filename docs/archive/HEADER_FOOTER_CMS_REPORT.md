# Header & Footer CMS Report

**Date:** June 13, 2026  
**Scope:** Admin-managed public website header and footer  
**Route:** `/admin/platform/header-footer`

---

## Executive Summary

Admins can now edit the public site **header** (logo, navigation, CTA) and **footer** (company info, quick links, legal URLs, social profiles) from the Admin Panel. Settings are stored as JSON in Supabase and loaded server-side on all marketing pages. No hardcoded navigation or footer links remain on the public site.

---

## 1. Database Schema

**File:** `supabase/header-footer-settings-schema.sql`

Singleton table with JSON document storage:

```sql
CREATE TABLE public.header_footer_settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settings    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- **Singleton enforced** via `UNIQUE INDEX ON header_footer_settings ((true))`
- **RLS enabled** with service-role policy (matches existing `site_settings` pattern)
- **`updated_at`** maintained by `set_updated_at()` trigger

### JSON structure

```json
{
  "header": {
    "logoText": "HyperScripter",
    "navigation": [
      { "label": "Features", "url": "#features" },
      { "label": "How It Works", "url": "#how-it-works" }
    ],
    "ctaText": "Dashboard",
    "ctaUrl": "/dashboard",
    "showNavigation": true,
    "showCta": true
  },
  "footer": {
    "companyName": "HyperScripter",
    "copyright": "© 2026 HyperScripter. All rights reserved.",
    "description": "AI-powered TikTok script generator...",
    "quickLinks": [{ "label": "Features", "url": "/#features" }],
    "privacyPolicyUrl": "/privacy",
    "termsOfServiceUrl": "/terms",
    "socialLinks": {
      "twitter": "https://twitter.com/hyperscripter",
      "youtube": "",
      "linkedin": "",
      "facebook": "",
      "instagram": "",
      "discord": ""
    },
    "showDescription": true,
    "showQuickLinks": true,
    "showLegalLinks": true,
    "showSocialLinks": true
  }
}
```

**Migration:** Run `supabase/header-footer-settings-schema.sql` in the Supabase SQL Editor after `schema.sql`.

---

## 2. API Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/admin/header-footer` | Admin | Load full settings for admin form |
| `PUT` | `/api/admin/header-footer` | Admin | Save header + footer changes |
| `POST` | `/api/admin/header-footer` | Admin | Reset to defaults (`{ "action": "reset" }`) |
| `GET` | `/api/header-footer` | Public | Read-only header + footer (no admin metadata) |

### Security

- Admin routes use `getAdminServerSession()` → **401** if not admin
- Input sanitized via `sanitizeHeaderSettings` / `sanitizeFooterSettings`
- String length caps (500 chars text, 2048 chars URLs)
- Max 20 navigation/quick links per section

### Files

- `src/app/api/admin/header-footer/route.ts`
- `src/app/api/header-footer/route.ts`
- `src/lib/db/header-footer-settings.ts`
- `src/lib/header-footer/validation.ts`

---

## 3. Admin UI

**Route:** `/admin/platform/header-footer`  
**File:** `src/app/admin/(panel)/platform/header-footer/page.tsx`

### Sidebar (Platform menu)

```
Platform
 ├── AI Settings
 ├── Email Settings
 ├── Header & Footer   ← new
 └── Site Settings
```

### Header settings form

| Field | Type |
|-------|------|
| Logo Text | Text input |
| Navigation Links | Repeatable Label + URL rows |
| CTA Button Text | Text input |
| CTA Button URL | Text input |
| Show Navigation | Toggle |
| Show CTA Button | Toggle |

When **Show CTA** is off, the public header falls back to Sign in / Get started (auth buttons).

### Footer settings form

| Field | Type |
|-------|------|
| Company Name | Text input |
| Copyright Text | Text input |
| Footer Description | Textarea |
| Quick Links | Repeatable Label + URL rows |
| Privacy Policy URL | Text input |
| Terms of Service URL | Text input |
| Social Links | Twitter/X, YouTube, LinkedIn, Facebook, Instagram, Discord |
| Show Description | Toggle |
| Show Quick Links | Toggle |
| Show Legal Links | Toggle |
| Show Social Links | Toggle |

### Actions

| Button | Behavior |
|--------|----------|
| **Save Changes** | `PUT /api/admin/header-footer` → toast: *"Settings updated successfully"* |
| **Preview Changes** | Stores draft in `sessionStorage`, opens `/?hf-preview=1` in new tab |
| **Reset to Default** | `POST { action: "reset" }` → restores built-in defaults |
| **Discard** | Reverts unsaved form changes |

### Shared form components

- `src/components/admin/header-footer-form-fields.tsx` — `NavLinksEditor`, `ToggleField`

---

## 4. Public Site Integration

### Server loaders (cached)

| Component | File | Role |
|-----------|------|------|
| `SiteNavbar` | `src/components/sections/site-navbar.tsx` | Fetches settings, passes `header` to `Navbar` |
| `SiteFooter` | `src/components/sections/site-footer.tsx` | Fetches settings, passes `footer` + `logoText` to `Footer` |

### Client components (CMS-driven)

| Component | File | Data source |
|-----------|------|-------------|
| `Navbar` | `src/components/sections/navbar.tsx` | `header` prop + optional preview override |
| `Footer` | `src/components/sections/footer.tsx` | `footer` prop + optional preview override |

### Preview mode

- Hook: `src/hooks/use-header-footer-preview.ts`
- Admin preview writes `sessionStorage` key `hf-preview-draft`
- Public pages with `?hf-preview=1` render unsaved draft values

### Pages updated

| Page | Change |
|------|--------|
| `/` | `SiteNavbar` + `SiteFooter` |
| `/blog` | `SiteNavbar` + `SiteFooter` |
| `/blog/[slug]` | `SiteNavbar` + `SiteFooter` |
| `not-found` | `SiteNavbar` + `SiteFooter` |

**Removed hardcoded values:** logo text, nav links, footer link groups, copyright, social URLs.

---

## 5. Default Values

Defined in `src/lib/header-footer/types.ts`:

### Header defaults

| Field | Default |
|-------|---------|
| logoText | `HyperScripter` |
| navigation | Features, How It Works, Use Cases, Pricing, FAQ (anchor links) |
| ctaText | `Dashboard` |
| ctaUrl | `/dashboard` |
| showNavigation | `true` |
| showCta | `true` |

### Footer defaults

| Field | Default |
|-------|---------|
| companyName | `HyperScripter` |
| copyright | `© 2026 HyperScripter. All rights reserved.` |
| description | AI-powered TikTok script generator for creators who ship fast. |
| quickLinks | Features, How it works, Pricing, Blog, FAQ |
| privacyPolicyUrl | `/privacy` |
| termsOfServiceUrl | `/terms` |
| socialLinks.twitter | `https://twitter.com/hyperscripter` |
| Other social | Empty (icons hidden when URL blank) |
| All show* toggles | `true` |

If the database table is missing or empty, defaults are used automatically (graceful fallback).

---

## 6. File Inventory

### New files

| File |
|------|
| `supabase/header-footer-settings-schema.sql` |
| `src/lib/header-footer/types.ts` |
| `src/lib/header-footer/validation.ts` |
| `src/lib/db/header-footer-settings.ts` |
| `src/app/api/admin/header-footer/route.ts` |
| `src/app/api/header-footer/route.ts` |
| `src/app/admin/(panel)/platform/header-footer/page.tsx` |
| `src/components/admin/header-footer-form-fields.tsx` |
| `src/components/sections/site-navbar.tsx` |
| `src/components/sections/site-footer.tsx` |
| `src/hooks/use-header-footer-preview.ts` |

### Modified files

| File | Change |
|------|--------|
| `src/components/sections/navbar.tsx` | CMS-driven header props |
| `src/components/sections/footer.tsx` | CMS-driven footer props |
| `src/components/admin/sidebar.tsx` | Platform menu + Header & Footer |
| `src/app/page.tsx` | SiteNavbar / SiteFooter |
| `src/app/blog/page.tsx` | SiteNavbar / SiteFooter |
| `src/app/blog/[slug]/page.tsx` | SiteNavbar / SiteFooter |
| `src/app/not-found.tsx` | SiteNavbar / SiteFooter |

---

## 7. Setup Checklist

1. Run `supabase/header-footer-settings-schema.sql` in Supabase
2. Log in as admin → **Platform → Header & Footer**
3. Review defaults → **Save Changes** (creates DB row)
4. Open homepage — verify header/footer match saved settings
5. Use **Preview Changes** to test unsaved edits in a new tab

---

## 8. Notes

- `site_settings` (HTML snippets) remains separate — not modified
- Empty social URLs are omitted from the footer (no dead icons)
- Privacy/Terms URLs default to `/privacy` and `/terms` — create those pages or update URLs in admin
- `site-config.ts` is still used for SEO metadata; only header/footer chrome is CMS-driven
