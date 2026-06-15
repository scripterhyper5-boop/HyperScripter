# Referral Billing Audit Report

## Problem

A referred user upgraded to a paid plan (Pro/Team), but the referrer only received the signup reward (+3 script credits). No affiliate commission appeared in pending payouts, statistics, or referral history.

---

## Audit Summary

| Check | Expected | Finding |
|-------|----------|---------|
| `referrals` row exists | `referrer_user_id`, `referred_user_id`, `status=completed` | ✅ Signup flow creates this correctly |
| `referred_user_id` on paid upgrade | Used to find referral | ✅ Logic exists in `processReferralCommission` |
| Referral status `completed` | Required for commission | ✅ Set on signup |
| Stripe webhooks wired | `checkout.session.completed`, `subscription.*` | ✅ Handlers present |
| Commission on paid upgrade | `affiliate_payouts` row created | ❌ **Often skipped** (see root causes) |
| Dashboard stats | Pending payouts + commission in history | ❌ **Incomplete UI + missing payouts** |
| Admin plan upgrade | Commission awarded | ❌ **Missing entirely** |

---

## Root Causes

### 1. Commission gated on `previousPlan !== plan` (Primary bug)

**File:** `src/lib/billing/sync-subscription.ts`

Commission only ran inside:

```ts
if (previousPlan !== plan) {
  if (plan === "pro" || plan === "team") {
    processReferralCommission(...)
  }
}
```

**Why this fails:**

| Scenario | What happens |
|----------|--------------|
| Duplicate Stripe webhooks | First event sets plan to `pro` and may award commission; second event sees `pro → pro` and **skips commission** |
| Webhook order reversed | `checkout.session.completed` runs after `subscription.updated` already set `pro` → commission skipped |
| In-app upgrade then webhook | `create-checkout-session` calls `syncStripeSubscription` synchronously; webhook arrives later with `pro → pro` → skipped |
| Plan already `pro` in DB | Any sync where plan doesn't change → **no commission attempt** |

The commission function itself is **idempotent** (checks `affiliate_payouts.referral_id` unique), but it was never called when the plan didn't change.

### 2. Admin plan upgrades never triggered commission (Secondary bug)

**File:** `src/lib/db/users.ts` → `updateUserByAdmin()`

When an admin changed a user's plan to Pro/Team, only a billing notification email was sent. **`processReferralCommission` was never called.**

This matches the reported symptom if the referred user was upgraded via **Admin → Users → Edit**.

### 3. Stripe price ID mismatch could leave plan as `free` during sync

**File:** `src/lib/billing/sync-subscription.ts` → `effectivePlanFromSubscription()`

Plan was resolved **only** from `STRIPE_PRICE_PRO` / `STRIPE_PRICE_TEAM` env vars. If the Stripe subscription price ID didn't match env, sync returned `free` even for active subscriptions — while checkout metadata contained `plan: pro`.

Subscription metadata (`userId`, `plan`) was set on checkout but **not used as fallback** during subscription sync.

### 4. Dashboard didn't surface commission in referral history

**File:** `src/components/dashboard/referrals-view.tsx`

Referral history only showed `+3 scripts`. Commission lived in a separate payouts section (if any). Stats had `pendingPayouts` but no total commission or per-referral commission column.

---

## Data Flow (Before Fix)

```
User signs up with ?ref=CODE
  → referrals row created (status: completed, reward_credits: 3) ✅

Referred user upgrades to Pro
  → Stripe webhook OR admin panel
  → syncStripeSubscription / updateUserByAdmin
  → IF previousPlan !== plan AND plan is pro/team
       → processReferralCommission  ← often skipped
  → affiliate_payouts row NOT created ❌
  → Dashboard shows only +3 scripts ❌
```

---

## Fixes Applied

### Fix 1: Always attempt commission on paid plan sync (idempotent)

**File:** `src/lib/billing/sync-subscription.ts`

- Added `applyPlanSyncRewards()` helper
- Plan-change emails still require `previousPlan !== plan`
- **Commission always attempted when final plan is `pro` or `team`**, regardless of previous plan
- Safe because `processReferralCommission` skips if payout already exists

```ts
await updateUserPlan(userId, plan);
await applyPlanSyncRewards(userId, previousPlan, plan);
// commission runs inside applyPlanSyncRewards when plan is paid
```

### Fix 2: Admin plan upgrades award commission

**File:** `src/lib/db/users.ts`

When admin changes plan to Pro/Team:

```ts
awardReferralCommissionForPlan(userId, input.plan)
```

### Fix 3: Stripe metadata fallback for plan detection

**File:** `src/lib/billing/sync-subscription.ts`

```ts
return planFromStripePriceId(priceId) ?? metaPlan ?? "free";
```

Uses `subscription.metadata.plan` when price ID env vars don't match.

### Fix 4: Self-healing reconcile on dashboard load

**Files:**
- `src/lib/referrals/reconcile-commissions.ts` (new)
- `src/lib/db/referrals.ts` → `getUserReferralsView()`
- `src/app/api/admin/referrals/route.ts`

