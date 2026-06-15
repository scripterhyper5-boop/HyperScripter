# Launch Smoke Test

**Application:** HyperScripter  
**Date:** June 13, 2026  
**Purpose:** Manual pass/fail verification of critical user and admin flows before production launch.

Run this checklist in **staging** first, then repeat in **production** after deploy. Record results in the summary table at the bottom.

---

## Prerequisites

### Environment

| Requirement | Verified |
|-------------|----------|
| `NEXT_PUBLIC_APP_URL` / `APP_URL` set to deployed URL | [ ] |
| `AUTH_SECRET` set (64+ random chars) | [ ] |
| `SUPABASE_SERVICE_ROLE_KEY` set on server | [ ] |
| `GEMINI_API_KEY` or admin AI settings configured | [ ] |
| SMTP configured (for forgot-password + transactional email) | [ ] |
| Stripe keys + price IDs configured (for billing tests) | [ ] |
| Stripe webhook endpoint registered and `STRIPE_WEBHOOK_SECRET` set | [ ] |

### Database migrations (run in Supabase SQL editor)

| Migration | Verified |
|-----------|----------|
| `supabase/schema.sql` | [ ] |
| `supabase/email-schema.sql` | [ ] |
| `supabase/ai-settings.sql` | [ ] |
| `supabase/referral-schema.sql` | [ ] |
| `supabase/support-schema.sql` | [ ] |
| `supabase/site-settings-schema.sql` | [ ] |
| `supabase/header-footer-settings-schema.sql` | [ ] |
| `supabase/rate-limit-schema.sql` (if not using Upstash) | [ ] |
| `supabase/rls-production.sql` | [ ] |

### Test accounts

Create or identify these accounts before starting:

| Role | Suggested email | Notes |
|------|-----------------|-------|
| **Referrer** | `referrer+smoke@test.com` | Will share referral link |
| **Referred user** | `referred+smoke@test.com` | Signs up via referral link |
| **Billing user** | `billing+smoke@test.com` | Free plan, used for upgrade/downgrade |
| **Support user** | `support+smoke@test.com` | Creates support ticket |
| **Admin** | Your admin account | `role = admin` in DB or `ADMIN_EMAIL` match |

Use unique emails per run if re-testing signup. Use incognito / separate browser profiles to avoid session conflicts.

### Stripe test cards (test mode only)

| Action | Card number |
|--------|-------------|
| Successful payment | `4242 4242 4242 4242` |
| Declined | `4000 0000 0000 0002` |

Any future expiry, any CVC, any ZIP.

---

## 1. Authentication

### 1.1 Signup

**Route:** `/signup`  
**API:** `POST /api/auth/signup`

| Step | Action | Expected result | Pass |
|------|--------|-----------------|------|
| 1 | Open `/signup` in incognito | Signup form loads | [ ] |
| 2 | Submit with empty fields | Validation error shown | [ ] |
| 3 | Submit with mismatched passwords | Error message shown | [ ] |
| 4 | Submit valid name, email, password, confirm password | Redirect to `/dashboard` | [ ] |
| 5 | Confirm session cookie set (`hs_session` or app session cookie) | Cookie present, `HttpOnly` | [ ] |
| 6 | Refresh `/dashboard` | Still authenticated | [ ] |
| 7 | Check Supabase `users` table | New row with correct email | [ ] |

**Notes:** Rate limit is 10 signups/hour per IP. Duplicate email returns error.

---

### 1.2 Login

**Route:** `/login`  
**API:** `POST /api/auth/login`

| Step | Action | Expected result | Pass |
|------|--------|-----------------|------|
| 1 | Open `/login` while logged out | Login form loads | [ ] |
| 2 | Submit wrong password | Error shown, no redirect | [ ] |
| 3 | Submit correct email + password | Redirect to `/dashboard` (or `?redirect=` target) | [ ] |
| 4 | Visit `/dashboard` without session | Redirect to `/login?redirect=/dashboard/...` | [ ] |
| 5 | Visit `/login` while already signed in | Redirect to `/dashboard` | [ ] |

**Notes:** Rate limit is 20 login attempts/hour per IP.

---

### 1.3 Logout

**API:** `POST /api/auth/logout`  
**UI:** Dashboard sidebar → Sign out

| Step | Action | Expected result | Pass |
|------|--------|-----------------|------|
| 1 | Click **Sign out** in dashboard sidebar | Redirect to `/login` or home | [ ] |
| 2 | Visit `/dashboard` | Redirect to login | [ ] |
| 3 | Confirm session cookie cleared | Cookie absent or expired | [ ] |
| 4 | `GET /api/auth/me` (while logged out) | `401` or `{ user: null }` | [ ] |

