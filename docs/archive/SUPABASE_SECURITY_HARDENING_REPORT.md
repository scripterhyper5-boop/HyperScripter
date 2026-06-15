# Supabase Security Hardening Report

**Date:** June 13, 2026  
**Application:** HyperScripter  
**Source audit:** `SUPABASE_CLIENT_AUDIT.md`

---

## Summary

All Priority 1 security fixes from the Supabase client audit have been implemented. Server database access now **requires** the service role key with no anon fallback. Client and server Supabase modules are split, and ESLint blocks accidental server DB imports in client code.

| Check | Result |
|-------|--------|
| Anon fallback removed | ✅ |
| Client/server module split | ✅ |
| `server-only` on all `src/lib/db/*` | ✅ (18/18 files) |
| ESLint client import protection | ✅ |
| Production build | ✅ Pass |
| Service role in client bundle | ✅ Not found |
| `createServerSupabaseClient` in client bundle | ✅ Not found |
| RLS anon access to `users` | ✅ DENIED (0 rows) |

---

## Files Changed

### New files

| File | Purpose |
|------|---------|
| `src/lib/supabase/client.ts` | Browser-safe anon client + `isSupabaseConfigured()` |
| `src/lib/supabase/server.ts` | Service-role-only server client + `isSupabaseServerConfigured()` |
| `SUPABASE_SECURITY_HARDENING_REPORT.md` | This report |

### Core Supabase module

| File | Change |
|------|--------|
| `src/lib/supabase.ts` | Reduced to client-safe barrel (types + client exports only) |

### Database layer (`import "server-only"` + `@/lib/supabase/server`)

| File |
|------|
| `src/lib/db/admin-stats.ts` |
| `src/lib/db/affiliate-payment-methods.ts` |
| `src/lib/db/ai-settings.ts` |
| `src/lib/db/blog-posts.ts` |
| `src/lib/db/email-logs.ts` |
| `src/lib/db/email-settings.ts` |
| `src/lib/db/header-footer-settings.ts` |
| `src/lib/db/legal-pages.ts` |
| `src/lib/db/mappers.ts` *(added `server-only`)* |
| `src/lib/db/password-reset.ts` |
| `src/lib/db/referrals.ts` |
| `src/lib/db/scripts.ts` |
| `src/lib/db/site-settings.ts` |
| `src/lib/db/subscriptions.ts` |
| `src/lib/db/support.ts` |
| `src/lib/db/usage.ts` |
| `src/lib/db/users.ts` |
| `src/lib/db/workspaces.ts` |

### Server libraries

| File | Change |
|------|--------|
| `src/lib/auth/local-auth.ts` | Import from `@/lib/supabase/server` |
| `src/lib/referrals/reconcile-commissions.ts` | Import from `@/lib/supabase/server` |
| `src/lib/team/workspace-debug.ts` | Server imports + `isSupabaseServerConfigured()` |

### Client hooks & components

| File | Change |
|------|--------|
| `src/hooks/use-support-realtime.ts` | `@/lib/supabase/client` |
| `src/hooks/use-support-unread.ts` | `@/lib/supabase/client` |
| `src/components/dashboard/script-generator-form.tsx` | `@/lib/supabase/client` |
| `src/components/dashboard/script-detail-view.tsx` | `@/lib/supabase/client` |
| `src/components/dashboard/script-history.tsx` | `@/lib/supabase/client` |

### API routes (server config check)

| File | Change |
|------|--------|
| `src/app/api/usage/route.ts` | `isSupabaseServerConfigured()` |
| `src/app/api/billing/subscription/route.ts` | `isSupabaseServerConfigured()` |
| `src/app/api/scripts/route.ts` | `isSupabaseServerConfigured()` |
| `src/app/api/scripts/[id]/route.ts` | `isSupabaseServerConfigured()` |
| `src/app/api/generate/route.ts` | `isSupabaseServerConfigured()` |
| `src/app/api/auth/me/route.ts` | `isSupabaseServerConfigured()` |
| `src/app/api/admin/auth/me/route.ts` | `isSupabaseServerConfigured()` |

