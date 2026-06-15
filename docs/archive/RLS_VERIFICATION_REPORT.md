# RLS Verification Report

**Date:** June 13, 2026  
**Application:** HyperScripter  
**Database:** Supabase (project `jvinzixeqnmtvjhizsqv`)  
**Auth model:** Custom HMAC cookie sessions in Next.js — **not** Supabase Auth JWT

---

## Executive Summary

| Metric | Result |
|--------|--------|
| Tables audited | 21 |
| Policies with `USING (true)` on sensitive data | **20** |
| Live anon access to private data | **CONFIRMED — CRITICAL** |
| `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` | **NOT SET** (server falls back to anon key) |
| Recommended migration | `supabase/rls-production.sql` |

**Verdict:** The database is **not production-safe**. Anyone with the public anon key (embedded in the client bundle) can read password hashes, API keys, support messages, payout details, and can **insert or delete users**.

---

## Architecture Context

```
Browser (anon key)  ──► PostgREST ──► RLS policies
Next.js API routes  ──► service role key ──► bypasses RLS (intended)
```

HyperScripter enforces authorization in **Next.js API routes** (`getUserServerSession`, `getAdminServerSession`). RLS is a **defense-in-depth** layer. Today:

1. Most tables have `FOR ALL USING (true) WITH CHECK (true)` — applies to **anon** and **authenticated** roles.
2. Support tables have proper `authenticated` policies using `auth.uid()`, but the app **never sets** `auth.uid()` (no Supabase Auth login).
3. Support also has explicit `TO anon USING (true)` policies for realtime — exposing all ticket data via REST.
4. Without `SUPABASE_SERVICE_ROLE_KEY`, **server-side code uses the anon key** and inherits the same broken RLS.

---

## Live Test Results (Pre-Hardening)

**Script:** `node scripts/rls-verify.mjs`  
**Client:** `NEXT_PUBLIC_SUPABASE_ANON_KEY` only (matches production browser exposure)  
**Service role configured:** No

| Table | Operation | Result | Rows / Notes |
|-------|-----------|--------|--------------|
| `users` | SELECT | **ALLOWED** | 3 rows incl. `password_hash`, `email` |
| `users` | INSERT | **ALLOWED** | Test user created successfully |
| `users` | DELETE | **ALLOWED** | Test user deleted successfully |
| `scripts` | SELECT | EMPTY | Policy allows; no rows in DB |
| `subscriptions` | SELECT | **ALLOWED** | 2 rows incl. Stripe IDs |
| `usage_records` | SELECT | EMPTY | Policy allows |
| `support_tickets` | SELECT | **ALLOWED** | 1 ticket with email, subject |
| `support_messages` | SELECT | **ALLOWED** | 3 messages with full body text |
| `referrals` | SELECT | **ALLOWED** | 2 referral records |
| `affiliate_payouts` | SELECT | **ALLOWED** | 2 payouts incl. amounts, notes |
| `affiliate_payment_methods` | SELECT | **ALLOWED** | PayPal email, bank details |
| `password_reset_tokens` | SELECT | EMPTY | Policy allows (hashes exposed if present) |
| `email_settings` | SELECT | EMPTY | Policy allows SMTP credentials |
| `email_logs` | SELECT | **ALLOWED** | 3 logs with recipient emails |
| `ai_settings` | SELECT | **ALLOWED** | 1 row with **plaintext `api_key`** |
| `site_settings` | SELECT | **ALLOWED** | head/body injection snippets |
| `header_footer_settings` | SELECT | EMPTY | Policy allows |
| `workspaces` | SELECT | **ALLOWED** | 2 workspaces |
| `workspace_members` | SELECT | **ALLOWED** | 2 membership rows |
| `workspace_invitations` | SELECT | N/A | Table not migrated yet |
| `script_exports` | SELECT | EMPTY | Policy allows |
| `blog_posts` | SELECT | **ALLOWED** | 3 rows — **includes drafts** (ALL policy overrides intent) |
| `legal_pages` | SELECT | **ALLOWED** | 3 rows — **includes drafts** |

### Expected Results After `rls-production.sql`

