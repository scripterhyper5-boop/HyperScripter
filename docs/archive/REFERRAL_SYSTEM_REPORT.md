# Referral & Affiliate System — Implementation Report

## Overview

HyperScripter users can invite friends via a unique referral link. Referrers earn **+3 bonus script credits** when a friend signs up, and **20% commission** when that friend subscribes to Pro or Team. Admins manage payouts from **Admin → Growth → Referrals**.

---

## Database Schema

**Migration file:** `supabase/referral-schema.sql`

Run in Supabase SQL Editor **after** `schema.sql`.

### `users.referral_code` (column added)

| Column | Type | Purpose |
|--------|------|---------|
| `referral_code` | TEXT UNIQUE | User's shareable code (e.g. `ABC123`) |

### `referrals`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `referrer_user_id` | TEXT | FK → users (who invited) |
| `referred_user_id` | TEXT | FK → users (who signed up) — **UNIQUE** |
| `referral_code` | TEXT | Code used at signup |
| `status` | TEXT | `pending` or `completed` |
| `reward_credits` | INTEGER | Bonus scripts awarded (default 3) |
| `created_at` | TIMESTAMPTZ | Signup timestamp |

**Constraints:**
- One referral per referred user (`referrals_referred_user_unique`)
- No self-referrals (`referrals_no_self`)

### `affiliate_payouts`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `user_id` | TEXT | FK → referrer |
| `referral_id` | UUID | FK → referrals (unique — one commission per referral) |
| `amount` | NUMERIC(10,2) | Commission in USD |
| `status` | TEXT | `pending` or `paid` |
| `created_at` | TIMESTAMPTZ | Created timestamp |
| `paid_at` | TIMESTAMPTZ | Set when admin marks paid |

---

## APIs

### User

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/referrals` | User | Referral link, stats, history, payouts |

### Admin

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/admin/referrals` | Admin | List referrals + payouts + earnings summary |
| `GET` | `/api/admin/referrals/export` | Admin | Download CSV |
| `PATCH` | `/api/admin/referrals/payouts/[id]` | Admin | Mark payout as paid |

---

## Dashboard Pages

**Route:** `/dashboard/referrals`

**Sidebar:** Account → Referrals

**Sections:**

1. **Referral Link** — `https://hyperscripter.com/signup?ref=ABC123` with Copy button
2. **Statistics** — Total referrals, Active referrals, Credits earned, Pending payouts
3. **Referral History** — Table: User, Date, Status, Reward
4. **Affiliate Payouts** — Commission history with status

**Files:**
- `src/app/dashboard/referrals/page.tsx`
- `src/components/dashboard/referrals-view.tsx`
- `src/components/dashboard/sidebar.tsx`

---

## Admin Pages

**Route:** `/admin/growth/referrals`

**Sidebar:** Growth → Referrals

**Features:**
- Summary cards (total referrals, paid out, pending)
- Search by name, email, or referral code
- Paginated referrals table
- Affiliate payouts table with **Mark Paid** button
- **Export CSV** button

**Files:**
- `src/app/admin/(panel)/growth/referrals/page.tsx`
- `src/components/admin/sidebar.tsx`

---

## Tracking Flow

```
1. User visits /signup?ref=ABC123
   └─ Middleware sets httpOnly cookie `hs_ref=ABC123` (30 days)

2. User completes signup form
   └─ POST /api/auth/signup reads cookie or body referralCode

3. processReferralSignup()
   ├─ Lookup referrer by code
   ├─ Block self-referral
   ├─ Block duplicate (referred user already has referral)
   ├─ Insert referrals row (status: completed, reward_credits: 3)
   └─ Email referrer: "New referral joined"

4. Cookie cleared after successful signup
```

---

## Reward Logic

### Signup bonus (Free → Free)

| Event | Reward |
|-------|--------|
| Referred user signs up | Referrer gets **+3 bonus script credits** |

Bonus credits are added to the referrer's monthly script limit via `getReferralBonusCredits()` in the usage system.

**Constants:** `REFERRAL_SIGNUP_BONUS_CREDITS = 3`

### Commission (Paid subscription)

| Plan | Price | Commission (20%) |
|------|-------|------------------|
| Pro | $19/mo | $3.80 |
| Team | $49/mo | $9.80 |