---

### 1.4 Forgot password

**Route:** `/forgot-password` → `/reset-password`  
**API:** `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`

| Step | Action | Expected result | Pass |
|------|--------|-----------------|------|
| 1 | Open `/forgot-password` | Form loads | [ ] |
| 2 | Submit registered email | Success message (same message for unknown email) | [ ] |
| 3 | Check inbox (or email logs in admin) | Reset email received with link | [ ] |
| 4 | Open reset link → `/reset-password?token=...` | Reset form loads | [ ] |
| 5 | Set new password and submit | Success; can log in with new password | [ ] |
| 6 | Try old password | Login fails | [ ] |
| 7 | Try reusing same reset token | Token rejected | [ ] |

**Notes:** Requires SMTP. Rate limit is 5 requests/hour per IP.

---

## 2. Scripts

> **Plan gates:** Script history (`/dashboard/scripts`) and export require **Pro** or **Team**. Generate works on Free (5/month). Use a Pro account for full save + export smoke test.

### 2.1 Generate

**Route:** `/dashboard/generate`  
**API:** `POST /api/generate`

| Step | Action | Expected result | Pass |
|------|--------|-----------------|------|
| 1 | Open `/dashboard/generate` | Generator form loads | [ ] |
| 2 | Submit without topic | Validation error | [ ] |
| 3 | Fill topic + options, click generate | Loading state shown | [ ] |
| 4 | Wait for completion | Redirect to `/dashboard/scripts/{id}` | [ ] |
| 5 | Verify script sections | Hook, intro, main script, CTA, caption, hashtags present | [ ] |
| 6 | Check usage counter | Monthly usage incremented | [ ] |
| 7 | Generate until monthly limit (Free plan) | Limit modal / 429 with friendly message | [ ] |

---

### 2.2 Save

Scripts are persisted automatically on generation when Supabase is configured. Manual edits also save via the script detail page.

| Step | Action | Expected result | Pass |
|------|--------|-----------------|------|
| 1 | Generate a script (Pro/Team account) | Toast: "Script saved to your library" | [ ] |
| 2 | Open `/dashboard/scripts` | Script appears in history list | [ ] |
| 3 | Open script detail `/dashboard/scripts/{id}` | Full script loads | [ ] |
| 4 | Edit title or section text, save | Changes persist after refresh | [ ] |
| 5 | Check Supabase `scripts` table | Row exists with correct `user_id` | [ ] |
| 6 | Log out and back in | Script still visible | [ ] |

---

### 2.3 Export

**Location:** Script detail page → Export TXT / Export DOCX buttons

| Step | Action | Expected result | Pass |
|------|--------|-----------------|------|
| 1 | Open script on **Pro** account | Export buttons enabled | [ ] |
| 2 | Click **Export TXT** | `.txt` file downloads with full script content | [ ] |
| 3 | Click **Export DOCX** | `.docx` file downloads | [ ] |
| 4 | Open downloaded file | Title, hook, intro, CTA, caption, hashtags included | [ ] |
| 5 | On **Free** account | Export buttons locked / upgrade prompt shown | [ ] |

---

## 3. Billing

**Route:** `/dashboard/billing`  
**APIs:** `POST /api/billing/create-checkout-session`, `POST /api/billing/create-portal-session`, `GET /api/billing/subscription`  
**Webhook:** `POST /api/stripe/webhook`

Use the **billing test account** on Free plan. Stripe must be in **test mode** for staging.

### 3.1 Stripe checkout (Free → Pro)

| Step | Action | Expected result | Pass |
|------|--------|-----------------|------|
| 1 | Open `/dashboard/billing` | Current plan shows **Free** | [ ] |
| 2 | Click **Upgrade to Pro** (or equivalent CTA) | Redirect to Stripe Checkout | [ ] |
| 3 | Complete checkout with `4242...` | Redirect to `/dashboard/billing?success=1` | [ ] |
| 4 | Confirm toast: "Subscription updated successfully" | Toast shown | [ ] |
| 5 | Billing page shows **Pro**, status **active** | Plan badge and limits updated | [ ] |
| 6 | Check Stripe Dashboard | Subscription created for customer | [ ] |
| 7 | Check Supabase `subscriptions` table | `plan = pro`, `status = active` | [ ] |
| 8 | Verify webhook delivery in Stripe | `checkout.session.completed` succeeded | [ ] |

---

### 3.2 Upgrade (Pro → Team)