| Table | Anon SELECT | Anon INSERT/UPDATE/DELETE | Service Role |
|-------|-------------|---------------------------|--------------|
| `users` | DENIED | DENIED | Full access |
| `scripts` | DENIED | DENIED | Full access |
| `subscriptions` | DENIED | DENIED | Full access |
| `support_tickets` | DENIED | DENIED | Full access |
| `support_messages` | DENIED | DENIED | Full access |
| `referrals` | DENIED | DENIED | Full access |
| `affiliate_payouts` | DENIED | DENIED | Full access |
| `affiliate_payment_methods` | DENIED | DENIED | Full access |
| `ai_settings` | DENIED | DENIED | Full access |
| `email_settings` | DENIED | DENIED | Full access |
| `password_reset_tokens` | DENIED | DENIED | Full access |
| `site_settings` | DENIED | DENIED | Full access |
| `blog_posts` | Published only | DENIED | Full access |
| `legal_pages` | Published only | DENIED | Full access |

Re-run `node scripts/rls-verify.mjs` after migration to confirm.

---

## Per-Table Policy Audit

Risk levels: **CRITICAL** = full data exposure to anon | **HIGH** = sensitive partial exposure | **MEDIUM** = misconfiguration | **LOW** = acceptable

### Core schema (`schema.sql`)

#### `users`

| | |
|---|---|
| **Current policy** | `"Service access users"` — `FOR ALL USING (true) WITH CHECK (true)` (all roles) |
| **Risk** | **CRITICAL** — password hashes, emails, roles readable/writable by anon |
| **Fixed policy** | No anon/authenticated policies. Optional: `"Users read own profile"` / `"Users update own profile"` for JWT `user_id` claim (see migration). Server uses service role. |
| **Test (anon)** | SELECT **ALLOWED** (3 rows, `password_hash` present), INSERT **ALLOWED**, DELETE **ALLOWED** |

#### `scripts`

| | |
|---|---|
| **Current policy** | `"Service access scripts"` — `FOR ALL USING (true)` |
| **Risk** | **CRITICAL** — all user scripts readable/writable by anon |
| **Fixed policy** | Deny by default. `"Users manage own scripts"` — `owns_row(user_id)` for authenticated JWT. |
| **Test (anon)** | SELECT EMPTY (no rows; policy would return all if rows existed) |

#### `subscriptions`

| | |
|---|---|
| **Current policy** | `"Service access subscriptions"` — `FOR ALL USING (true)` |
| **Risk** | **CRITICAL** — Stripe customer/subscription IDs exposed |
| **Fixed policy** | Deny by default. `"Users read own subscriptions"` for authenticated JWT. |
| **Test (anon)** | SELECT **ALLOWED** (2 rows) |

#### `usage_records`

| | |
|---|---|
| **Current policy** | `"Service access usage records"` — `FOR ALL USING (true)` |
| **Risk** | **HIGH** — usage metadata exposed |
| **Fixed policy** | Deny by default. `"Users read own usage"` for authenticated JWT. |
| **Test (anon)** | SELECT EMPTY |

#### `workspaces`

| | |
|---|---|
| **Current policy** | `"Service access workspaces"` — `FOR ALL USING (true)` |
| **Risk** | **HIGH** — workspace names, owner IDs exposed |
| **Fixed policy** | Deny by default. `"Users access own workspaces"` (owner or member). |
| **Test (anon)** | SELECT **ALLOWED** (2 rows) |

#### `workspace_members`

| | |
|---|---|
| **Current policy** | `"Service access workspace members"` — `FOR ALL USING (true)` |
| **Risk** | **HIGH** — membership graph exposed |
| **Fixed policy** | Deny by default. `"Users access workspace members"`. |
| **Test (anon)** | SELECT **ALLOWED** (2 rows) |

#### `script_exports`

| | |
|---|---|
| **Current policy** | `"Service access script exports"` — `FOR ALL USING (true)` |
| **Risk** | **HIGH** |
| **Fixed policy** | Deny by default. `"Users manage own exports"`. |
| **Test (anon)** | SELECT EMPTY |

#### `blog_posts`

| | |
|---|---|
| **Current policies** | `"Public read published blog posts"` — `USING (status = 'published')` **AND** `"Service access blog posts"` — `FOR ALL USING (true)` |
| **Risk** | **HIGH** — ALL policy grants anon read/write on **drafts** |
| **Fixed policy** | Drop ALL policy. Keep only `"Public read published blog posts"` `TO anon, authenticated`. |
| **Test (anon)** | SELECT **ALLOWED** (3 rows — drafts included) |

#### `legal_pages`

