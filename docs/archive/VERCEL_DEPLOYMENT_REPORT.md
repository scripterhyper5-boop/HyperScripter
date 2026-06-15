# Vercel Deployment Report

**Date:** June 15, 2026  
**Application:** HyperScripter  
**Next.js:** 15.5.19  
**Audit type:** Production build + deployment readiness (no code changes)

---

## Executive Summary

| Check | Status |
|-------|--------|
| `npm run build` | ✅ **Passes** (exit code 0) |
| TypeScript compile | ✅ No errors |
| ESLint during build | ⚠️ **6 warnings** (non-blocking) |
| Vercel framework detection | ✅ Next.js App Router |
| Critical blockers before go-live | **4** (env vars, Supabase migrations, production URLs, Stripe webhook) |
| Conditional blockers | **3** (rate limiting, file uploads, function timeout) |

**Verdict:** **Ready to deploy to Vercel** after environment variables are configured and Supabase migrations are applied. Build succeeds; no compile errors.

---

## 1. Production Build Audit

### Command

```bash
npm run build
```

### Result

| Metric | Value |
|--------|-------|
| Exit code | `0` |
| Compile time | ~2.2 min |
| Static pages | 109 generated |
| Middleware size | 34.7 kB |
| Shared First Load JS | 103 kB |
| Largest page (First Load JS) | `/admin/blog` — 479 kB |
| `/api/generate` route | ƒ Dynamic (server-rendered on demand) |

### Build warnings (non-blocking)

ESLint reported **6 unused-variable warnings** during build:

| File | Warning |
|------|---------|
| `src/app/api/support/tickets/route.ts` | `getUserSupportUnreadCount` unused |
| `src/components/account/payout-settings-form.tsx` | `ArrowLeft` unused |
| `src/components/admin/sidebar.tsx` | `Bot` unused |
| `src/hooks/use-team-fetch.ts` | `options` unused |
| `src/lib/team/permissions.ts` | `_role` unused (×2) |

These do **not** fail the build. Vercel will deploy successfully.

### Build-time log noise (informational)

During static page generation, `[getUserServerSession] Error: Dynamic server usage` appears for admin routes that call `cookies()`. This is **expected** — those routes are correctly marked dynamic (`ƒ`) in the build output. Not a deployment blocker.

---

## 2. `next.config.ts`

**File:** `next.config.ts` (no `next.config.js`)

| Setting | Value | Vercel impact |
|---------|-------|---------------|
| `reactStrictMode` | `true` | ✅ Standard |
| `poweredByHeader` | `false` | ✅ Security |
| `redirects()` | `/privacy`, `/terms`, `/cookies`, `/refund` → `/legal/*` | ✅ Works on Vercel |
| `headers()` | X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy | ✅ Applied to all routes |
| `images` | **Not configured** | See §8 — not required today |

**Missing (optional, not blockers):**

- No `output: 'standalone'` — Vercel uses its own Next.js builder; not needed
- No `experimental` flags — good for stability

---

## 3. `package.json`

| Field | Value | Notes |
|-------|-------|-------|
| `build` script | `next build` | ✅ Vercel default |
| `start` script | `next start` | N/A on Vercel (uses serverless) |
| `engines` | **Not set** | Vercel uses Node 20.x by default — OK |
| `sharp` | `^0.35.1` | ✅ Available on Vercel if `next/image` is added later |
| Key deps | `next@15.3.3`, `react@19`, `stripe`, `@supabase/supabase-js`, `@google/genai` | All compatible with Vercel Node runtime |

**Vercel project settings (recommended):**

| Setting | Value |
|---------|-------|
| Framework Preset | Next.js |
| Build Command | `npm run build` |
| Output Directory | *(leave default)* |
| Install Command | `npm install` |
| Node.js Version | 20.x |

---

## 4. `middleware.ts`

**Files:** `src/middleware.ts` → `src/lib/auth/middleware.ts`

