# Rate Limit Report

**Date:** June 13, 2026  
**Application:** HyperScripter

---

## Summary

Production-grade rate limiting is implemented across authentication, AI generation, support, and referral signup flows. Limits return **HTTP 429** with friendly messages, standard `Retry-After` headers, and structured logging for blocked attempts.

| Metric | Value |
|--------|-------|
| Protected API routes | **7** |
| Storage backends | Upstash Redis → Supabase DB → in-memory (dev) |
| Admin bypass | Yes (generate + all `/api/admin/*` unprotected) |
| Build status | ✅ Pass |

---

## Storage Method

### Priority chain

```
1. Upstash Redis     (UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)
        ↓ if not configured
2. Supabase database (rate_limit_counters table + increment_rate_limit_counter RPC)
        ↓ if migration not applied
3. In-memory Map     (development only — logs warning)
        ↓ production without 1 or 2
4. Throws error      (fail closed in production)
```

### Recommended production setup

**Upstash Redis** (best for Vercel serverless):

```env
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

Create a free database at [upstash.com](https://upstash.com) and add env vars to Vercel.

### Database fallback

Run in Supabase SQL Editor:

```
supabase/rate-limit-schema.sql
```

Creates `rate_limit_counters` table and atomic `increment_rate_limit_counter()` function. Accessed via service role only (no RLS policies).

### Algorithm

- **Upstash:** `@upstash/ratelimit` sliding window
- **Database:** Fixed-window counter with atomic Postgres increment
- **Memory:** Fixed-window counter (single Node process only)

---

## Limits

| Category | Route key | Scope | Limit | Window | Admin bypass |
|----------|-----------|-------|-------|--------|--------------|
| Login | `auth:login` | IP | 5 | 15 minutes | No |
| Signup | `auth:signup` | IP | 3 | 1 hour | No |
| Forgot password | `auth:forgot-password` | IP | 3 | 1 hour | No |
| Referral signup | `referral:signup` | IP | 10 | 24 hours | No |
| AI generate (free) | `generate` | User ID | 5 | 1 minute | Yes |
| AI generate (pro) | `generate` | User ID | 20 | 1 minute | Yes |
| AI generate (team) | `generate` | User ID | 50 | 1 minute | Yes |
| Support new ticket | `support:ticket` | User ID | 10 | 1 hour | No* |
| Support reply | `support:reply` | User ID | 30 | 1 hour | No* |

\* Users use `/api/support/*`. Admins use `/api/admin/support/*` which has no rate limits.

---

## Protected Routes

| Route | Method | Rate limit | Response on exceed |
|-------|--------|------------|-------------------|
| `/api/auth/login` | POST | 5 / 15 min per IP | 429 + friendly message |
| `/api/auth/signup` | POST | 3 / hour per IP + 10 referral / day per IP | 429 |
| `/api/auth/forgot-password` | POST | 3 / hour per IP | 429 |
| `/api/generate` | POST | Plan-based per user / minute | 429 |
| `/api/support/tickets` | POST | 10 / hour per user | 429 |
| `/api/support/tickets/[id]` | POST | 30 / hour per user | 429 |

### Unprotected (by design)

| Route | Reason |
|-------|--------|
| All `/api/admin/*` | Admin unlimited per requirements |
| `/api/auth/logout` | No abuse vector |
| `/api/auth/reset-password` | Token-gated; low volume |
| GET endpoints | Read-only; auth-gated |

---

## Response Format

When rate limited, APIs return:

```json
{
  "error": "Too many sign-in attempts. Please wait 15 minutes and try again.",
  "code": "RATE_LIMITED",
  "retryAfter": 842
}
```

**HTTP headers:**

- `Status: 429 Too Many Requests`
- `Retry-After: <seconds>`
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

---

## Logging

Blocked attempts are logged to server console:

```
[rate-limit] blocked {
  route: 'auth:login',
  key: 'ip:203.0.113.1',
  identifier: '203.0.113.1',
  limit: 5,
  windowSeconds: 900,
  remaining: 0,
  reset: '2026-06-13T12:30:00.000Z',
  storage: 'upstash'
}
```

---

## UI Error Handling

| Surface | Behavior |
|---------|----------|
| Login form | Displays `error` from API (friendly rate limit message) |
| Signup form | Displays `error` from API |
| Forgot password form | Displays `error` from API |
| Script generator | Toast + inline error for `RATE_LIMITED`; no auto-retry |
| Support view | Toast with friendly message on ticket/reply limit |

`generate-client.ts` excludes `RATE_LIMITED` from automatic retry logic.

---

## Implementation Files

| File | Purpose |
|------|---------|
| `src/lib/rate-limit/config.ts` | Limit definitions |
| `src/lib/rate-limit/store.ts` | Upstash / DB / memory backends |
| `src/lib/rate-limit/enforce.ts` | `enforceRateLimit()` + logging |
| `src/lib/rate-limit/response.ts` | 429 response builder |
| `src/lib/rate-limit/client-ip.ts` | IP extraction from proxy headers |
| `supabase/rate-limit-schema.sql` | Database fallback schema |
| `scripts/rate-limit-verify.mjs` | Smoke test script |

---

## Test Results

### Build verification

```
npm run build
✓ Compiled successfully
✓ Linting and checking validity of types
Exit code: 0
```

### Manual smoke test

```bash
# Start dev server, then:
node scripts/rate-limit-verify.mjs
```

**Expected:** Login attempts 1–5 return 401 (wrong password). Attempt 6 returns **429** with `code: "RATE_LIMITED"`.

### Storage detection

| Environment | Expected storage |
|-------------|------------------|
| Upstash env vars set | `upstash` |
| Supabase + migration, no Upstash | `database` |
| Local dev, neither configured | `memory` (with console warning) |
| Production, neither configured | **Error thrown** (fail closed) |

---

## Performance Impact

| Backend | Latency per check | Notes |
|---------|-------------------|-------|
| Upstash Redis | ~5–15 ms | HTTP REST; ideal for Vercel edge/serverless |
| Supabase RPC | ~20–50 ms | One atomic DB round-trip |
| In-memory | <1 ms | Dev only; not shared across instances |

### Overhead assessment

- Rate check runs **once per protected request** before business logic
- Upstash adds negligible overhead vs Gemini API calls (1–5 seconds)
- Database fallback acceptable for low-traffic beta; migrate to Upstash for scale
- No middleware-level global limiting — targeted per-route only (minimal bundle impact)

### Package size

Added dependencies:

- `@upstash/ratelimit`
- `@upstash/redis`

Tree-shaken to server-only modules (`import "server-only"` in store/enforce).

---

## Production Checklist

- [ ] Create Upstash Redis database
- [ ] Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in Vercel
- [ ] Or run `supabase/rate-limit-schema.sql` as fallback
- [ ] Deploy and run `node scripts/rate-limit-verify.mjs` against production URL
- [ ] Monitor `[rate-limit] blocked` logs in Vercel

---

## Conclusion

Rate limiting is production-ready with a three-tier storage strategy, plan-aware AI throttling, referral abuse prevention, and user-friendly 429 responses. **Configure Upstash Redis before public launch** for consistent limits across serverless instances.
