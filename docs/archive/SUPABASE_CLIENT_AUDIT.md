# Supabase Client Audit

**Date:** June 13, 2026  
**Application:** HyperScripter  
**Scope:** Every Supabase client instantiation and import path

---

## Executive Summary

| Metric | Result |
|--------|--------|
| Direct `createClient()` call sites | 2 (`src/lib/supabase.ts` only) |
| Browser client usages | 2 hooks (correct anon key) |
| Server client usages | 21 modules via `createServerSupabaseClient()` |
| Service role in browser bundle | **Not leaked** (env var not `NEXT_PUBLIC_`) |
| `createServerSupabaseClient` in browser bundle | **Yes** — shipped via shared `@/lib/supabase` module |
| `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` | **Set** |
| Overall verdict | **Conditionally safe** — fix module split + remove anon fallback |

### Requirements Checklist

| Requirement | Status |
|-------------|--------|
| Server-only ops use `SUPABASE_SERVICE_ROLE_KEY` | ⚠️ Intended, but **falls back to anon** if missing |
| Browser uses only `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Hooks use `createBrowserSupabaseClient()` |
| Service role never in React/hooks/browser bundles | ✅ Key not inlined; ⚠️ server factory code is bundled |
| No client component imports `@/lib/db/*` | ✅ All DB access via API routes or Server Components |

---

## Client Factories

### `src/lib/supabase.ts`

| Export | Key used | Runtime | Verdict | Required fix |
|--------|----------|---------|---------|--------------|
| `createBrowserSupabaseClient()` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser / SSR client | **Safe** | Move to `src/lib/supabase/client.ts` |
| `createServerSupabaseClient()` | `SUPABASE_SERVICE_ROLE_KEY` ?? anon fallback | Server | **Unsafe** | Require service role in production; move to `src/lib/supabase/server.ts` with `import 'server-only'` |
| `createSupabaseClient()` (deprecated) | Same as server | Server | **Unsafe** | Remove usages; delete export |
| `isSupabaseConfigured()` | URL + anon key only | Both | **Safe logic** | Move to `client.ts` to avoid bundling server factory |
| `getSupabaseServiceKey()` (private) | `SUPABASE_SERVICE_ROLE_KEY` | Server | **Safe** (not exported) | Keep private inside `server.ts` |

**Critical code path:**

```typescript
// src/lib/supabase.ts — anon fallback silently downgrades server to public key
const key = getSupabaseServiceKey() ?? getSupabaseAnonKey();
```

If `SUPABASE_SERVICE_ROLE_KEY` is unset in production, every API route operates as the anon role — equivalent to no RLS protection.

---

## Browser / Client Files

Files with `"use client"` or imported into client bundles.

| File path | Client type | Key | Safe? | Required fix |
|-----------|-------------|-----|-------|--------------|
| `src/hooks/use-support-realtime.ts` | `createBrowserSupabaseClient()` | Anon | **Safe** | None for key usage. Realtime depends on RLS (apply `rls-production.sql`). |
| `src/hooks/use-support-unread.ts` | `createBrowserSupabaseClient()` | Anon | **Safe** | Data fetched via `/api/support/unread`; anon used only for `postgres_changes` subscription. |
| `src/components/dashboard/script-generator-form.tsx` | `isSupabaseConfigured` from `@/lib/supabase` | N/A | **Risk** | Import from `@/lib/supabase/client` after split — avoids bundling `createServerSupabaseClient`. |
| `src/components/dashboard/script-detail-view.tsx` | `isSupabaseConfigured` | N/A | **Risk** | Same as above. |
| `src/components/dashboard/script-history.tsx` | `isSupabaseConfigured` | N/A | **Risk** | Same as above. |

### Client components using hooks (indirect)

| File path | Indirect Supabase usage | Safe? |
|-----------|-------------------------|-------|
| `src/components/dashboard/support-view.tsx` | `useSupportTicketRealtime` → anon | **Safe** |
| `src/components/dashboard/sidebar.tsx` | `useSupportUnread` → anon | **Safe** |
| `src/components/admin/sidebar.tsx` | `useSupportUnread` → anon | **Safe** |
| `src/app/admin/(panel)/support/page.tsx` | `useSupportTicketRealtime` → anon | **Safe** |

**No React component imports `createServerSupabaseClient`, `@/lib/db/*`, or `SUPABASE_SERVICE_ROLE_KEY` directly.**

---

## Server Database Layer

All files use `createServerSupabaseClient()` → service role when configured.  
**Verdict:** Safe at runtime **if** `SUPABASE_SERVICE_ROLE_KEY` is set. Add `import 'server-only'` to each.

| File path | Client type | Safe? | Required fix |
|-----------|-------------|-------|--------------|
| `src/lib/db/users.ts` | Server (service role) | **Safe*** | Add `server-only`; ensure service role in prod |
| `src/lib/db/scripts.ts` | Server | **Safe*** | Same |
| `src/lib/db/subscriptions.ts` | Server | **Safe*** | Same |
| `src/lib/db/usage.ts` | Server | **Safe*** | Same |
| `src/lib/db/blog-posts.ts` | Server | **Safe*** | Same |
| `src/lib/db/legal-pages.ts` | Server | **Safe*** | Same |
| `src/lib/db/workspaces.ts` | Server | **Safe*** | Same |
| `src/lib/db/support.ts` | Server | **Safe*** | Same |
| `src/lib/db/referrals.ts` | Server | **Safe*** | Same |
| `src/lib/db/affiliate-payment-methods.ts` | Server | **Safe*** | Same |
| `src/lib/db/password-reset.ts` | Server | **Safe*** | Same |
| `src/lib/db/email-settings.ts` | Server | **Safe*** | Same |
| `src/lib/db/email-logs.ts` | Server | **Safe*** | Same |
| `src/lib/db/ai-settings.ts` | Server | **Safe*** | Same |
| `src/lib/db/site-settings.ts` | Server | **Safe*** | Same |
| `src/lib/db/header-footer-settings.ts` | Server | **Safe*** | Same |
| `src/lib/db/admin-stats.ts` | Server | **Safe*** | Same |

\*Conditional on service role being configured and anon fallback removed.

---

## Server Libraries (non-`db/`)

| File path | Client type | Safe? | Required fix |
|-----------|-------------|-------|--------------|
| `src/lib/auth/local-auth.ts` | `createServerSupabaseClient()` (signup path) | **Safe*** | Prefer routing all DB through `@/lib/db/users`; add `server-only` |
| `src/lib/team/workspace-debug.ts` | `createServerSupabaseClient()` | **Safe*** | Debug-only; block route in production (already in middleware) |
| `src/lib/referrals/reconcile-commissions.ts` | `createServerSupabaseClient()` | **Safe*** | Add `server-only` |
| `src/lib/auth/session.ts` | Indirect via `getUserById` → server client | **Safe*** | Add `server-only` to session + db |
| `src/lib/account/db-account-service.ts` | Indirect via `@/lib/db/users` | **Safe*** | Add `server-only` |
| `src/lib/gemini-client.ts` | Indirect via `@/lib/db/ai-settings` | **Safe*** | Add `server-only` |
| `src/lib/email/transport.ts` | Indirect via db email modules | **Safe*** | Add `server-only` |
| `src/lib/billing/sync-subscription.ts` | Indirect via db modules | **Safe*** | Add `server-only` |
| `src/lib/referrals/process-commission.ts` | Indirect via db modules | **Safe*** | Add `server-only` |
| `src/lib/referrals/process-signup.ts` | Indirect via db modules | **Safe*** | Add `server-only` |
| `src/lib/seo-settings/server.ts` | Indirect via `getSiteSettings` | **Safe*** | Already server-scoped by name; add `server-only` |

---

## Server Components (RSC)

These import `@/lib/db/*` directly — correct pattern (never sent to browser).

| File path | DB import | Client type | Safe? |
|-----------|-----------|-------------|-------|
| `src/app/layout.tsx` | `getSiteSettings` | Server RSC | **Safe** |
| `src/components/sections/site-navbar.tsx` | `getHeaderFooterSettings` | Server RSC | **Safe** |
| `src/components/sections/site-footer.tsx` | `getHeaderFooterSettings` | Server RSC | **Safe** |
| `src/app/legal/[slug]/page.tsx` | `getPublishedLegalPageBySlug` | Server RSC | **Safe** |
| `src/app/debug/system/page.tsx` | `isSupabaseConfigured` | Server page | **Safe** |

---

## API Routes

All **67** route handlers under `src/app/api/**` access Supabase **indirectly** through `@/lib/db/*`, `@/lib/auth/local-auth`, or `@/lib/account/*`. None import `createBrowserSupabaseClient` or reference `SUPABASE_SERVICE_ROLE_KEY` directly.

| Pattern | Count | Client type | Safe? |
|---------|-------|-------------|-------|
| `import … from '@/lib/db/*'` | ~55 routes | Server (service role) | **Safe*** |
| `import { isSupabaseConfigured } from '@/lib/supabase'` | 8 routes | Server check only | **Safe** |
| `import { signupWithEmailPassword } from '@/lib/auth/local-auth'` | 2 routes | Server | **Safe*** |

Representative routes: `/api/generate`, `/api/scripts`, `/api/support/*`, `/api/billing/*`, `/api/admin/*`, `/api/auth/*`, `/api/team/*`, `/api/referrals`.

---

## Types Only (no client)

| File path | Imports | Safe? |
|-----------|---------|-------|
| `src/lib/supabase/types.ts` | Type definitions only | **Safe** |
| `src/lib/db/mappers.ts` | Types from `@/lib/supabase/types` | **Safe** |

---

## Scripts & Tooling

| File path | Client type | Key | Safe? | Required fix |
|-----------|-------------|-----|-------|--------------|
| `scripts/rls-verify.mjs` | Direct `createClient()` | Anon (from `.env.local`) | **Safe** | Dev/CI only — never commit service role to this script |

---

## Bundle Analysis

Inspected `.next/static/chunks/app/dashboard/layout.js` (client bundle):

| Finding | Risk |
|---------|------|
| `createServerSupabaseClient` exported in client chunk | **Medium** — callable in browser with anon fallback |
| `SUPABASE_SERVICE_ROLE_KEY` value inlined | **Not found** — Next.js correctly excludes non-`NEXT_PUBLIC_` env vars |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` inlined | **Expected** — public by design |
| `@supabase/auth-js` `GoTrueAdminApi` in bundle | **Low** — library code, not used with service key |

**Conclusion:** The service role **secret is not leaked** to the browser today. The **server client factory** is bundled alongside the browser client due to a shared module — a structural risk if env handling changes.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│  use-support-realtime.ts  ──► createBrowserSupabaseClient() │
│  use-support-unread.ts    ──► createBrowserSupabaseClient() │
│       │                         (anon key only)             │
│       └── realtime subscriptions + API fetch for data       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   NEXT.JS SERVER                            │
│  API Routes / RSC / Server Actions                          │
│       │                                                     │
│       ▼                                                     │
│  @/lib/db/*  ──► createServerSupabaseClient()               │
│                       │                                     │
│                       ▼                                     │
│              SUPABASE_SERVICE_ROLE_KEY                      │
│              (bypasses RLS)                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Required Fixes (Priority Order)

### P0 — Critical

| # | Fix | Files |
|---|-----|-------|
| 1 | **Remove anon fallback** in `createServerSupabaseClient` — throw or log fatal in production when `SUPABASE_SERVICE_ROLE_KEY` is missing | `src/lib/supabase.ts` |
| 2 | **Set `SUPABASE_SERVICE_ROLE_KEY`** in Vercel production + preview environments | Vercel env dashboard |
| 3 | **Apply `supabase/rls-production.sql`** so anon key cannot read private data even if misused | Supabase SQL Editor |

### P1 — High

| # | Fix | Files |
|---|-----|-------|
| 4 | **Split client module** — `src/lib/supabase/client.ts` (anon + `isSupabaseConfigured`) and `src/lib/supabase/server.ts` (`createServerSupabaseClient` + `import 'server-only'`) | New files; update imports |
| 5 | **Add `import 'server-only'`** to every `src/lib/db/*.ts` file | 17 db modules |
| 6 | **Update client components** to import from `@/lib/supabase/client` instead of `@/lib/supabase` | 3 dashboard components |

### P2 — Medium

| # | Fix | Files |
|---|-----|-------|
| 7 | **Remove deprecated** `createSupabaseClient()` export | `src/lib/supabase.ts` |
| 8 | **Consolidate** direct `createServerSupabaseClient()` in `local-auth.ts` to use `@/lib/db/users` only | `src/lib/auth/local-auth.ts` |
| 9 | **Replace browser realtime** with API polling if RLS blocks anon subscriptions post-hardening | `use-support-realtime.ts`, `use-support-unread.ts` |

---

## Recommended `server.ts` Pattern

```typescript
// src/lib/supabase/server.ts
import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function createServerSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for server operations');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
```

```typescript
// src/lib/supabase/client.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function createBrowserSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
```

---

## Verification Commands

```bash
# 1. Confirm service role is set locally
node -e "require('fs').readFileSync('.env.local','utf8').split('\n').filter(l=>l.startsWith('SUPABASE_SERVICE_ROLE'))"

# 2. After module split — ensure service role not in client bundles
npm run build
# Search .next/static for your service role JWT — should return zero matches

# 3. RLS + anon access test
node scripts/rls-verify.mjs
```

---

## Conclusion

HyperScripter follows the **correct high-level pattern**: browser hooks use the anon key for realtime only; all data mutations and reads go through server API routes using the service role. No service role secret is exposed in client bundles.

The two gaps to close before production:

1. **Anon fallback** in `createServerSupabaseClient()` silently degrades server security.
2. **Shared `supabase.ts` module** bundles server factory code into client chunks — split modules and add `server-only` guards.

With `SUPABASE_SERVICE_ROLE_KEY` now set in `.env.local` and RLS hardened, the client architecture is production-ready after the P0–P1 fixes above.