| Check | Status |
|-------|--------|
| Edge-compatible | ✅ Uses `NextResponse`, cookies, redirects only |
| Matcher excludes static assets | ✅ CSS, JS, images, fonts excluded |
| API routes covered | ✅ `/(api|trpc)(.*)` |
| `/debug` and `/test` blocked in production | ✅ Redirect to `/` when `NODE_ENV === 'production'` |
| Auth redirects | ✅ Dashboard/admin protected; login/signup public |
| Referral cookie on `/signup?ref=` | ✅ `secure: true` in production |

**Middleware size:** 34.7 kB (within Vercel Edge limits).

**Note:** Middleware checks cookie **presence only**; HMAC verification happens in server routes/layouts — correct for Edge.

---

## 5. Environment Variables

### Required for production (Vercel → Settings → Environment Variables)

| Variable | Scope | Purpose | If missing |
|----------|-------|---------|------------|
| `AUTH_SECRET` | Server | Session HMAC signing, AI key encryption | Auth fails; sessions invalid |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL | DB/auth broken |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | All server DB operations | **Throws in production** |
| `GEMINI_API_KEY` | Server | Script generation (or configure via admin AI settings) | Generation fails |
| `NEXT_PUBLIC_APP_URL` | Public | Canonical URL (Stripe redirects, metadata) | Falls back to `VERCEL_URL` or localhost |
| `APP_URL` | Server | Email links, password reset URLs | Falls back to `VERCEL_URL` or `siteConfig.url` |

### Required for billing