| Step | Action | Expected result | Pass |
|------|--------|-----------------|------|
| 1 | On active Pro subscription, click **Upgrade to Team** | In-app upgrade (no new checkout) OR portal prompt | [ ] |
| 2 | Confirm plan changes to **Team** | Billing page reflects Team | [ ] |
| 3 | Check Stripe subscription | Price/plan updated | [ ] |
| 4 | Check Supabase `users.plan` and `subscriptions` | Both show `team` | [ ] |

---

### 3.3 Stripe portal

| Step | Action | Expected result | Pass |
|------|--------|-----------------|------|
| 1 | On paid plan, click **Manage Subscription** | Redirect to Stripe Customer Portal | [ ] |
| 2 | Portal loads with subscription details | Correct plan and payment method shown | [ ] |
| 3 | Return to app via portal link | Lands on billing page | [ ] |

---

### 3.4 Downgrade

Downgrades are handled through the **Stripe Customer Portal**, not checkout.

| Step | Action | Expected result | Pass |
|------|--------|-----------------|------|
| 1 | Open Stripe portal via **Manage Subscription** | Portal loads | [ ] |
| 2 | Switch plan from Team → Pro (or Pro → cancel) | Change scheduled or applied per Stripe settings | [ ] |
| 3 | Return to app; refresh `/dashboard/billing` | Plan reflects downgrade after webhook sync | [ ] |
| 4 | Check webhook: `customer.subscription.updated` or `deleted` | Event delivered successfully | [ ] |
| 5 | Verify feature gates | Team-only features locked after downgrade | [ ] |

---

## 4. Support

**User route:** `/dashboard/support`  
**Admin route:** `/admin/support`  
**APIs:** `POST /api/support/tickets`, `POST /api/support/tickets/{id}`, `POST /api/admin/support/tickets/{id}`

### 4.1 Create ticket (user)

| Step | Action | Expected result | Pass |
|------|--------|-----------------|------|
| 1 | Log in as support test user | Dashboard loads | [ ] |
| 2 | Open `/dashboard/support` | Support page loads | [ ] |
| 3 | Create ticket: subject + message | Ticket created, appears in list | [ ] |
| 4 | Open ticket thread | User message visible, status **open** | [ ] |
| 5 | Check Supabase `support_tickets` + `support_messages` | Rows created | [ ] |

---

### 4.2 Admin reply

| Step | Action | Expected result | Pass |
|------|--------|-----------------|------|
| 1 | Log in as admin → `/admin/support` | Ticket list loads with new ticket | [ ] |
| 2 | Open ticket thread | User message visible | [ ] |
| 3 | Send admin reply | Reply appears in conversation | [ ] |
| 4 | Update ticket status (e.g. **in progress** → **resolved**) | Status saves | [ ] |
| 5 | Log in as user, open same ticket | Admin reply visible | [ ] |
| 6 | User unread count clears after viewing | Badge/count resets | [ ] |

**Known issue:** Browser realtime hooks may not work after RLS hardening. If replies don't appear live, refresh the page — API polling should still work.

---

## 5. Referrals

**Referrer dashboard:** `/dashboard/referrals`  
**Signup link format:** `{APP_URL}/signup?ref={CODE}`  
**Cookie:** `hs_ref` (set by middleware for 30 days)  
**Tables:** `referrals`, `affiliate_payouts`

### 5.1 Signup with referral

| Step | Action | Expected result | Pass |
|------|--------|-----------------|------|
| 1 | Log in as **referrer**, open `/dashboard/referrals` | Referral code and link displayed | [ ] |
| 2 | Copy link (`/signup?ref=XXXXXX`) | Link copied | [ ] |
| 3 | Open link in incognito (logged out) | Signup page loads | [ ] |
| 4 | Confirm `hs_ref` cookie set (DevTools → Application) | Cookie present | [ ] |
| 5 | Complete signup as **referred user** | Account created, redirect to dashboard | [ ] |
| 6 | Check Supabase `referrals` table | Row: correct `referrer_user_id`, `referred_user_id`, `status = completed` | [ ] |
| 7 | Referrer dashboard shows +1 referral | Count updated | [ ] |
| 8 | Referrer receives bonus credits (+3) | Usage allowance reflects bonus | [ ] |

---

### 5.2 Upgrade referred user

| Step | Action | Expected result | Pass |
|------|--------|-----------------|------|
| 1 | Log in as **referred user** | Dashboard loads | [ ] |
| 2 | Go to `/dashboard/billing`, upgrade to **Pro** | Checkout completes, plan = Pro | [ ] |
| 3 | Webhook processes subscription | `users.plan` and `subscriptions` updated | [ ] |

---

### 5.3 Commission created

