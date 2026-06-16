# Vercel Environment Variables

**Date:** June 15, 2026  
**Scope:** Full codebase audit (`src/`, `scripts/`, `.env.example`) — no code changes.  
**Project:** HyperScripter (Next.js 15 App Router)

---

## Summary

| Category | Env vars in code | Required for launch |
|----------|------------------|---------------------|
| Auth | 3 | 1 required (`AUTH_SECRET`) |
| Supabase | 3 | 3 required |
| Stripe | 5 | 0–5 (billing optional until enabled) |
| Gemini | 1 | 1 required for AI generation* |
| Email SMTP | 0 | Configure in Admin UI (DB); `AUTH_SECRET` encrypts stored password |
| Site / URLs | 3 | 1 recommended (`NEXT_PUBLIC_APP_URL`) |
| Other | 3 | 1 pair recommended for production rate limits |

\* `GEMINI_API_KEY` can be omitted from Vercel if the admin sets the key in **Admin → Settings → AI** (stored encrypted in DB). On first boot, env key is auto-imported into the database when no DB row exists.

**Not used in code:** `API_KEY_ENCRYPTION_SECRET` (commented in `.env.example` only). Encryption uses `AUTH_SECRET` via `src/lib/crypto/api-key-encryption.ts`.

---

## Vercel deployment table (copy-paste checklist)

Set these in **Vercel → Project → Settings → Environment Variables**.

| Name | Required | Environments | Example value | Vercel scope |
|------|----------|--------------|---------------|--------------|
| `AUTH_SECRET` | **Yes** | Production, Preview | `a1b2c3…` (64+ random chars) | Server only |
| `ADMIN_EMAIL` | No | Production, Preview | `you@yourdomain.com` | Server only |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | All | `https://abcdefgh.supabase.co` | Build + Client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | All | `eyJhbGciOiJIUzI1NiIsInR5cCI6…` | Build + Client |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Production, Preview | `eyJhbGciOiJIUzI1NiIsInR5cCI6…` | Server only — **never expose to client** |
| `GEMINI_API_KEY` | **Yes*** | Production, Preview | `AIzaSy…` | Server only |
| `STRIPE_SECRET_KEY` | If billing | Production, Preview | `sk_live_…` / `sk_test_…` | Server only |
| `STRIPE_WEBHOOK_SECRET` | If billing | Production | `whsec_…` | Server only |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | No** | All | `pk_live_…` / `pk_test_…` | Build + Client |
| `STRIPE_PRICE_PRO` | If billing | Production, Preview | `price_…` | Server only |
| `STRIPE_PRICE_TEAM` | If billing | Production, Preview | `price_…` | Server only |
| `NEXT_PUBLIC_APP_URL` | **Recommended** | Production | `https://yourdomain.com` | Build + Client |
| `APP_URL` | No | Preview (optional) | `https://preview-xyz.vercel.app` | Server only |
| `UPSTASH_REDIS_REST_URL` | **Recommended** | Production | `https://us1-….upstash.io` | Server only |
| `UPSTASH_REDIS_REST_TOKEN` | **Recommended** | Production | `AX…` | Server only |

\* Or configure Gemini key in admin panel after deploy.  
\*\* Exported by `getStripePublishableKey()` but **not referenced** elsewhere in `src/` today (checkout uses Stripe Checkout server-side).

**Auto-set by Vercel (do not add manually):** `VERCEL_URL`, `NODE_ENV`

---

## 1. Auth

### `AUTH_SECRET`

| Field | Value |
|-------|-------|
| **Required** | **Yes** |
| **Example** | `k8Jx2mP9vQ4nR7wL1sT6uY0zA3bC5dE8fG1hI4jK7lM0nO3pQ6rS9tU2vW5xY8z` |
| **Purpose** | HMAC signing for session cookies; AES-256-GCM key derivation for encrypted secrets (Gemini API key, SMTP password in DB) |
| **Files** | `src/lib/auth/session-cookie.ts`, `src/lib/crypto/api-key-encryption.ts`, `src/app/debug/system/page.tsx` |

### `ADMIN_EMAIL`

| Field | Value |
|-------|-------|
| **Required** | No |
| **Example** | `admin@hyperscripter.com` |
| **Purpose** | Auto-assigns `admin` role on signup when email matches; fallback recipient for test emails |
| **Files** | `src/lib/auth/admin-email.ts`, `src/lib/auth/local-auth.ts`, `src/lib/email/send-emails.ts`, `src/app/debug/system/page.tsx` |

### `NODE_ENV`

| Field | Value |
|-------|-------|
| **Required** | No (auto-set) |
| **Example** | `production` |
| **Purpose** | Secure cookie flag, production rate-limit enforcement, dev-only error details |
| **Files** | `src/lib/auth/session-cookie.ts`, `src/lib/auth/middleware.ts`, `src/lib/referrals/cookie.ts`, `src/lib/rate-limit/store.ts`, `src/lib/supabase/server.ts`, `src/lib/team/api-error-response.ts` |