| | |
|---|---|
| **Current policies** | `"Public read published legal pages"` + `"Service access legal pages"` `USING (true)` |
| **Risk** | **HIGH** — draft legal content exposed |
| **Fixed policy** | Drop ALL policy. Keep published SELECT only. |
| **Test (anon)** | SELECT **ALLOWED** (3 rows — drafts included) |

---

### Support (`support-schema.sql`)

#### `support_tickets`

| | |
|---|---|
| **Current policies** | `Users select/insert/update own` → `TO authenticated` (uses `auth.uid()` — **inactive**) |
| | `Admins manage all` → `TO authenticated` (**inactive**) |
| | `"Service access support tickets"` → `TO anon USING (true)` |
| **Risk** | **CRITICAL** — all tickets readable by anon |
| **Fixed policy** | Remove anon `USING (true)`. Keep user/admin policies (for future JWT). Server uses service role. |
| **Test (anon)** | SELECT **ALLOWED** (1 ticket) |

#### `support_messages`

| | |
|---|---|
| **Current policies** | Same pattern as tickets; anon `USING (true)` |
| **Risk** | **CRITICAL** — private message bodies exposed |
| **Fixed policy** | Remove anon policy. User/admin policies via `can_access_support_ticket()`. |
| **Test (anon)** | SELECT **ALLOWED** (3 messages) |

**Realtime impact:** `use-support-realtime.ts` uses browser anon client. After hardening, postgres_changes subscriptions will **stop delivering events**. Mitigation: poll `/api/support/tickets/[id]` or issue per-session Supabase JWT with `user_id` claim.

---

### Referrals (`referral-schema.sql`)

#### `referrals`

| | |
|---|---|
| **Current policy** | `"Service access referrals"` — `FOR ALL USING (true)` |
| **Risk** | **CRITICAL** — referrer/referred relationships exposed |
| **Fixed policy** | Deny by default. `"Users read own referrals"` — `referrer_user_id = app_user_id()`. |
| **Test (anon)** | SELECT **ALLOWED** (2 rows) |

#### `affiliate_payouts`

| | |
|---|---|
| **Current policy** | `"Service access affiliate payouts"` — `FOR ALL USING (true)` |
| **Risk** | **CRITICAL** — payout amounts and admin notes exposed |
| **Fixed policy** | Deny by default. `"Users read own payouts"`. |
| **Test (anon)** | SELECT **ALLOWED** (2 rows) |

---

### Affiliate payment methods (`affiliate-payment-methods.sql`)

#### `affiliate_payment_methods`

| | |
|---|---|
| **Current policy** | `"Service access affiliate payment methods"` — `FOR ALL USING (true)` |
| **Risk** | **CRITICAL** — PayPal, bank, crypto wallet details exposed |
| **Fixed policy** | Deny by default. `"Users manage own payment methods"`. |
| **Test (anon)** | SELECT **ALLOWED** (1 row with payment details) |

---

### Email (`email-schema.sql`)

#### `email_settings`

| | |
|---|---|
| **Current policy** | `"Service access email settings"` — `FOR ALL USING (true)` |
| **Risk** | **CRITICAL** — SMTP password readable if row exists |
| **Fixed policy** | No policies (admin-only via service role). |
| **Test (anon)** | SELECT EMPTY (table empty; policy allows) |

#### `email_logs`

| | |
|---|---|
| **Current policy** | `"Service access email logs"` — `FOR ALL USING (true)` |
| **Risk** | **HIGH** — recipient emails exposed |
| **Fixed policy** | No policies (admin-only via service role). |
| **Test (anon)** | SELECT **ALLOWED** (3 rows) |

#### `password_reset_tokens`

| | |
|---|---|
| **Current policy** | `"Service access password reset tokens"` — `FOR ALL USING (true)` |
| **Risk** | **CRITICAL** — token hashes readable |
| **Fixed policy** | No policies (server-only via service role). |
| **Test (anon)** | SELECT EMPTY |

---

### Platform settings

#### `ai_settings` (`ai-settings.sql`)

| | |
|---|---|
| **Current policy** | `"Service access ai settings"` — `FOR ALL USING (true)` |
| **Risk** | **CRITICAL** — Gemini API key exposed in plaintext |
| **Fixed policy** | No policies (admin-only via service role). |
| **Test (anon)** | SELECT **ALLOWED** (1 row with `api_key`) |

