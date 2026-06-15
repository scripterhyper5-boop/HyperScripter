# Team API Failure Report

**Audit date:** 2026-06-14  
**User:** `admin@hyperscripter.com` (team plan, workspace owner)

---

## Summary

The browser console showed `[team-api] request failed {}` because:

1. **Logging was incomplete** — only `path`, `status`, `code`, and `error` were logged; when the response body had no `error` field, the log appeared empty/useless.
2. **Errors were masked client-side** — `friendlyTeamError()` returned `"Something went wrong. Please try again."` when `data.error` was missing.
3. **Server errors were swallowed in DB layer** — `listWorkspaceMemberScripts()` threw a generic `"Failed to load team scripts"` instead of the Supabase message.
4. **Two endpoints were actually failing** — `/api/team/members` and `/api/team/scripts` returned 500 due to missing database schema from an unapplied migration.

---

## Manual API Verification (After Fixes)

### GET /api/team/workspace — **200 OK**

```json
{
  "workspace": {
    "id": "62bdb16c-6814-4d23-90c0-c0bba4538648",
    "name": "HyperScripter Admin's Workspace",
    "slug": "hyperscripter-admin-a1000000",
    "ownerId": "a1000000-0000-4000-8000-000000000001",
    "createdAt": "2026-06-14T07:13:40.446458+00:00"
  },
  "role": "owner",
  "memberCount": 1,
  "owner": {
    "userId": "a1000000-0000-4000-8000-000000000001",
    "name": "HyperScripter Admin",
    "email": "admin@hyperscripter.com"
  }
}
```

### GET /api/team/members — **500 → 200 OK** (after fix)

**Before fix:**

| Field | Value |
|---|---|
| Status | `500` |
| Response body | `{"error":"Could not find the table 'public.workspace_invitations' in the schema cache","stack":"..."}` |
| Stack trace | `listWorkspaceInvitations` → `GET /api/team/members` |

**After fix:**

```json
{
  "members": [
    {
      "id": "74e73fef-fd13-4094-a7c5-cf7c7c942706",
      "userId": "a1000000-0000-4000-8000-000000000001",
      "name": "HyperScripter Admin",
      "email": "admin@hyperscripter.com",
      "avatarUrl": null,
      "role": "owner",
      "joinedAt": "2026-06-14T07:13:40.690826+00:00",
      "initials": "HA"
    }
  ],
  "invitations": []
}
```

### GET /api/team/scripts — **500 → 200 OK** (after fix)

**Before fix:**

| Field | Value |
|---|---|
| Status | `500` |
| Response body | `{"error":"Failed to load team scripts","stack":"..."}` |
| Server log | `column scripts.shared_with_workspace does not exist` (code `42703`) |
| Stack trace | `listWorkspaceMemberScripts` → `GET /api/team/scripts` |

**After fix:**

```json
{
  "scripts": [],
  "role": "owner"
}
```

### GET /api/team/analytics — **200 OK** (always worked)

```json
{
  "totalMembers": 1,
  "scriptsGenerated": 0,
  "scriptsThisMonth": 0,
  "mostActiveMember": null
}
```

---

## Failing Endpoints (Root Cause)

| Endpoint | Status (before) | Root cause |
|---|---|---|
| `/api/team/members` | 500 | `workspace_invitations` table does not exist — `supabase/team-workspace.sql` not applied |
| `/api/team/scripts` | 500 | `scripts.shared_with_workspace` column does not exist — same migration not applied |

**Why `/dashboard/team` failed in the browser:**

`useTeamWorkspace()` calls `Promise.all([fetchTeamWorkspace(), fetchTeamMembers(), fetchTeamAnalytics()])`. A single failure in `fetchTeamMembers()` caused the entire hook to reject, even though workspace and analytics succeeded.

---

## Fixes Applied

### 1. Client logging (`src/lib/api/team-client.ts`)

Replaced sparse logging with full diagnostics:

```javascript
console.error("[team-api] request failed", {
  endpoint: path,
  status: response?.status,
  statusText: response?.statusText,
  body,
  error,
});
```

Added `TeamApiError` class with `endpoint`, `status`, `statusText`, `body`, and `message`.

### 2. Server try/catch (all 4 Team API routes)

Each handler wrapped in `try/catch` via `teamApiErrorResponse()`:

- `src/app/api/team/workspace/route.ts`
- `src/app/api/team/members/route.ts`
- `src/app/api/team/scripts/route.ts`
- `src/app/api/team/analytics/route.ts`

Returns `{ error, stack }` in development on 500.

### 3. Browser-visible diagnostics

`DataError` now accepts a `details` prop. On failure, team pages show:

```
Endpoint:
/api/team/members

Status:
500 Internal Server Error

Message:
Could not find the table 'public.workspace_invitations' in the schema cache
```

Hooks expose `errorDetails` via `useTeamFetch()`.

### 4. DB layer schema fallbacks (`src/lib/db/workspaces.ts`)

| Function | Fallback |
|---|---|
| `listWorkspaceInvitations()` | Returns `[]` when table missing (logs warning to run migration) |
| `listWorkspaceMemberScripts()` | Retries without `shared_with_workspace` column; surfaces real Supabase error message |

### 5. Error message surfacing

`listWorkspaceMemberScripts()` now throws `error.message` instead of generic `"Failed to load team scripts"`.

---

## Required Migration (Recommended)

For full team features (invitations, script sharing), run in Supabase SQL Editor:

```
supabase/team-workspace.sql
```

This creates:

- `workspace_invitations` table
- `scripts.workspace_id` column
- `scripts.shared_with_workspace` column

Until applied, invitations will show as empty and scripts will report `shared: false`.

---

## Files Changed

| File | Change |
|---|---|
| `src/lib/api/team-client.ts` | `TeamApiError`, full console logging, diagnostic formatting |
| `src/lib/team/api-error-response.ts` | **New** — shared 500 handler with stack trace |
| `src/app/api/team/workspace/route.ts` | try/catch wrapper |
| `src/app/api/team/members/route.ts` | try/catch wrapper |
| `src/app/api/team/scripts/route.ts` | try/catch wrapper |
| `src/app/api/team/analytics/route.ts` | try/catch wrapper |
| `src/lib/db/workspaces.ts` | Schema fallbacks + real error messages |
| `src/hooks/use-team-fetch.ts` | `errorDetails` state |
| `src/hooks/use-team-workspace.ts` | Expose `errorDetails` |
| `src/hooks/use-team-members.ts` | Expose `errorDetails` |
| `src/hooks/use-team-scripts.ts` | Expose `errorDetails` |
| `src/components/ui/data-state.tsx` | `DataError` details display |
| `src/components/dashboard/team/*.tsx` | Browser diagnostics on error |

---

## Result

| Check | Status |
|---|---|
| All 4 Team API endpoints return 200 | ✅ |
| Console logs show endpoint, status, body | ✅ |
| Browser shows endpoint/status/message on failure | ✅ |
| Server logs full stack trace in development | ✅ |
| TypeScript passes | ✅ |

**Next step:** Run `supabase/team-workspace.sql` in Supabase SQL Editor to enable invitations and script sharing.
