# RLS Compatibility Report

**Date:** June 13, 2026  
**Application:** HyperScripter  
**Target migration:** `supabase/rls-production.sql`  
**Audit type:** Pre-migration compatibility (no changes applied)

---

## Executive Summary

| Metric | Result |
|--------|--------|
| API routes audited | **60** |
| `src/lib/db/*` modules audited | **18** |
| Direct Supabase queries outside `lib/db` | **2** (`reconcile-commissions.ts`, `workspace-debug.ts`) — both use service role |
| All server DB queries use `createServerSupabaseClient()` | **Yes** |
| API routes that depend on anon RLS | **0** |
| Client paths that depend on anon RLS | **2 hooks** (support realtime only) |
| API routes that break after RLS (with service role set) | **0** |
| API routes that break without `SUPABASE_SERVICE_ROLE_KEY` | **All DB-backed routes** |

### Verdict

**Safe to apply `rls-production.sql`** when:

1. `SUPABASE_SERVICE_ROLE_KEY` is set in every environment (already required after security hardening).
2. You accept that **browser support realtime** will stop until replaced with polling or JWT-scoped subscriptions.
3. `team-workspace.sql` has been run if you use team invitations (`workspace_invitations` table).

All API routes and server components access the database through `createServerSupabaseClient()` → **service role bypasses RLS**. No API route relies on permissive `USING (true)` anon policies.

---

## How RLS Interacts With This App

```
API Route / RSC / lib/db/*
        │
        ▼
createServerSupabaseClient()  ──► SUPABASE_SERVICE_ROLE_KEY
        │
        ▼
Bypasses RLS (full access)     ✅ Unaffected by rls-production.sql

Browser hooks (support realtime)
        │
        ▼
createBrowserSupabaseClient()  ──► NEXT_PUBLIC_SUPABASE_ANON_KEY
        │
        ▼
Subject to RLS                 ❌ Will lose access to support_messages
```

---

## `src/lib/db/*` Query Audit

Every module uses `createServerSupabaseClient()` from `@/lib/supabase/server`.  
All include `import "server-only"`.

| Module | Tables queried | Service role | Breaks after RLS? |
|--------|----------------|--------------|-------------------|
| `users.ts` | `users`, `subscriptions`, `scripts`, `usage_records`, `workspace_members`, `workspaces` | Yes | No |
| `scripts.ts` | `scripts`, `users` | Yes | No |
| `subscriptions.ts` | `subscriptions` | Yes | No |
| `usage.ts` | `usage_records` | Yes | No |
| `support.ts` | `support_tickets`, `support_messages`, `users` | Yes | No |
| `referrals.ts` | `referrals`, `affiliate_payouts`, `users` | Yes | No |
| `affiliate-payment-methods.ts` | `affiliate_payment_methods` | Yes | No |
| `password-reset.ts` | `password_reset_tokens` | Yes | No |
| `email-settings.ts` | `email_settings` | Yes | No |
| `email-logs.ts` | `email_logs` | Yes | No |
| `ai-settings.ts` | `ai_settings` | Yes | No |
| `site-settings.ts` | `site_settings` | Yes | No |
| `header-footer-settings.ts` | `header_footer_settings` | Yes | No |
| `workspaces.ts` | `workspaces`, `workspace_members`, `workspace_invitations`, `scripts`, `users` | Yes | No* |
| `admin-stats.ts` | `users`, `scripts`, `subscriptions`, `blog_posts`, `legal_pages` | Yes | No |
| `blog-posts.ts` | `blog_posts` | Yes | No |
| `legal-pages.ts` | `legal_pages` | Yes | No |
| `mappers.ts` | *(none — pure transforms)* | N/A | No |

\* `workspace_invitations` requires `team-workspace.sql` migration; missing table causes errors **before** RLS is relevant.

### Other server-side Supabase usage (outside `lib/db`)

| File | Client | Tables | Breaks after RLS? |
|------|--------|--------|-------------------|
| `lib/referrals/reconcile-commissions.ts` | `createServerSupabaseClient()` | `users`, `referrals` | No |
| `lib/team/workspace-debug.ts` | `createServerSupabaseClient()` | *(connectivity check only)* | No |
| `lib/auth/local-auth.ts` | `createServerSupabaseClient()` | `users` (via `lib/db/users`) | No |

`local-auth.ts` creates a server client for a config guard, then uses `getUserByEmail` / `upsertUser` (service role via `users.ts`).

---

## Server Components & Non-API Paths