#### `site_settings` (`site-settings-schema.sql`)

| | |
|---|---|
| **Current policy** | `"Service access site settings"` — `FOR ALL USING (true)` |
| **Risk** | **HIGH** — arbitrary HTML injection config exposed |
| **Fixed policy** | No policies (server-only). |
| **Test (anon)** | SELECT **ALLOWED** (1 row) |

#### `header_footer_settings` (`header-footer-settings-schema.sql`)

| | |
|---|---|
| **Current policy** | `"Service access header footer settings"` — `FOR ALL USING (true)` |
| **Risk** | **MEDIUM** — CMS nav/footer JSON exposed |
| **Fixed policy** | No policies (server-only). |
| **Test (anon)** | SELECT EMPTY |

---

### Team (`team-workspace.sql`)

#### `workspace_invitations`

| | |
|---|---|
| **Current policy** | `"Service access workspace invitations"` — `FOR ALL USING (true)` |
| **Risk** | **CRITICAL** — invite tokens would be exposed (table not yet migrated) |
| **Fixed policy** | No policies (server-only). |
| **Test (anon)** | Table not found in schema cache |

---

## User / Admin / Anon Access Matrix (Target State)

After applying `supabase/rls-production.sql` **and** setting `SUPABASE_SERVICE_ROLE_KEY`:

| Role | Scripts | Support | Referrals | Payouts | Profile | Admin tables |
|------|---------|---------|-----------|---------|---------|--------------|
| **Anonymous** | Deny | Deny | Deny | Deny | Deny | Deny |
| **User (JWT)** | Own rows | Own tickets | Own referrals | Own payouts | Own row | Deny |
| **Admin (JWT)** | All | All | All | All | All | All |
| **Service role (API)** | All | All | All | All | All | All |

**Today:** User/admin JWT policies are **inactive** because HyperScripter does not issue Supabase JWTs. All user/admin access is correctly enforced in Next.js API routes when `SUPABASE_SERVICE_ROLE_KEY` is set.

---

## Remediation Steps

### 1. Set service role key (required before RLS hardening)

```env
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Supabase Dashboard → Settings → API
```

Without this, API routes use the anon key and **will break** after removing `USING (true)` policies.

### 2. Run production RLS migration

In Supabase SQL Editor, run the full contents of:

```
supabase/rls-production.sql
```

This replaces the minimal `rls-hardening.sql`.

### 3. Verify

```bash
node scripts/rls-verify.mjs
```

All sensitive tables should show `DENIED` or `EMPTY` for anon SELECT. `blog_posts` / `legal_pages` should return only published rows.

### 4. Smoke test application

- [ ] Signup / login
- [ ] Generate script
- [ ] Billing checkout
- [ ] Support ticket create + reply (note: realtime may need polling)
- [ ] Referral dashboard
- [ ] Admin: users, billing, support, AI settings, email settings

### 5. Rotate exposed secrets

Because anon key access was confirmed live, rotate:

- [ ] All user passwords (or force password reset)
- [ ] `ai_settings.api_key` (Gemini)
- [ ] SMTP password in `email_settings`
- [ ] Stripe keys if exposed via user records
- [ ] Consider Supabase anon key rotation (Dashboard → API)

---

## Policy Count Summary

| Category | Count | Action |
|----------|-------|--------|
| `USING (true)` on sensitive tables | 20 | **Remove** |
| Safe public SELECT (published only) | 2 | **Keep** (remove conflicting ALL policies) |
| User-scoped authenticated policies | 6 support + 10 new | **Keep** (future JWT) |
| Admin-only (no policy = deny) | 7 tables | **Correct** |

---

## Files

| File | Purpose |
|------|---------|
| `supabase/rls-production.sql` | Production RLS migration (run in Supabase) |
| `supabase/rls-hardening.sql` | Minimal drop-only migration (superseded) |
| `scripts/rls-verify.mjs` | Automated anon-key access tests |
| `RLS_VERIFICATION_REPORT.md` | This report |

---

## Conclusion

RLS is currently **effectively disabled** on all sensitive tables. The anon key grants full read/write access to user credentials, AI API keys, support conversations, and financial data. This is the **single highest-priority blocker** for production launch.

Apply `rls-production.sql`, configure `SUPABASE_SERVICE_ROLE_KEY`, re-run verification, and rotate any secrets that may have been exposed.
