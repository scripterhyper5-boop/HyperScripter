# Security Audit Report

**Date:** June 13, 2026  
**Application:** HyperScripter  
**Scope:** Authentication, authorization, input validation, XSS, CSRF, SQL injection, rate limiting, uploads, billing, referrals, support

---

## Executive Summary

HyperScripter has **solid application-layer auth** (HMAC sessions, bcrypt, admin route guards, Stripe webhook verification, IDOR checks on scripts/tickets). The **primary risk** is Supabase RLS configured with permissive `USING (true)` policies that allow the public **anon key** to read/write sensitive tables if used directly from the browser.

**Security posture:** Medium-High at app layer, **Critical gap at database layer** until RLS is hardened.

---

## 1. Authentication & Sessions

### Strengths

| Control | Implementation |
|---------|----------------|
| Password hashing | bcrypt, 12 rounds (`src/lib/auth/password.ts`) |
| Session cookies | HMAC-SHA256 signed, `httpOnly`, `secure` (prod), `sameSite: lax` |
| Timing-safe compare | `timingSafeEqual` on session verification |
| Session max age | 7 days (`SESSION_MAX_AGE`) |

### Issues

| ID | Severity | Finding | Recommendation |
|----|----------|---------|----------------|
| SEC-01 | **High** | Sessions not invalidated on password change/reset | Clear session cookie + invalidate on `reset-password` and account password update |
| SEC-02 | **High** | Login logs email, `passwordMatch`, role (`local-auth.ts`) | Remove debug logging in production |
| SEC-03 | **Medium** | Weak password policy (8 chars min only) | Add complexity rules or zxcvbn scoring |
| SEC-04 | **Medium** | `ADMIN_EMAIL` env auto-grants admin on signup | Document strictly; use explicit admin promotion in production |

---

## 2. Admin Route Protection

### Strengths

- All `/api/admin/*` routes use `getAdminServerSession()` → 401
- Admin panel layout server-checks `isAdmin()` → redirect
- Last-admin safeguards on user demotion/deletion

### Issues

| ID | Severity | Finding | Recommendation |
|----|----------|---------|----------------|
| SEC-05 | **Medium** | Middleware checks cookie **presence** only, not signature/role | Acceptable with server verification; add centralized admin API wrapper |
| SEC-06 | **Medium** | Per-route admin checks — one missed route = exposure | Create `withAdminAuth()` HOF for all admin routes |

---

## 3. API Authorization (User Routes)

### Strengths

- Scripts scoped by `session.user.id`
- Support tickets verify `ticket.userId === session.user.id`
- Team RBAC via `requireTeamAccess()` + permission helpers
- Billing checkout whitelists plan IDs; ties Stripe metadata to `userId`

### Issues

| ID | Severity | Finding | Recommendation |
|----|----------|---------|----------------|
| SEC-07 | **Low** | Referral code accepted from signup body (overrides cookie) | Self-referral blocked; acceptable with monitoring |

---

## 4. Input Validation

### Strengths

- Generator enums validated (`src/lib/gemini.ts`)
- SEO, header/footer, payout settings sanitized
- File uploads: size limits, MIME/extension checks, admin-only
- AI API keys encrypted (AES-256-GCM)

### Issues

| ID | Severity | Finding | Recommendation |
|----|----------|---------|----------------|
| SEC-08 | **Medium** | PostgREST filter injection in admin search (`users.ts`, `support.ts`, `referrals.ts`) | Escape `,`, `.`, `()` in `.or()` filter strings |
| SEC-09 | **Low** | Some API routes accept loose JSON without zod schemas | Add shared validators for high-risk endpoints |

---

## 5. XSS Protection

### Strengths

- Support messages rendered as React text (auto-escaped)
- Blog/legal content is admin-authored HTML (trusted source)

### Issues

| ID | Severity | Finding | Recommendation |
|----|----------|---------|----------------|
| SEC-10 | **High** | Admin site snippets (`headCode`, `bodyCode`) injected via `dangerouslySetInnerHTML` site-wide | Expected for analytics; restrict admin access; consider CSP |
| SEC-11 | **Medium** | SVG favicon upload served from `/public/uploads/favicon/` | Prefer PNG-only in production or sanitize SVG |
| SEC-12 | **Medium** | Legal pages render admin HTML via `dangerouslySetInnerHTML` | Admin-only authoring; sanitize with DOMPurify server-side |

---

## 6. CSRF Protection

| ID | Severity | Finding | Recommendation |
|----|----------|---------|----------------|
| SEC-13 | **Medium** | No CSRF tokens; relies on `SameSite=Lax` cookies | Add `Origin`/`Referer` validation on state-changing routes for defense in depth |

---

## 7. SQL Injection

| Status | Details |
|--------|---------|
| **Low risk** | No raw SQL; Supabase client uses parameterized queries throughout `src/lib/db/` |