| Path | Tables | Service role | Breaks after RLS? |
|------|--------|--------------|-------------------|
| `app/layout.tsx` | `site_settings` | Yes | No |
| `app/legal/[slug]/page.tsx` | `legal_pages` | Yes | No |
| `components/sections/site-navbar.tsx` | `header_footer_settings` | Yes | No |
| `components/sections/site-footer.tsx` | `header_footer_settings` | Yes | No |
| `lib/seo-settings/server.ts` | `site_settings` | Yes | No |
| `lib/blog.ts` → `lib/db/blog-posts` | `blog_posts` | Yes | No |
| `lib/auth/session.ts` | `users` | Yes | No |
| `lib/gemini-client.ts` | `ai_settings` | Yes | No |
| `lib/email/transport.ts` | `email_settings`, `email_logs` | Yes | No |
| `lib/billing/sync-subscription.ts` | `users`, `subscriptions` | Yes | No |
| `lib/referrals/process-signup.ts` | `referrals`, `users` | Yes | No |
| `lib/referrals/process-commission.ts` | `referrals`, `affiliate_payouts`, `users` | Yes | No |

---

## Client Paths (Not API Routes) — Anon RLS Dependent

| Path | Anon usage | Tables (via Realtime) | Breaks after RLS? | Required fix |
|------|------------|----------------------|-------------------|--------------|
| `hooks/use-support-realtime.ts` | `postgres_changes` INSERT on `support_messages` | `support_messages` | **Yes** | Poll `GET /api/support/tickets/[id]` or issue per-user Supabase JWT |
| `hooks/use-support-unread.ts` | `postgres_changes` INSERT on `support_messages` | `support_messages` | **Partial** | Unread count still works via `/api/support/unread` API; only live push breaks |

**Used by:** `support-view.tsx`, `admin/support/page.tsx`, dashboard/admin sidebars (unread badge).

---

## API Route Audit (All 60 Routes)

**Legend**

- **Service role:** Yes = database access via `createServerSupabaseClient()` (direct or through `lib/db/*`)
- **Breaks after RLS:** No = service role bypasses RLS; Yes = depends on anon policies; N/A = no database

### Authentication

| Route | Methods | Tables used | Service role | Breaks after RLS? | Required fix |
|-------|---------|-------------|--------------|-------------------|--------------|
| `/api/auth/login` | POST | `users` | Yes | No | None |
| `/api/auth/signup` | POST | `users`, `referrals`, `workspaces`, `workspace_members` | Yes | No | None |
| `/api/auth/logout` | POST | — | N/A | N/A | None |
| `/api/auth/me` | GET | `users` | Yes | No | None |
| `/api/auth/forgot-password` | POST | `users`, `password_reset_tokens` | Yes | No | None |
| `/api/auth/reset-password` | GET, POST | `password_reset_tokens`, `users` | Yes | No | None |
| `/api/admin/auth/me` | GET | `users` | Yes | No | None |

### Users & Account

| Route | Methods | Tables used | Service role | Breaks after RLS? | Required fix |
|-------|---------|-------------|--------------|-------------------|--------------|
| `/api/account/profile` | GET, PATCH | `users` | Yes | No | None |
| `/api/account/password` | POST | `users` | Yes | No | None |
| `/api/account/payout-settings` | GET, PUT | `affiliate_payment_methods` | Yes | No | None |
| `/api/admin/users` | GET | `users` | Yes | No | None |
| `/api/admin/users/[id]` | GET, PATCH, DELETE | `users`, `subscriptions`, `scripts`, `usage_records`, `workspace_members`, `workspaces` | Yes | No | None |
| `/api/admin/users/[id]/password` | POST | `users` | Yes | No | None |
| `/api/admin/account/profile` | GET, PATCH | `users` | Yes | No | None |
| `/api/admin/account/password` | POST | `users` | Yes | No | None |

### Scripts & Generation

| Route | Methods | Tables used | Service role | Breaks after RLS? | Required fix |
|-------|---------|-------------|--------------|-------------------|--------------|
| `/api/generate` | POST | `users`, `scripts`, `usage_records`, `ai_settings` | Yes | No | None |
| `/api/scripts` | GET | `scripts` | Yes | No | None |
| `/api/scripts/[id]` | GET, PATCH, DELETE | `scripts` | Yes | No | None |
| `/api/usage` | GET | `users`, `usage_records` | Yes | No | None |
| `/api/admin/scripts` | GET | `scripts`, `users` | Yes | No | None |

### Support

| Route | Methods | Tables used | Service role | Breaks after RLS? | Required fix |
|-------|---------|-------------|--------------|-------------------|--------------|
| `/api/support/tickets` | GET, POST | `support_tickets`, `support_messages`, `users` | Yes | No | None |
| `/api/support/tickets/[id]` | GET, POST | `support_tickets`, `support_messages` | Yes | No | None |
| `/api/support/unread` | GET | `support_tickets` | Yes | No | None |
| `/api/admin/support/tickets` | GET | `support_tickets`, `support_messages` | Yes | No | None |
| `/api/admin/support/tickets/[id]` | GET, POST, PATCH | `support_tickets`, `support_messages` | Yes | No | None |
| `/api/admin/support/unread` | GET | `support_tickets` | Yes | No | None |