---

## 2. Supabase

### `NEXT_PUBLIC_SUPABASE_URL`

| Field | Value |
|-------|-------|
| **Required** | **Yes** |
| **Example** | `https://xyzcompany.supabase.co` |
| **Purpose** | Supabase project URL for browser client (realtime) and server client |
| **Files** | `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/app/debug/system/page.tsx`, `scripts/rls-verify.mjs` |

### `NEXT_PUBLIC_SUPABASE_ANON_KEY`

| Field | Value |
|-------|-------|
| **Required** | **Yes** |
| **Example** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…` |
| **Purpose** | Public anon key for client-side Supabase (support realtime, script sync UI gates) |
| **Files** | `src/lib/supabase/client.ts`, `src/app/debug/system/page.tsx`, `scripts/rls-verify.mjs` |

### `SUPABASE_SERVICE_ROLE_KEY`

| Field | Value |
|-------|-------|
| **Required** | **Yes** |
| **Example** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…` (service_role) |
| **Purpose** | Server-only DB access (bypasses RLS); all `createServerSupabaseClient()` calls; DB-backed rate limiting fallback |
| **Files** | `src/lib/supabase/server.ts`, `src/lib/rate-limit/store.ts`, `src/lib/team/workspace-debug.ts`, all `src/lib/db/*.ts`, `src/lib/auth/local-auth.ts`, `scripts/rls-verify.mjs`, `scripts/rate-limit-verify.mjs` |

---

## 3. Stripe

Billing is gated by `isStripeConfigured()` — all four server vars below must be set for checkout/portal/webhooks.

### `STRIPE_SECRET_KEY`

| Field | Value |
|-------|-------|
| **Required** | Yes, if billing enabled |
| **Example** | `sk_live_51AbCdE…` |
| **Purpose** | Stripe API client for checkout sessions, portal, webhooks |
| **Files** | `src/lib/stripe.ts`, `src/app/api/billing/create-checkout-session/route.ts`, `src/app/api/billing/create-portal-session/route.ts`, `src/app/api/billing/subscription/route.ts` |

### `STRIPE_WEBHOOK_SECRET`

| Field | Value |
|-------|-------|
| **Required** | Yes, if billing enabled |
| **Example** | `whsec_1a2b3c4d…` |
| **Purpose** | Verifies Stripe webhook signatures (`/api/stripe/webhook`) |
| **Files** | `src/lib/stripe.ts`, `src/app/api/stripe/webhook/route.ts` |

### `STRIPE_PRICE_PRO`

| Field | Value |
|-------|-------|
| **Required** | Yes, if billing enabled |
| **Example** | `price_1AbCdEfGhIjKlMnO` |
| **Purpose** | Stripe Price ID for Pro plan checkout and subscription mapping |
| **Files** | `src/lib/stripe.ts` |

### `STRIPE_PRICE_TEAM`

| Field | Value |
|-------|-------|
| **Required** | Yes, if billing enabled |
| **Example** | `price_1XyZaBcDeFgHiJkL` |
| **Purpose** | Stripe Price ID for Team plan checkout and subscription mapping |
| **Files** | `src/lib/stripe.ts` |

### `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

| Field | Value |
|-------|-------|
| **Required** | No (unused in current UI) |
| **Example** | `pk_live_51AbCdE…` |
| **Purpose** | Exposed via `getStripePublishableKey()` for future client-side Stripe.js; not consumed elsewhere today |
| **Files** | `src/lib/stripe.ts` |

---

## 4. Gemini

### `GEMINI_API_KEY`

| Field | Value |
|-------|-------|
| **Required** | **Yes** for AI script generation (unless set in admin DB) |
| **Example** | `AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz` |
| **Purpose** | Google Gemini API key; auto-imported to `ai_settings` table on first run; fallback if no DB key |
| **Files** | `src/lib/db/ai-settings.ts`, `src/lib/gemini-client.ts`, `src/app/api/generate/route.ts`, `src/app/debug/system/page.tsx` |

**Alternative:** Admin → Settings → AI stores encrypted key in Supabase (`src/app/api/admin/ai/route.ts`). Env var is optional after that.

---

## 5. Email SMTP

**No SMTP environment variables.** Email is configured in the database via **Admin → Platform → Email Settings**.

| What | How |
|------|-----|
| SMTP host, port, username, password | Stored in `email_settings` table |
| Password encryption | Uses `AUTH_SECRET` → `src/lib/db/email-settings.ts`, `src/lib/crypto/api-key-encryption.ts` |
| Transport | `src/lib/email/transport.ts`, `src/lib/email/send-emails.ts` |
| Admin UI | `src/app/admin/(panel)/platform/email-settings/page.tsx` |
| API routes | `src/app/api/admin/email-settings/*` |