PostgREST filter string manipulation (SEC-08) is a **query-layer** issue, not classic SQL injection.

---

## 8. Rate Limiting

| ID | Severity | Finding | Recommendation |
|----|----------|---------|----------------|
| SEC-14 | **High** | **No rate limiting** on login, signup, forgot-password, reset-password, `/api/generate` | Add Upstash/Vercel KV rate limits or middleware throttling |
| SEC-15 | **Medium** | Reset token validity oracle via `GET /api/auth/reset-password?token=` | Rate-limit + remove validity endpoint or use constant-time response |

---

## 9. File Upload Validation

| Upload | Validation | Status |
|--------|------------|--------|
| Favicon | Admin-only, 2MB, png/svg/ico, Sharp re-encode | OK |
| OG image | Admin-only, 5MB, png/jpg/webp | OK |
| Blog/legal | Admin HTML (no file upload) | OK |

---

## 10. Password Reset Security

### Strengths

- Tokens hashed (SHA-256) at rest
- 1-hour TTL
- Prior tokens invalidated on new request
- Generic forgot-password response (no email enumeration in API response)

### Issues

- SEC-14, SEC-15 (no rate limiting, token oracle)
- SEC-01 (session not invalidated after reset)

---

## 11. Referral Abuse Prevention

### Strengths

- Self-referral blocked
- Commission idempotent (`payoutExists` checks)
- Payout admin-gated with notes
- Reconcile job for missed commissions

### Issues

| ID | Severity | Finding | Recommendation |
|----|----------|---------|----------------|
| SEC-16 | **Low** | No IP/device fingerprinting for referral fraud | Monitor unusual referral patterns post-launch |

---

## 12. Billing Security

### Strengths

- Stripe webhook signature verification (`constructEvent`)
- Session required for checkout/portal
- Plan whitelist prevents arbitrary price IDs
- `userId` in subscription metadata for reconciliation

### Issues

| ID | Severity | Finding | Recommendation |
|----|----------|---------|----------------|
| SEC-17 | **Critical** | Real Stripe **test** keys were in `.env.example` | **Fixed** — replaced with placeholders; **rotate keys in Stripe dashboard** |
| SEC-18 | **Medium** | No idempotency key on checkout session creation | Add Stripe idempotency keys for retries |

---

## 13. Support Ticket Security

### Strengths

- Auth required for ticket creation/view
- Ownership checks on messages
- Admin routes separated

### Issues

| ID | Severity | Finding | Recommendation |
|----|----------|---------|----------------|
| SEC-19 | **Critical** | Support realtime uses browser Supabase client; RLS permissive for anon | Harden RLS; scope realtime to ticket participants only |

---

## 14. Database RLS (Critical)

| ID | Severity | Finding |
|----|----------|---------|
| SEC-20 | **CRITICAL** | Policies like `"Service access users" FOR ALL USING (true)` apply to **anon** role. Combined with `NEXT_PUBLIC_SUPABASE_ANON_KEY`, attackers can bypass Next.js and access `users`, `password_hash`, `email_settings`, etc. |

**Remediation:** Run `supabase/rls-hardening.sql` after testing. Ensure production APIs **only** use `SUPABASE_SERVICE_ROLE_KEY`. Never fall back to anon key on server.

**File:** `src/lib/supabase.ts` — verify service role is required in production.

---

## 15. Debug & Test Routes

| ID | Severity | Finding | Status |
|----|----------|---------|--------|
| SEC-21 | **High** | `/debug/*` and `/test` exposed env diagnostics | **Fixed** — redirected to `/` in production middleware |

---

## 16. Security Headers

| ID | Severity | Finding | Status |
|----|----------|---------|--------|
| SEC-22 | **Medium** | Missing security headers | **Fixed** — `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` in `next.config.ts` |
| SEC-23 | **Medium** | No Content-Security-Policy | Add CSP after auditing third-party scripts (GA, GTM, Clarity, Meta Pixel) |

---

## 17. Remediation Priority

1. **CRITICAL:** Harden Supabase RLS; rotate Stripe keys if `.env.example` keys were ever committed to a public repo
2. **HIGH:** Add rate limiting on auth + generate endpoints
3. **HIGH:** Invalidate sessions on password change
4. **HIGH:** Remove login debug logs
5. **MEDIUM:** PostgREST filter sanitization, CSP, CSRF origin checks
6. **MEDIUM:** Encrypt SMTP passwords at rest

---

## 18. Security Score

| Category | Score (/10) |
|----------|-------------|
| App-layer auth | 8 |
| Admin protection | 8 |
| Billing | 8 |
| Input validation | 7 |
| Database RLS | 3 |
| Rate limiting | 2 |
| Headers/CSP | 6 |
| **Overall** | **6.0 / 10** |

**Production recommendation:** Fix SEC-20 (RLS) and SEC-14 (rate limiting) before public launch.