### Referrals & Affiliate Payouts

| Route | Methods | Tables used | Service role | Breaks after RLS? | Required fix |
|-------|---------|-------------|--------------|-------------------|--------------|
| `/api/referrals` | GET | `referrals`, `affiliate_payouts`, `users` | Yes | No | None |
| `/api/admin/referrals` | GET | `referrals`, `affiliate_payouts`, `users` | Yes | No | None |
| `/api/admin/referrals/export` | GET | `referrals`, `users` | Yes | No | None |
| `/api/admin/referrals/payouts/[id]` | PATCH | `affiliate_payouts`, `users` | Yes | No | None |

### Billing

| Route | Methods | Tables used | Service role | Breaks after RLS? | Required fix |
|-------|---------|-------------|--------------|-------------------|--------------|
| `/api/billing/subscription` | GET | `users`, `subscriptions` | Yes | No | None |
| `/api/billing/create-checkout-session` | POST | `subscriptions`, `users` | Yes | No | None |
| `/api/billing/create-portal-session` | POST | `subscriptions` | Yes | No | None |
| `/api/stripe/webhook` | POST | `users`, `subscriptions`, `referrals`, `affiliate_payouts` | Yes | No | None |

### Email Settings

| Route | Methods | Tables used | Service role | Breaks after RLS? | Required fix |
|-------|---------|-------------|--------------|-------------------|--------------|
| `/api/admin/email-settings` | GET, PUT | `email_settings` | Yes | No | None |
| `/api/admin/email-settings/test` | POST | `email_settings`, `email_logs` | Yes | No | None |
| `/api/admin/email-logs` | GET | `email_logs` | Yes | No | None |

*All user-facing email sends (welcome, password reset, support) use `lib/email/transport.ts` → service role; not separate API routes.*

### AI Settings

| Route | Methods | Tables used | Service role | Breaks after RLS? | Required fix |
|-------|---------|-------------|--------------|-------------------|--------------|
| `/api/admin/ai` | GET, PUT | `ai_settings` | Yes | No | None |
| `/api/admin/ai/test` | POST | `ai_settings` | Yes | No | None |

### Team Workspace

| Route | Methods | Tables used | Service role | Breaks after RLS? | Required fix |
|-------|---------|-------------|--------------|-------------------|--------------|
| `/api/team/workspace` | GET | `workspaces`, `workspace_members`, `users` | Yes | No | Run `team-workspace.sql` if `workspace_invitations` needed |
| `/api/team/members` | GET, POST, PATCH, DELETE | `workspaces`, `workspace_members`, `workspace_invitations`, `users` | Yes | No* | *Requires `workspace_invitations` table |
| `/api/team/invitations/accept` | POST | `workspace_invitations`, `workspace_members` | Yes | No* | *Requires `workspace_invitations` table |
| `/api/team/settings` | PATCH | `workspaces` | Yes | No | None |
| `/api/team/analytics` | GET | `scripts`, `users`, `workspaces` | Yes | No | None |
| `/api/team/scripts` | GET, PATCH, DELETE | `scripts`, `workspaces` | Yes | No | None |
| `/api/team/scripts/[id]` | GET | `scripts`, `users` | Yes | No | None |
| `/api/team/share-status` | GET | `scripts` | Yes | No | None |
| `/api/debug/team` | GET | `users`, `workspaces`, `workspace_members` | Yes | No | None (debug route; blocked in prod middleware) |

### Platform / CMS / Admin

| Route | Methods | Tables used | Service role | Breaks after RLS? | Required fix |
|-------|---------|-------------|--------------|-------------------|--------------|
| `/api/admin/dashboard` | GET | `users`, `scripts`, `subscriptions`, `ai_settings` | Yes | No | None |
| `/api/admin/analytics` | GET | `users`, `scripts`, `subscriptions` | Yes | No | None |
| `/api/admin/site-settings` | GET, PUT | `site_settings` | Yes | No | None |
| `/api/admin/seo-settings` | GET, PUT | `site_settings` | Yes | No | None |
| `/api/admin/seo-settings/og-image` | POST | `site_settings` | Yes | No | None |
| `/api/admin/favicon` | GET, PUT | `site_settings` | Yes | No | None |
| `/api/admin/header-footer` | GET, PUT | `header_footer_settings` | Yes | No | None |
| `/api/header-footer` | GET | `header_footer_settings` | Yes | No | None |
| `/api/admin/blog` | GET, POST | `blog_posts` | Yes | No | None |
| `/api/admin/blog/[id]` | PATCH, DELETE | `blog_posts` | Yes | No | None |
| `/api/admin/legal` | GET, POST | `legal_pages` | Yes | No | None |
| `/api/admin/legal/[id]` | PATCH, DELETE | `legal_pages` | Yes | No | None |