| Variable | Scope | Purpose |
|----------|-------|---------|
| `STRIPE_SECRET_KEY` | Server | Stripe API (`sk_live_...` in prod) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Public | Client checkout (`pk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Server | Webhook signature verification |
| `STRIPE_PRICE_PRO` | Server | Pro plan price ID |
| `STRIPE_PRICE_TEAM` | Server | Team plan price ID |

### Recommended

| Variable | Scope | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Browser Supabase client (support realtime hooks) |
| `UPSTASH_REDIS_REST_URL` | Server | Production rate limiting (preferred) |
| `UPSTASH_REDIS_REST_TOKEN` | Server | Production rate limiting |
| `ADMIN_EMAIL` | Server | Auto-assign admin role on signup |

### Optional

| Variable | Notes |
|----------|-------|
| `API_KEY_ENCRYPTION_SECRET` | Listed in checklist but **not used** — encryption uses `AUTH_SECRET` via `src/lib/crypto/api-key-encryption.ts` |

### Vercel auto-provided

| Variable | Used by |
|----------|---------|
| `VERCEL_URL` | `getAppBaseUrl()`, `getAppUrl()` fallback (`*.vercel.app`) |

### `.env.example` coverage

✅ All critical variables are documented in `.env.example`.

**⚠️ Production URL blocker:** Set both `NEXT_PUBLIC_APP_URL` and `APP_URL` to your **custom domain** (e.g. `https://hyperscripter.com`), not `http://localhost:3000`. Required for:

- Stripe checkout success/cancel URLs
- Password reset emails
- Referral links

---

## 6. Stripe Configuration

| Check | Status |
|-------|--------|
| `getStripe()` | Requires `STRIPE_SECRET_KEY` |
| `isStripeConfigured()` | Checks secret, webhook secret, both price IDs |
| `getAppBaseUrl()` | Uses `NEXT_PUBLIC_APP_URL` → `VERCEL_URL` → localhost |
| Webhook route | `POST /api/stripe/webhook` |
| Webhook runtime | `export const runtime = "nodejs"` ✅ (required for raw body) |

### Vercel + Stripe setup checklist

1. Use **live** keys in Production env (`sk_live_`, `pk_live_`)
2. Create Stripe webhook endpoint:
   ```
   https://YOUR_DOMAIN/api/stripe/webhook
   ```
3. Subscribe to events (minimum):
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook signing secret → `STRIPE_WEBHOOK_SECRET` in Vercel
5. Set `STRIPE_PRICE_PRO` and `STRIPE_PRICE_TEAM` to **live** price IDs

**Blocker if billing enabled:** Webhook must be configured before paid upgrades sync to the database.

---

## 7. Supabase Configuration

| Layer | File | Key env vars |
|-------|------|--------------|
| Server (all DB) | `src/lib/supabase/server.ts` | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| Browser | `src/lib/supabase/client.ts` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

### Production behavior

- **Service role required:** `createServerSupabaseClient()` throws in production if `SUPABASE_SERVICE_ROLE_KEY` is missing (no dev fallback).
- **Anon key optional:** Server never uses anon key. Client returns `null` if anon key missing — breaks support realtime hooks only.
- **RLS:** Service role bypasses RLS. Run `supabase/rls-production.sql` before go-live.

### SQL migrations to run (Supabase SQL editor)

| Order | File | Required |
|-------|------|----------|
| 1 | `supabase/schema.sql` | ✅ |
| 2 | `supabase/email-schema.sql` | ✅ |
| 3 | `supabase/ai-settings.sql` | ✅ |
| 4 | `supabase/referral-schema.sql` | ✅ |
| 5 | `supabase/support-schema.sql` | ✅ |
| 6 | `supabase/site-settings-schema.sql` | ✅ |
| 7 | `supabase/header-footer-settings-schema.sql` | ✅ |
| 8 | `supabase/rate-limit-schema.sql` | ⚠️ If not using Upstash |
| 9 | `supabase/rls-production.sql` | ✅ Critical |
| 10 | `supabase/team-workspace.sql` | If using team features |

**Blocker:** Without migrations + service role key, the app will not function in production.

---

## 8. Image Domains

| Check | Result |
|-------|--------|
| `next/image` usage | **None** — app does not import `next/image` |
| `images.remotePatterns` in config | **Not configured** — not needed today |
| Static images | Served from `/public` (`logo.svg`, `/uploads/favicon/*`, `/uploads/seo/*`) |
| TipTap images | `@tiptap/extension-image` (not Next Image) |

**No `images.domains` configuration required** for current codebase.

**⚠️ Future note:** If you add `next/image` with external URLs (e.g. Supabase Storage CDN), add:

```ts
images: {
  remotePatterns: [
    { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
  ],
},
```

---

## 9. Build Output Summary

### Route types

| Symbol | Count (approx.) | Meaning |
|--------|-----------------|---------|
| ○ Static | Marketing, auth forms, dashboard shells | Prerendered |
| ● SSG | `/blog/[slug]` | `generateStaticParams` |
| ƒ Dynamic | Admin panel, APIs, `/legal/[slug]` | Server-rendered on demand |

### API routes (all dynamic ƒ)

60 API route handlers under `src/app/api/**` — all compatible with Vercel serverless functions.

### Notable routes

| Route | Runtime | Notes |
|-------|---------|-------|
| `/api/stripe/webhook` | `nodejs` | Raw body required ✅ |
| `/api/generate` | Default (nodejs) | Gemini call — see timeout note below |
| `/api/debug/team` | Default | Accessible if authenticated — consider restricting |

### Function timeout risk

`/api/generate` calls Google Gemini with no `export const maxDuration` set.

| Vercel plan | Default timeout | Risk |
|-------------|-----------------|------|
| Hobby | 10s | ⚠️ Generation may timeout on slow responses |
| Pro | 60s (configurable up to 300s) | ✅ Lower risk |

**Recommendation (non-blocking):** Add `export const maxDuration = 60` to `/api/generate` on Pro plan, or upgrade from Hobby.

---

## 10. Vercel-Specific Blockers & Warnings

### 🔴 Critical blockers (must fix before go-live)

| # | Blocker | Fix |
|---|---------|-----|
| 1 | **Environment variables not set on Vercel** | Add all required vars in Project → Settings → Environment Variables (Production) |
| 2 | **`SUPABASE_SERVICE_ROLE_KEY` missing** | App throws on every server DB call in production |
| 3 | **Supabase migrations not applied** | Run SQL files in order (see §7) |
| 4 | **`NEXT_PUBLIC_APP_URL` / `APP_URL` still localhost** | Set to `https://your-production-domain.com` |

### 🟠 High priority (before billing / scale)

| # | Issue | Fix |
|---|-------|-----|
| 5 | **Stripe webhook not registered** | Point to `https://YOUR_DOMAIN/api/stripe/webhook` |
| 6 | **Rate limiting** | Set Upstash Redis env vars OR run `rate-limit-schema.sql` |
| 7 | **GitHub code not pushed** | Push `main` to GitHub before connecting Vercel (auth issue from prior session) |

### 🟡 Medium priority (post-deploy)

| # | Issue | Impact |
|---|-------|--------|
| 8 | **Ephemeral filesystem** | Favicon/OG uploads write to `public/uploads/` via `fs` — **will not persist** on Vercel serverless. Pre-committed assets in `public/` work; new admin uploads are lost on cold start. Migrate to Supabase Storage or Vercel Blob for persistence. |
| 9 | **`/api/debug/team`** | Not blocked by middleware (only `/debug` pages are). Returns workspace debug info to authenticated users. |
| 10 | **ESLint warnings** | Cosmetic; clean up in a follow-up PR |

### 🟢 Non-issues

| Item | Status |
|------|--------|
| `vercel.json` | Not required — Next.js auto-detected |
| Image domain config | Not required (no `next/image`) |
| Edge middleware | Compatible |
| `sharp` dependency | Present; Vercel supports it |
| Debug pages `/debug/*` | Blocked in production via middleware ✅ |

---

## 11. Vercel Deployment Steps

### 1. Push code to GitHub

```powershell
git push -u origin main
```

*(Resolve GitHub auth as `scripterhyper5-boop` — see `GITHUB_PUSH_REPORT.md`)*

### 2. Import project in Vercel

1. [vercel.com/new](https://vercel.com/new) → Import `scripterhyper5-boop/HyperScripter`
2. Framework: **Next.js** (auto-detected)
3. Root directory: `.` (default)

### 3. Add environment variables

Copy from `.env.local` → Vercel **Production** environment.  
**Do not** commit `.env.local`.

Minimum set:

```
AUTH_SECRET
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GEMINI_API_KEY
NEXT_PUBLIC_APP_URL
APP_URL
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_PRO
STRIPE_PRICE_TEAM
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
ADMIN_EMAIL
```

### 4. Deploy

Click **Deploy**. Build command `npm run build` should pass (verified locally).

### 5. Post-deploy

| Task | Action |
|------|--------|
| Custom domain | Vercel → Domains → add production domain |
| Update env URLs | Set `NEXT_PUBLIC_APP_URL` and `APP_URL` to custom domain |
| Stripe webhook | Update endpoint URL to production domain |
| Supabase | Confirm migrations applied; enable backups |
| Smoke test | Run `LAUNCH_SMOKE_TEST.md` against production URL |

---

## 12. Environment Variable Quick Reference (for Vercel dashboard)

Copy-paste checklist:

```
[ ] AUTH_SECRET
[ ] NEXT_PUBLIC_SUPABASE_URL
[ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
[ ] SUPABASE_SERVICE_ROLE_KEY
[ ] GEMINI_API_KEY
[ ] NEXT_PUBLIC_APP_URL=https://your-domain.com
[ ] APP_URL=https://your-domain.com
[ ] STRIPE_SECRET_KEY
[ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
[ ] STRIPE_WEBHOOK_SECRET
[ ] STRIPE_PRICE_PRO
[ ] STRIPE_PRICE_TEAM
[ ] UPSTASH_REDIS_REST_URL
[ ] UPSTASH_REDIS_REST_TOKEN
[ ] ADMIN_EMAIL
```

---

## 13. Sign-Off

| Audit item | Result |
|------------|--------|
| `next.config.ts` | ✅ Ready |
| `package.json` | ✅ Ready |
| `middleware.ts` | ✅ Ready |
| Environment variables documented | ✅ `.env.example` + this report |
| Stripe configuration | ✅ Ready (pending live keys + webhook) |
| Supabase configuration | ✅ Ready (pending migrations + service role) |
| Image domains | ✅ N/A (not used) |
| `npm run build` | ✅ **Succeeds** (6 ESLint warnings only) |
| Ready for Vercel import | ✅ **Yes**, after env vars + DB setup |

**Overall:** Conditional go — deploy to Vercel after configuring production environment variables, applying Supabase migrations, and setting production URLs.