**Prerequisite for email:** `AUTH_SECRET` must be set (encrypts SMTP password at rest). Run `supabase/email-schema.sql` before configuring SMTP in admin.

---

## 6. Site Settings

Platform branding, SEO, favicon, header/footer, and analytics are **database-driven** (`site_settings`, `seo_settings`, etc.) — not environment variables.

URL-related variables control links in emails, billing redirects, and team invites:

### `NEXT_PUBLIC_APP_URL`

| Field | Value |
|-------|-------|
| **Required** | **Recommended** (required for correct production links) |
| **Example** | `https://hyperscripter.com` |
| **Purpose** | Canonical public app URL for emails, Stripe return URLs, team invite links |
| **Files** | `src/lib/email/get-app-url.ts`, `src/lib/stripe.ts`, `src/app/api/team/members/route.ts` |

### `APP_URL`

| Field | Value |
|-------|-------|
| **Required** | No |
| **Example** | `https://hyperscripter.com` |
| **Purpose** | Server-only fallback for `getAppUrl()` when `NEXT_PUBLIC_APP_URL` is unset |
| **Files** | `src/lib/email/get-app-url.ts`, `scripts/rate-limit-verify.mjs` |

### `VERCEL_URL`

| Field | Value |
|-------|-------|
| **Required** | No (auto-set by Vercel) |
| **Example** | `hyperscripter.vercel.app` |
| **Purpose** | Fallback base URL when `NEXT_PUBLIC_APP_URL` / `APP_URL` are unset |
| **Files** | `src/lib/email/get-app-url.ts`, `src/lib/stripe.ts` |

**Hardcoded fallback (not env):** `src/lib/site-config.ts` → `url: "https://hyperscripter.com"` when no URL env vars are set.

---

## 7. Other

### `UPSTASH_REDIS_REST_URL`

| Field | Value |
|-------|-------|
| **Required** | **Recommended** for production rate limiting |
| **Example** | `https://us1-capable-koi-12345.upstash.io` |
| **Purpose** | Upstash Redis REST endpoint for distributed rate limits (auth, generate, etc.) |
| **Files** | `src/lib/rate-limit/store.ts`, `scripts/rate-limit-verify.mjs` |

### `UPSTASH_REDIS_REST_TOKEN`

| Field | Value |
|-------|-------|
| **Required** | **Recommended** (pair with URL above) |
| **Example** | `AX…` |
| **Purpose** | Auth token for Upstash Redis REST API |
| **Files** | `src/lib/rate-limit/store.ts`, `scripts/rate-limit-verify.mjs` |

**Rate-limit fallback (no Upstash):** Run `supabase/rate-limit-schema.sql` — uses `SUPABASE_SERVICE_ROLE_KEY` for DB-backed limits. In production without either Upstash or DB schema, `checkRateLimit()` throws.

### `API_KEY_ENCRYPTION_SECRET`

| Field | Value |
|-------|-------|
| **Required** | **No — not used** |
| **Example** | — |
| **Purpose** | Listed only in `.env.example` comment; code uses `AUTH_SECRET` instead |
| **Files** | `.env.example` only |

---

## Vercel setup notes

### Minimum production set (core app)

```
AUTH_SECRET
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GEMINI_API_KEY
NEXT_PUBLIC_APP_URL
```

### Add for billing

```
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_PRO
STRIPE_PRICE_TEAM
```

Configure Stripe webhook endpoint: `https://<your-domain>/api/stripe/webhook`

### Add for production rate limits (pick one)

**Option A — Upstash (recommended):**
```
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

**Option B — Supabase:** Run `supabase/rate-limit-schema.sql` (uses existing `SUPABASE_SERVICE_ROLE_KEY`).

### Post-deploy (admin UI, not env)

| Task | Where |
|------|-------|
| SMTP / transactional email | Admin → Platform → Email Settings |
| Site name, favicon, head/body snippets | Admin → Platform → Site Settings |
| SEO / OG image | Admin → Platform → SEO |
| Gemini key (alternative to env) | Admin → Settings → AI |

### Security reminders

- Never prefix secrets with `NEXT_PUBLIC_`.
- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — server-only.
- Rotate `AUTH_SECRET` only with a plan to invalidate all sessions and re-encrypt DB secrets.
- Use **Production** vs **Preview** Stripe keys appropriately per Vercel environment.

---

## Reference: `.env.example`

Local development template at project root mirrors the variables above. Copy to `.env.local` and fill in values.

---

*Audit method: ripgrep for `process.env.*` across `src/` and `scripts/`; cross-checked with `.env.example` and runtime call sites.*