Commission = 20% of plan price, created once per referral on first paid upgrade.

| Step | Action | Expected result | Pass |
|------|--------|-----------------|------|
| 1 | After referred user upgrades, check `affiliate_payouts` | Row for referrer with `referral_id`, `amount` (e.g. $3.80 for Pro) | [ ] |
| 2 | Referrer `/dashboard/referrals` | Commission / earnings updated | [ ] |
| 3 | Admin `/admin/growth/referrals` | Referral and payout visible | [ ] |
| 4 | Upgrade same user again or re-sync billing | No duplicate payout (`affiliate_payouts_referral_unique`) | [ ] |
| 5 | Referrer email (if SMTP on) | Commission earned email sent | [ ] |

**SQL verification:**

```sql
SELECT r.*, ap.amount, ap.status
FROM referrals r
LEFT JOIN affiliate_payouts ap ON ap.referral_id = r.id
WHERE r.referred_user_id = '<REFERRED_USER_UUID>';
```

---

## 6. Admin

Log in at `/admin/login`. All panel routes require admin role (server-side check in `admin/(panel)/layout.tsx`).

### 6.1 Users

**Route:** `/admin/users`  
**API:** `GET /api/admin/users`, `PATCH /api/admin/users/{id}`

| Step | Action | Expected result | Pass |
|------|--------|-----------------|------|
| 1 | Open `/admin/users` | User table loads with pagination | [ ] |
| 2 | Search by email | Results filter correctly | [ ] |
| 3 | Sort by created date / plan | Sort works | [ ] |
| 4 | Edit user (name, plan, role) | Changes save and persist | [ ] |
| 5 | Non-admin user visits `/admin/users` | Redirect to admin login or forbidden | [ ] |

---

### 6.2 AI settings

**Route:** `/admin/settings/ai`  
**API:** `GET/PUT /api/admin/ai`, `POST /api/admin/ai/test`

| Step | Action | Expected result | Pass |
|------|--------|-----------------|------|
| 1 | Open AI settings page | Current config loads (masked key) | [ ] |
| 2 | Save valid Gemini API key | Save succeeds | [ ] |
| 3 | Click **Test connection** | Status shows **Connected** | [ ] |
| 4 | Generate a script as user | Generation succeeds with admin-configured key | [ ] |

---

### 6.3 Email settings

**Route:** `/admin/platform/email-settings`  
**API:** `GET/PUT /api/admin/email-settings`, `POST /api/admin/email-settings/test`

| Step | Action | Expected result | Pass |
|------|--------|-----------------|------|
| 1 | Open email settings page | SMTP fields load | [ ] |
| 2 | Save valid SMTP credentials | Save succeeds | [ ] |
| 3 | Send test email | Test email received | [ ] |
| 4 | Check email logs section | Log entry with status **sent** | [ ] |

---

### 6.4 Header / Footer settings

**Route:** `/admin/platform/header-footer`  
**API:** `GET/PUT /api/admin/header-footer`  
**Public:** `GET /api/header-footer`

| Step | Action | Expected result | Pass |
|------|--------|-----------------|------|
| 1 | Open header/footer settings | Current config loads | [ ] |
| 2 | Change header nav label or footer text | Preview/dirty state updates | [ ] |
| 3 | Save changes | Success toast | [ ] |
| 4 | Open public homepage `/` | Updated header/footer visible | [ ] |
| 5 | Discard changes | Reverts to last saved state | [ ] |

---

### 6.5 Blog CMS

**Route:** `/admin/blog`  
**Public:** `/blog`, `/blog/{slug}`  
**API:** `GET/POST /api/admin/blog`, `PATCH/DELETE /api/admin/blog/{id}`

| Step | Action | Expected result | Pass |
|------|--------|-----------------|------|
| 1 | Open `/admin/blog` | Post list loads | [ ] |
| 2 | Create new post (title, slug, content, excerpt) | Post saved | [ ] |
| 3 | Set status to **published** | Status updates | [ ] |
| 4 | Open `/blog` | New post appears in list | [ ] |
| 5 | Open `/blog/{slug}` | Full post renders with correct title and content | [ ] |
| 6 | Edit post from admin | Changes reflect on public page | [ ] |
| 7 | Unpublish or delete post | Removed from public blog index | [ ] |

---

## Pass / Fail Summary

Record **PASS** or **FAIL** for each area. All must pass before launch.