---

## Domain Verification Summary

### Users ✅

| Check | Status |
|-------|--------|
| All user CRUD via service role | Pass |
| Session resolution (`getUserById`) | Service role |
| Admin user delete cascades | Service role |
| Anon RLS dependency | None |

### Scripts ✅

| Check | Status |
|-------|--------|
| Create/read/update/delete | Service role via `lib/db/scripts` |
| Team shared scripts | Service role via `lib/db/workspaces` |
| Usage metering | Service role via `lib/db/usage` |

### Support ⚠️

| Check | Status |
|-------|--------|
| API ticket/message CRUD | Service role — **No break** |
| Browser realtime (`use-support-realtime`) | Anon — **Will break** |
| Unread badge realtime push | Anon — **Will break** (API poll still works) |

### Referrals ✅

| Check | Status |
|-------|--------|
| User referral dashboard | Service role |
| Signup referral processing | Service role |
| Admin list/export | Service role |
| Commission on Stripe webhook | Service role |

### Affiliate Payouts ✅

| Check | Status |
|-------|--------|
| Payout creation & marking paid | Service role |
| Payment methods | Service role |

### Billing ✅

| Check | Status |
|-------|--------|
| Checkout / portal sessions | Service role (`subscriptions`) |
| Stripe webhook sync | Service role (`users`, `subscriptions`) |
| Subscription read API | Service role |

### Email Settings ✅

| Check | Status |
|-------|--------|
| Admin CRUD | Service role |
| SMTP transport reads settings | Service role |
| Email log writes | Service role |

### AI Settings ✅

| Check | Status |
|-------|--------|
| Admin CRUD | Service role |
| Script generation (`/api/generate`) | Service role via `gemini-client` → `ai_settings` |

### Team Workspace ✅ (with migration caveat)

| Check | Status |
|-------|--------|
| Workspace create/list | Service role |
| Member management | Service role |
| Invitations | Service role — requires `workspace_invitations` table |
| Shared scripts | Service role |

---

## Prerequisites Before Applying `rls-production.sql`

| # | Requirement | Status |
|---|-------------|--------|
| 1 | `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` and Vercel | Verify in deployment |
| 2 | `rls-production.sql` run in Supabase SQL Editor | Pending |
| 3 | `team-workspace.sql` run (if using team invites) | Check your project |
| 4 | Re-run `node scripts/rls-verify.mjs` after migration | Post-step |
| 5 | Smoke-test auth, generate, billing, support API | Post-step |

---

## What Will NOT Break

- All 60 API routes (when service role is configured)
- Server-rendered pages (`layout`, legal, navbar, footer)
- Admin panel data loading
- Stripe webhooks
- Password reset flow
- Script generation and history

## What WILL Break or Degrade

| Item | Severity | Mitigation |
|------|----------|------------|
| Support message realtime in browser | Medium | Add polling interval on ticket view / unread hooks |
| Support unread live push | Low | Manual refresh or poll `/api/support/unread` every N seconds |
| Missing `SUPABASE_SERVICE_ROLE_KEY` | Critical | Set env var (app throws before any DB call) |
| Missing `workspace_invitations` table | High (team only) | Run `team-workspace.sql` |

---

## Routes That Previously Depended on Anon RLS

**Before** security hardening, if `SUPABASE_SERVICE_ROLE_KEY` was missing, server code fell back to the anon key and relied on `USING (true)` policies.

**After** client split + `rls-production.sql`:

| Scenario | Outcome |
|----------|---------|
| Service role configured | All API routes work; anon policies irrelevant |
| Service role missing | Server throws immediately — no silent anon fallback |
| Browser realtime | Was already using anon; breaks when permissive policies removed |

**No API route is designed to use anon RLS in the target architecture.**

---

## Recommended Post-Migration Steps

1. Apply `supabase/rls-production.sql` in Supabase SQL Editor.
2. Run `node scripts/rls-verify.mjs` — expect DENIED/EMPTY for anon on sensitive tables.
3. Smoke-test:
   - Signup / login
   - Generate script
   - Billing checkout (test mode)
   - Support ticket create + reply (API)
   - Referral dashboard
   - Admin: users, AI settings, email settings
   - Team workspace (if enabled)
4. Replace support realtime hooks with polling (optional UX improvement).

---

## Conclusion

HyperScripter is **RLS-compatible** for production hardening. The application correctly routes all server-side data access through the service role. Applying `rls-production.sql` will **not break any API route** assuming `SUPABASE_SERVICE_ROLE_KEY` is set.

The only functional regression is **browser-side Supabase Realtime** for support messages, which depended on permissive anon policies and should be replaced with API polling or authenticated JWT subscriptions.

**Recommendation:** Proceed with `rls-production.sql` after confirming service role env vars and running post-migration verification.
