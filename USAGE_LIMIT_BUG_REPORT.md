# Usage Limit Bug Report

**Date:** 2026-06-14  
**Bug:** Free and Pro plans incorrectly displayed "Unlimited" scripts remaining

---

## Root Cause

The dashboard treated **`limit === null`** as "Unlimited", but non-admin users were receiving `limit: null` from the client-side loading path — not from the API.

### Primary issue: `EMPTY_SCRIPT_ALLOWANCE`

```typescript
// BEFORE (broken)
export const EMPTY_SCRIPT_ALLOWANCE = {
  used: 0,
  limit: null,      // ← interpreted as Unlimited
  remaining: null,
  allowed: true,
};
```

Used when:
- Auth is still loading (`user === null`)
- `usePlan()` finished `refreshUsage()` before user was available

### Secondary issue: `use-plan.ts` timing

```typescript
// BEFORE
const [usageLoading, setUsageLoading] = useState(Boolean(user)); // false when user=null
```

Timeline for a Free/Pro user:
1. Page mounts, `user = null` (auth loading)
2. `allowance = EMPTY_SCRIPT_ALLOWANCE` (`limit: null`)
3. `refreshUsage()` runs with no user → sets `usageLoading = false`
4. Dashboard renders: `usageLoading = false`, `limit = null` → **"Unlimited"**
5. Auth completes, API returns correct limits — but user may have already seen "Unlimited"

### Tertiary issue: UI checked `limit === null` instead of admin status

`dashboard-stats.tsx`:

```typescript
// BEFORE (broken)
allowance.limit === null ? "Unlimited" : String(allowance.remaining ?? 0)
```

Any transient `null` limit (loading state, empty allowance) showed "Unlimited" — even for Free/Pro users.

### Server-side was mostly correct

`/api/usage` already returned numeric limits for non-admin users:

```json
{ "used": 0, "limit": 5, "remaining": 5, "allowed": true }
```

The bug was primarily **client-side display logic** and **loading-state defaults**.

### Removed dead code path

`buildScriptUsageAllowance()` had a fallback for `PLANS[planId].monthlyScriptLimit === null` that returned unlimited. No plan uses `null` limits, but this path could mask misconfiguration. Removed — only admins get unlimited now.

---

## Fix Applied

### 1. Added explicit `unlimited` flag

Only admin users return `unlimited: true` with `limit: null` and `remaining: null`.

| Plan | limit | remaining | unlimited |
|---|---|---|---|
| Free | 5 | 5 - used | false |
| Pro | 100 | 100 - used | false |
| Team | 500 | 500 - used | false |
| Admin | null | null | true |

### 2. Fixed `EMPTY_SCRIPT_ALLOWANCE`

No longer uses `null` limits. Uses `limit: 0, remaining: 0, unlimited: false` as a neutral loading placeholder (dashboard shows "—" while loading).

### 3. Fixed `use-plan.ts`

- Waits for `authLoading` before marking usage as loaded
- `usageLoading = authLoading || usageLoading` — shows "—" until both auth and usage API complete
- Syncs plan-based fallback when user/plan changes
- Passes `user` to `getScriptAllowanceFallback()` for admin detection

### 4. Fixed UI to use `allowance.unlimited`

- `dashboard-stats.tsx` — "Unlimited" only when `allowance.unlimited === true`
- `dashboard-overview.tsx` — upgrade banner skips unlimited accounts
- `script-generator-form.tsx` — usage counter hidden only for unlimited (admin)

### 5. Removed plan-based unlimited fallback

`buildScriptUsageAllowance()` and `getScriptAllowanceFallback()` no longer return unlimited for `monthlyScriptLimit === null`. Non-admin plans always get numeric limits.

---

## Before / After Values

### Free user (used = 0)

| Field | Before (UI) | After (UI) | API (after) |
|---|---|---|---|
| limit | null → "Unlimited" | 5 | 5 |
| remaining | null → "Unlimited" | 5 | 5 |
| unlimited | undefined | false | false |

### Free user (used = 3)

| Field | Before | After |
|---|---|---|
| remaining | "Unlimited" (if loading bug hit) | 2 |
| display | Unlimited | 2 |

### Pro user (used = 25)

| Field | Before | After |
|---|---|---|
| limit | null (loading) / 100 (API) | 100 |
| remaining | "Unlimited" (loading) / 75 (API) | 75 |

### Team user (used = 120)

| Field | Before | After |
|---|---|---|
| limit | 500 | 500 |
| remaining | 380 | 380 |

### Admin user

| Field | Before | After |
|---|---|---|
| limit | null | null |
| remaining | null | null |
| display | Unlimited | Unlimited |
| unlimited | undefined | true |

---

## Files Changed

| File | Change |
|---|---|
| `src/lib/db/usage.ts` | Added `unlimited` flag; admin-only null limits; removed plan-null unlimited branch |
| `src/lib/plans/usage.ts` | Fixed `EMPTY_SCRIPT_ALLOWANCE`; admin-aware fallback; numeric limits for all plans |
| `src/hooks/use-plan.ts` | Auth-loading guard; sync fallback on user/plan change; parse `unlimited` from API |
| `src/components/dashboard/dashboard-stats.tsx` | Use `allowance.unlimited` instead of `limit === null` |
| `src/components/dashboard/dashboard-overview.tsx` | Upgrade banner checks `!allowance.unlimited` |
| `src/components/dashboard/script-generator-form.tsx` | Usage counter checks `!allowance.unlimited` |

---

## API Verification

### GET `/api/usage` — Free user

```json
{
  "plan": "free",
  "planName": "Free",
  "used": 0,
  "limit": 5,
  "remaining": 5,
  "allowed": true,
  "unlimited": false
}
```

### GET `/api/usage` — Admin user

```json
{
  "plan": "team",
  "planName": "Team",
  "used": 0,
  "limit": null,
  "remaining": null,
  "allowed": true,
  "unlimited": true
}
```

---

## Result

| Check | Status |
|---|---|
| Free shows numeric remaining (5 - used) | ✅ |
| Pro shows numeric remaining (100 - used) | ✅ |
| Team shows numeric remaining (500 - used) | ✅ |
| Admin shows "Unlimited" | ✅ |
| Loading state shows "—" not "Unlimited" | ✅ |
| TypeScript passes | ✅ |