Triggered when referred user's plan changes to Pro or Team via:
- Stripe webhook / checkout
- Admin manual plan change (via billing sync)

One commission per referral (unique index on `affiliate_payouts.referral_id`).

**Constants:** `REFERRAL_COMMISSION_RATE = 0.2`

---

## Billing Integration

**File:** `src/lib/billing/sync-subscription.ts`

On plan change to `pro` or `team`:
```ts
processReferralCommission(referredUserId, planId)
```

Creates `affiliate_payouts` row (status: `pending`) and sends commission earned email.

---

## Email Notifications

| Event | Function | Recipient |
|-------|----------|-----------|
| Friend signs up | `sendReferralJoinedEmail()` | Referrer |
| Referred user subscribes | `sendCommissionEarnedEmail()` | Referrer |
| Admin marks payout paid | `sendPayoutSentEmail()` | Referrer |

Requires SMTP configured (Email Settings).

---

## Security

| Threat | Prevention |
|--------|------------|
| Self-referral | `referrer_user_id !== referred_user_id` check + DB constraint |
| Duplicate signup reward | Unique index on `referred_user_id` |
| Duplicate commission | Unique index on `affiliate_payouts.referral_id` |
| Invalid referral code | Silently ignored on signup |
| Cookie tampering | Code validated against DB before creating referral |
| Admin-only payout control | `getAdminServerSession()` on admin routes |
| Enumeration on signup | Invalid codes fail silently |

---

## Test Instructions

### 1. Apply migration

Run `supabase/referral-schema.sql` in Supabase SQL Editor.

### 2. Get referral link

1. Sign in as User A
2. Go to **Account → Referrals**
3. Copy link (e.g. `http://localhost:3000/signup?ref=ABC123`)

### 3. Test signup tracking

1. Open link in incognito window
2. Sign up as User B
3. User A should see:
   - Total referrals: 1
   - Credits earned: 3
   - History row for User B
4. User A's script limit should increase by 3

### 4. Test commission

1. Upgrade User B to Pro (Stripe or admin panel)
2. User A should receive commission email
3. Pending payouts shows $3.80
4. Admin → Growth → Referrals shows payout row

### 5. Test admin payout

1. Admin → Growth → Referrals
2. Click **Mark Paid** on pending payout
3. User A receives payout sent email
4. Status changes to `paid`

### 6. Test security

1. Try signing up with your own referral link → blocked
2. Sign up two users with same referrer → both tracked separately
3. Upgrade same referred user twice → only one commission

### 7. Export CSV

1. Admin → Growth → Referrals → **Export CSV**
2. Verify CSV contains referral data

---

## Files Added / Changed

| File | Purpose |
|------|---------|
| `supabase/referral-schema.sql` | Database migration |
| `src/lib/referrals/constants.ts` | Reward constants |
| `src/lib/referrals/types.ts` | TypeScript types |
| `src/lib/referrals/cookie.ts` | Cookie helpers |
| `src/lib/referrals/process-signup.ts` | Signup referral processing |
| `src/lib/referrals/process-commission.ts` | Commission processing |
| `src/lib/db/referrals.ts` | Database layer |
| `src/app/api/referrals/route.ts` | User API |
| `src/app/api/admin/referrals/*` | Admin APIs |
| `src/app/dashboard/referrals/page.tsx` | User dashboard page |
| `src/app/admin/(panel)/growth/referrals/page.tsx` | Admin page |
| `src/lib/auth/middleware.ts` | Referral cookie tracking |
| `src/lib/auth/local-auth.ts` | Signup hook |
| `src/lib/db/usage.ts` | Bonus credits in allowance |
| `src/lib/billing/sync-subscription.ts` | Commission hook |
| `src/lib/email/send-emails.ts` | Referral emails |

---

## Status

✅ Database schema  
✅ Referral link + cookie tracking  
✅ Signup rewards (+3 scripts)  
✅ Commission on Pro/Team (20%)  
✅ User dashboard (Account → Referrals)  
✅ Admin panel (Growth → Referrals)  
✅ CSV export  
✅ Mark payouts as paid  
✅ Email notifications  
✅ Security checks  

**Required before use:** Run `referral-schema.sql` in Supabase.