### Tooling & config

| File | Change |
|------|--------|
| `eslint.config.mjs` | `no-restricted-imports` for `@/lib/db/*` and `@/lib/supabase/server` in components/hooks |
| `package.json` | Added `server-only` dependency |

**Total:** 3 new files, 38 modified files

---

## Security Improvements

### 1. Anon fallback removed

**Before:**
```typescript
const key = getSupabaseServiceKey() ?? getSupabaseAnonKey();
```

**After (`src/lib/supabase/server.ts`):**
- Uses **only** `SUPABASE_SERVICE_ROLE_KEY`
- **Production:** throws immediately if missing
- **Development:** logs a clear `⚠️` warning, then throws
- Return type is `SupabaseClient` (never `null` via anon fallback)

### 2. Module split

| Module | Import in | Key |
|--------|-----------|-----|
| `@/lib/supabase/client` | Hooks, client components | Anon only |
| `@/lib/supabase/server` | API routes, `lib/db/*`, server libs | Service role only |
| `@/lib/supabase` | Legacy client-safe barrel | Types + client exports |

`import "server-only"` in `server.ts` causes a **build error** if imported from a client component.

### 3. Database layer isolation

All 18 files in `src/lib/db/*` include `import "server-only"`. Importing any of them from a client bundle fails at build time.

### 4. ESLint import protection

`eslint.config.mjs` blocks in `src/components/**` and `src/hooks/**`:

- `@/lib/db` and `@/lib/db/*`
- `@/lib/supabase/server`

**Exceptions:** `site-navbar.tsx` and `site-footer.tsx` (async Server Components, not client code).

### 5. Deprecated API removed

`createSupabaseClient()` removed from the public API.

---

## Production Behavior

| Scenario | Behavior |
|----------|----------|
| `SUPABASE_SERVICE_ROLE_KEY` set | Server creates client with service role; bypasses RLS |
| `SUPABASE_SERVICE_ROLE_KEY` missing (production) | `createServerSupabaseClient()` throws — API routes fail fast |
| `SUPABASE_SERVICE_ROLE_KEY` missing (development) | Warning in console, then throw with setup instructions |
| Browser realtime hooks | Use anon key only; no server client code in bundle |
| Client component imports `@/lib/db/users` | ESLint error at lint time |
| Client component imports `@/lib/supabase/server` | ESLint error + `server-only` build error |

### Required Vercel environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # Required — no fallback
```

---

## Verification Results

### `npm run build`

```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Generating static pages (109/109)
Exit code: 0
```

Pre-existing warnings only (unused vars in unrelated files).

### Client bundle scan (`.next/static`)

| Pattern | Found |
|---------|-------|
| `createServerSupabaseClient` | **No** |
| `SUPABASE_SERVICE_ROLE` | **No** |
| `createBrowserSupabaseClient` | Yes (expected — support realtime hooks) |

### `node scripts/rls-verify.mjs`

| Table | Anon SELECT (post-RLS) |
|-------|------------------------|
| `users` | EMPTY (denied) |
| `scripts` | EMPTY (denied) |
| `subscriptions` | EMPTY (denied) |
| `support_tickets` | EMPTY (denied) |
| `ai_settings` | EMPTY (denied) |
| `users` INSERT | DENIED |

Service role configured: **true**

---

## Import Guide (Post-Hardening)

```typescript
// ✅ Client component or hook
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

// ✅ API route, server component, lib/db
import { createServerSupabaseClient, isSupabaseServerConfigured } from "@/lib/supabase/server";

// ✅ Types only (anywhere)
import type { DbUser } from "@/lib/supabase/types";

// ❌ Never in client code
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUserById } from "@/lib/db/users";
```

---

## Conclusion

HyperScripter’s Supabase client architecture is now production-safe:

1. **No silent anon downgrade** on the server
2. **Physical module separation** between browser and server clients
3. **Build-time + lint-time** guards against client-side DB access
4. **Verified** via production build and RLS smoke tests

Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in all deployment environments before go-live.