| # | Area | Test | Result | Tester | Date | Notes |
|---|------|------|--------|--------|------|-------|
| 1 | Auth | Signup | [ ] PASS / [ ] FAIL | | | |
| 2 | Auth | Login | [ ] PASS / [ ] FAIL | | | |
| 3 | Auth | Logout | [ ] PASS / [ ] FAIL | | | |
| 4 | Auth | Forgot password | [ ] PASS / [ ] FAIL | | | |
| 5 | Scripts | Generate | [ ] PASS / [ ] FAIL | | | |
| 6 | Scripts | Save | [ ] PASS / [ ] FAIL | | | |
| 7 | Scripts | Export | [ ] PASS / [ ] FAIL | | | |
| 8 | Billing | Upgrade | [ ] PASS / [ ] FAIL | | | |
| 9 | Billing | Downgrade | [ ] PASS / [ ] FAIL | | | |
| 10 | Billing | Stripe checkout | [ ] PASS / [ ] FAIL | | | |
| 11 | Billing | Stripe portal | [ ] PASS / [ ] FAIL | | | |
| 12 | Support | Create ticket | [ ] PASS / [ ] FAIL | | | |
| 13 | Support | Admin reply | [ ] PASS / [ ] FAIL | | | |
| 14 | Referrals | Signup with referral | [ ] PASS / [ ] FAIL | | | |
| 15 | Referrals | Upgrade referred user | [ ] PASS / [ ] FAIL | | | |
| 16 | Referrals | Commission created | [ ] PASS / [ ] FAIL | | | |
| 17 | Admin | Users | [ ] PASS / [ ] FAIL | | | |
| 18 | Admin | AI settings | [ ] PASS / [ ] FAIL | | | |
| 19 | Admin | Email settings | [ ] PASS / [ ] FAIL | | | |
| 20 | Admin | Header/Footer settings | [ ] PASS / [ ] FAIL | | | |
| 21 | Admin | Blog CMS | [ ] PASS / [ ] FAIL | | | |

### Launch decision

| Criteria | Status |
|----------|--------|
| All 21 tests PASS | [ ] |
| No P0/P1 bugs open | [ ] |
| Production env vars verified | [ ] |
| `rls-production.sql` applied | [ ] |
| Stripe live webhook configured (production only) | [ ] |

**Sign-off**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| QA / Tester | | | |
| Engineering | | | |
| Product / Owner | | | |

---

## Quick reference — routes & APIs

| Feature | Page | API |
|---------|------|-----|
| Signup | `/signup` | `POST /api/auth/signup` |
| Login | `/login` | `POST /api/auth/login` |
| Logout | Sidebar | `POST /api/auth/logout` |
| Forgot password | `/forgot-password` | `POST /api/auth/forgot-password` |
| Reset password | `/reset-password` | `POST /api/auth/reset-password` |
| Generate | `/dashboard/generate` | `POST /api/generate` |
| Scripts | `/dashboard/scripts` | `GET /api/scripts` |
| Export | `/dashboard/scripts/{id}` | Client-side download |
| Billing | `/dashboard/billing` | `POST /api/billing/create-checkout-session` |
| Portal | Billing page | `POST /api/billing/create-portal-session` |
| Support (user) | `/dashboard/support` | `POST /api/support/tickets` |
| Support (admin) | `/admin/support` | `POST /api/admin/support/tickets/{id}` |
| Referrals | `/dashboard/referrals` | `GET /api/referrals` |
| Admin users | `/admin/users` | `GET /api/admin/users` |
| AI settings | `/admin/settings/ai` | `PUT /api/admin/ai` |
| Email settings | `/admin/platform/email-settings` | `PUT /api/admin/email-settings` |
| Header/Footer | `/admin/platform/header-footer` | `PUT /api/admin/header-footer` |
| Blog CMS | `/admin/blog` | `POST /api/admin/blog` |

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| 401 on all API calls | Missing `AUTH_SECRET` or expired session | Check env vars; clear cookies |
| Scripts not saving | `SUPABASE_SERVICE_ROLE_KEY` missing | Set in Vercel / `.env.local` |
| Generation fails | No Gemini key | Set `GEMINI_API_KEY` or admin AI settings |
| Checkout button disabled | Stripe not configured | Set `STRIPE_SECRET_KEY`, price IDs |
| Plan not updating after payment | Webhook not receiving events | Verify webhook URL + secret |
| Reset email not sent | SMTP not configured | Configure admin email settings |
| Referral not attributed | Cookie blocked or self-referral | Use incognito; different user |
| Commission missing | Referral row missing or not paid plan | Re-run billing sync; check `referrals` + webhook logs |
| 429 Too Many Requests | Rate limit hit | Wait or use different IP; check Upstash/DB rate limit |
| Admin pages redirect | User not admin role | Set `role = admin` in `users` table |
