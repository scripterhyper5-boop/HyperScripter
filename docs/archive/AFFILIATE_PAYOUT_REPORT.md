# Affiliate Payout Management Report

**Date:** June 14, 2026  
**Feature:** User payout settings + admin payout management

---

## Overview

Referrers can now save how they want to receive commission payouts. Admins see full payout information when processing pending commissions — no more opaque user IDs.

---

## Database Schema

**Migration file:** `supabase/affiliate-payment-methods.sql`  
**Run after:** `referral-schema.sql`

### `affiliate_payment_methods`

One row per user (PK = `user_id`).

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | TEXT PK → `users.id` | Owner |
| `preferred_method` | TEXT | `paypal`, `bank`, `wise`, `binance`, `usdt` |
| `paypal_email` | TEXT | PayPal email |
| `bank_account` | TEXT | Bank account details |
| `wise_email` | TEXT | Wise email |
| `binance_uid` | TEXT | Binance UID |
| `usdt_wallet` | TEXT | USDT wallet address |
| `created_at` | TIMESTAMPTZ | First save |
| `updated_at` | TIMESTAMPTZ | Last update |

### `affiliate_payouts` (extended)

| Column | Type | Description |
|--------|------|-------------|
| `payment_notes` | TEXT | Admin notes when marking paid (transaction ID, etc.) |

---

## APIs

### User — Payout Settings

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/account/payout-settings` | User session | Load current payout methods |
| PUT | `/api/account/payout-settings` | User session | Save / update payout methods |

**PUT body:**

```json
{
  "preferredMethod": "paypal",
  "paypalEmail": "user@example.com",
  "bankAccount": null,
  "wiseEmail": null,
  "binanceUid": null,
  "usdtWallet": null
}
```

**Validation:**
- PayPal / Wise emails must be valid email format
- If `preferredMethod` is set, that method's field must be filled
- All fields trimmed, max 500 characters
- User can only access their own record (session `user.id`)

### Admin — Referrals & Payouts

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/admin/referrals` | Admin session | Referrals list + enriched payouts |
| PATCH | `/api/admin/referrals/payouts/[id]` | Admin session | Mark payout paid + optional notes |

**PATCH body:**

```json
{
  "paymentNotes": "PayPal TXN-12345 sent June 14"
}
```

**Behavior:**
- Only `pending` → `paid` transition allowed
- Sets `paid_at` timestamp
- Stores `payment_notes` (max 2000 chars)
- Sends payout confirmation email to user

---

## User Settings Page

**Route:** `/dashboard/settings/payout`  
**Navigation:** Dashboard → Settings → Payout settings (sub-nav tab)

### Fields saved

- PayPal Email
- Bank Account
- Wise Email
- Binance UID
- USDT Wallet
- Preferred payout method (selector chips)

### Related UI

- `/dashboard/settings` — Account tab with sub-nav to Payout settings
- `/dashboard/referrals` — Banner linking to Payout settings when user has commissions

**Files:**
- `src/app/dashboard/settings/payout/page.tsx`
- `src/components/account/payout-settings-form.tsx`

---

## Admin Payout Management

**Route:** `/admin/growth/referrals`

### Affiliate Payouts table (updated)

| Column | Source |
|--------|--------|
| User | `users.full_name` + `users.email` |
| Amount | `affiliate_payouts.amount` |
| Preferred method | `affiliate_payment_methods.preferred_method` |
| Payout details | Value for preferred method (e.g. PayPal email) |
| Status | `pending` / `paid` |
| Notes | `affiliate_payouts.payment_notes` |
| Actions | View, Mark paid |

### Actions

1. **View Payout Details** — Modal showing all saved methods with preferred highlighted
2. **Mark Paid** — Modal with payment notes field; confirms and emails user
3. **Payment Notes** — Visible in table and detail modal for paid payouts

**Files:**
- `src/app/admin/(panel)/growth/referrals/page.tsx`
- `src/lib/db/referrals.ts` — `listAdminPayoutsEnriched()`, `markAffiliatePayoutPaid()`
- `src/lib/db/affiliate-payment-methods.ts`

---

## Security Checks

| Check | Implementation |
|-------|----------------|
| User auth | `requireUserSession()` on payout settings API |
| Admin auth | `getAdminServerSession()` on admin referral/payout APIs |
| User isolation | Payment methods keyed by session `user.id` only |
| Input validation | Email format, required preferred method detail, field length limits |
| Payout state | Mark paid only from `pending`; idempotent via DB `eq('status', 'pending')` |
| Notes length | Payment notes capped at 2000 characters |
| RLS | Service-role access policy (same pattern as referrals) |
| No secrets in logs | Payout details only returned to authenticated user/admin |

---

## Library Files

| File | Purpose |
|------|---------|
| `src/lib/referrals/payment-types.ts` | Types, labels, detail helper |
| `src/lib/referrals/payment-validation.ts` | Server-side validation |
| `src/lib/db/affiliate-payment-methods.ts` | CRUD for payment methods |

---

## Migration Steps

1. Open Supabase SQL Editor
2. Run `supabase/affiliate-payment-methods.sql`
3. Restart dev server
4. Users: Settings → Payout settings → save methods
5. Admin: Growth → Referrals → view/process payouts

---

## Test Checklist

- [ ] User saves PayPal as preferred method
- [ ] User saves multiple methods, switches preferred
- [ ] Validation rejects invalid email
- [ ] Admin sees user name/email instead of user ID
- [ ] Admin View shows all payment methods
- [ ] Admin Mark Paid with notes updates status
- [ ] Paid payout shows notes in table
- [ ] User receives payout email after mark paid

---

*End of report.*