On referrals page load, scans referrals where referred user is on Pro/Team but has no payout → creates missing `affiliate_payouts` rows.

**Fixes existing broken records** without manual DB edits.

### Fix 5: Enhanced logging

**File:** `src/lib/referrals/process-commission.ts`

Structured console logs for skip reasons and successful payout creation:

```
[referral-commission] skip — no referral record
[referral-commission] skip — payout already exists
[referral-commission] created payout { amount, referralId, ... }
```

### Fix 6: Dashboard shows commission in history + stats

**Files:**
- `src/lib/referrals/types.ts` — added `commissionAmount`, `commissionStatus`, `totalCommissionEarned`
- `src/lib/db/referrals.ts` — joins payouts to referral rows
- `src/components/dashboard/referrals-view.tsx` — Reward column shows scripts + commission

---

## Expected Records After Fix

### Referral record (`referrals`)

| Column | Example |
|--------|---------|
| `referrer_user_id` | User A (referrer) |
| `referred_user_id` | User B (referred) |
| `referral_code` | `ABC123` |
| `status` | `completed` |
| `reward_credits` | `3` |

### Subscription record (`users` + `subscriptions`)

| Field | After Pro upgrade |
|-------|-------------------|
| `users.plan` | `pro` |
| `subscriptions.plan` | `pro` |
| `subscriptions.status` | `active` |

### Payout record (`affiliate_payouts`)

| Column | Pro ($19) | Team ($49) |
|--------|-----------|------------|
| `user_id` | Referrer ID | Referrer ID |
| `referral_id` | Referral UUID | Referral UUID |
| `amount` | `3.80` | `9.80` |
| `status` | `pending` | `pending` |

---

## Webhook Handler Verification

| Event | Handler | Commission path |
|-------|---------|-----------------|
| `checkout.session.completed` | `handleCheckoutSessionCompleted` | → `syncStripeSubscriptionById` → `applyPlanSyncRewards` ✅ |
| `checkout.session.completed` (no sub ID) | metadata fallback | → `applyPlanSyncRewards` ✅ |
| `customer.subscription.created` | `syncStripeSubscription` | → `applyPlanSyncRewards` ✅ |
| `customer.subscription.updated` | `syncStripeSubscription` | → `applyPlanSyncRewards` ✅ (even if plan unchanged) |
| In-app upgrade | `create-checkout-session` → `syncStripeSubscription` | → `applyPlanSyncRewards` ✅ |
| Admin user edit | `updateUserByAdmin` | → `awardReferralCommissionForPlan` ✅ |

---

## Test Instructions

### 1. Verify existing broken referral (backfill)

1. Sign in as referrer
2. Open **Account → Referrals**
3. Reconcile runs automatically on page load
4. Confirm:
   - Pending payouts shows `$3.80` (Pro) or `$9.80` (Team)
   - Referral history shows commission line under +3 scripts
   - Affiliate Payouts section lists the pending row

### 2. Test new Stripe upgrade

1. Create User B via referrer link
2. Upgrade User B to Pro via billing checkout
3. Check server logs for `[referral-commission] created payout`
4. Referrer dashboard shows commission within one page refresh

### 3. Test admin upgrade

1. Create referred user (free)
2. Admin → Users → change plan to Pro
3. Confirm `affiliate_payouts` row created for referrer

### 4. Test idempotency (duplicate webhooks)

1. Trigger multiple Stripe webhook events for same subscription
2. Confirm only **one** `affiliate_payouts` row per referral
3. Logs show `skip — payout already exists` on subsequent calls

### 5. Database verification

```sql
-- Referral exists
SELECT * FROM referrals WHERE referred_user_id = '<user-b-id>';

-- Payout created
SELECT * FROM affiliate_payouts
WHERE referral_id = (SELECT id FROM referrals WHERE referred_user_id = '<user-b-id>');

-- Referred user on paid plan
SELECT plan FROM users WHERE id = '<user-b-id>';
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/lib/billing/sync-subscription.ts` | Decouple commission from plan-change guard; metadata fallback |
| `src/lib/db/users.ts` | Admin plan upgrade → commission |
| `src/lib/referrals/process-commission.ts` | Logging + `awardReferralCommissionForPlan()` |
| `src/lib/referrals/reconcile-commissions.ts` | **New** — backfill missing payouts |
| `src/lib/db/referrals.ts` | Reconcile on load; commission in referral rows |
| `src/lib/referrals/types.ts` | Commission fields in types/stats |
| `src/components/dashboard/referrals-view.tsx` | Show commission in history |
| `src/app/api/admin/referrals/route.ts` | Global reconcile on admin load |

---

## Status

✅ Root cause identified (commission gated on plan change + missing admin hook)  
✅ Idempotent commission on every paid-plan sync  
✅ Admin upgrades award commission  
✅ Stripe metadata fallback for plan detection  
✅ Backfill reconcile for existing broken referrals  
✅ Dashboard shows commission in history and stats  
✅ Structured logging for debugging  

**Action for user:** Open **Account → Referrals** as the referrer to trigger backfill for the existing referred paid user. Future upgrades will award commission automatically.
