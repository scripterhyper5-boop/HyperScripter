# Team Workspace Debug Report

**Audit date:** 2026-06-14  
**Environment:** Local dev with Supabase (`jvinzixeqnmtvjhizsqv.supabase.co`)

---

## Executive Summary

| Check | Result |
|---|---|
| `workspaces` table exists | ✅ Yes (1 row) |
| `workspace_members` table exists | ✅ Yes (1 row) |
| Workspace row created for admin team user | ✅ Yes |
| Membership row created for admin team user | ✅ Yes |
| `owner_id` matches logged-in user id | ✅ Yes |
| RLS blocking inserts (anon key) | ✅ No — inserts work |
| `SUPABASE_SERVICE_ROLE_KEY` configured | ⚠️ No (commented out in `.env.local`) |

**Conclusion:** Workspace auto-creation **does work** against the live Supabase database. The prior "No workspace found" issue was caused by API logic returning 404 before creation ran. That is fixed. This audit adds structured logging, a debug endpoint, and explicit Supabase error surfacing.

---

## Live Database Verification

Probe run against Supabase using `NEXT_PUBLIC_SUPABASE_ANON_KEY`:

```
users:              OK rows=2
workspaces:         OK rows=1
workspace_members:  OK rows=1
```

### Admin team user (`admin@hyperscripter.com`)

| Field | Value |
|---|---|
| User ID | `a1000000-0000-4000-8000-000000000001` |
| Plan | `team` |
| Workspace ID | `62bdb16c-6814-4d23-90c0-c0bba4538648` |
| Workspace name | `HyperScripter Admin's Workspace` |
| `owner_id` | `a1000000-0000-4000-8000-000000000001` |
| **owner_id matches user id** | ✅ **true** |
| Membership role | `owner` |
| Membership `workspace_id` | matches workspace id ✅ |

### FK constraint test

Insert with non-existent `owner_id` correctly fails:

```
23503 — violates foreign key constraint "workspaces_owner_id_fkey"
```

### Join query test

`workspace_members` → `workspaces(*)` join works correctly for membership lookup.

---

## Scenario Verification

| Scenario | Expected | Status |
|---|---|---|
| **Existing team user** (admin) | Workspace + membership in DB | ✅ Verified in DB |
| **Team signup** | `ensureTeamWorkspaceForUser` on signup | ✅ Code path + logging added |
| **Free/Pro → Team upgrade** | `updateUserPlan` triggers creation | ✅ Code path + logging added |
| **Page load without workspace** | Auto-create via `requireTeamAccess` | ✅ Fixed in prior + logging added |

---

## Logging Added

All logs use prefix `[team-workspace]` as JSON.

### `ensureTeamWorkspaceForUser()`

Logs:

- `userId`, `plan`, `fullName`
- `workspaceFound` (true/false)
- `workspaceCreated` (true/false)
- `membershipCreated` (true/false)
- `ownerIdMatches` (true/false)
- `workspaceId`

Events: `start`, `found_owned`, `found_membership`, `plan_denied`, `created`

### `requireTeamAccess()`

Logs:

- `userId`, `plan`, `workspaceFound`, `hasTeamPlan`
- After ensure: `workspaceCreated`, `ownerIdMatches`
- On failure: `stage`, `supabaseCode`, `supabaseMessage`
- On success: `role`, `membershipExists`

### `GET /api/team/workspace`

Logs request + success with `workspaceId`, `ownerId`, `ownerIdMatches`, `memberCount`.

### Signup / upgrade

- `signup.team_workspace` / `signup.team_workspace_failed`
- `updateUserPlan.team_workspace` / `updateUserPlan.team_workspace_failed`

---

## Error Handling (no silent failures)

### `WorkspaceCreationError`

New error class captures:

- `stage`: `supabase_client` \| `workspace_insert` \| `membership_insert` \| `membership_verify` \| `plan_check`
- `supabaseCode`, `supabaseMessage`, `hint`, `userId`

### API responses on failure

```json
{
  "error": "Failed to create workspace: <message>",
  "code": "WORKSPACE_CREATION_FAILED",
  "details": {
    "stage": "workspace_insert",
    "supabaseCode": "42501",
    "supabaseMessage": "...",
    "userId": "..."
  }
}
```

Membership insert failures now **throw** instead of logging and continuing silently.

---

## Debug Route

**`GET /api/debug/team`** (requires login)

Returns:

```json
{
  "user": { "id", "email", "name", "plan", "role" },
  "plan": "team",
  "workspaceExists": true,
  "workspaceId": "62bdb16c-...",
  "ownerId": "a1000000-...",
  "ownerIdMatchesUser": true,
  "membershipExists": true,
  "membershipRole": "owner",
  "supabase": {
    "configured": true,
    "clientReady": true,
    "usingServiceRole": false
  },
  "lookup": {
    "ownedWorkspaceFound": true,
    "membershipWorkspaceFound": true
  },
  "lastError": null
}
```

### How to test

1. Sign in as `admin@hyperscripter.com` / `admin123`
2. Open: `http://localhost:3000/api/debug/team`
3. Check server console for `[team-workspace]` log lines
4. Visit `/dashboard/team` and confirm workspace loads

---

## Known Configuration Notes

### `SUPABASE_SERVICE_ROLE_KEY` not set

`.env.local` has the service role key **commented out**. The app falls back to the anon key.

- **Current impact:** None — RLS policies in `schema.sql` use `USING (true) WITH CHECK (true)` for workspaces/members, so anon key can read/write.
- **Recommendation:** Uncomment and set `SUPABASE_SERVICE_ROLE_KEY` for production so server writes are not dependent on permissive RLS.

### Tables required

Ensure these were applied in Supabase SQL Editor:

- `supabase/schema.sql` — `workspaces`, `workspace_members`
- `supabase/team-workspace.sql` — invitations + script sharing columns

---

## Failure Modes & Fixes

| Failure | Symptom | Fix |
|---|---|---|
| Tables missing | `42P01 relation does not exist` | Run `schema.sql` |
| User not in `users` table | `23503` FK on `owner_id` | User must exist before workspace insert |
| Duplicate slug | `23505` unique on slug | Handled — re-fetches existing workspace |
| No team plan | `plan_check` error | Upgrade user to `team` plan |
| RLS deny (strict policies) | `42501` permission denied | Set service role key or fix RLS policies |
| Orphan workspace (no member row) | 403 not a member | `ensureOwnerMembership` repairs on access |

---

## Files Changed

| File | Purpose |
|---|---|
| `src/lib/team/workspace-log.ts` | Structured `[team-workspace]` logging |
| `src/lib/team/workspace-errors.ts` | `WorkspaceCreationError` with Supabase details |
| `src/lib/team/workspace-debug.ts` | `getTeamWorkspaceDebugState()` |
| `src/lib/db/workspaces.ts` | Logging, explicit errors, membership verify |
| `src/lib/team/require-team-access.ts` | Logging, `WORKSPACE_CREATION_FAILED` response |
| `src/app/api/team/workspace/route.ts` | Request/success logging |
| `src/app/api/debug/team/route.ts` | **New** debug endpoint |
| `src/lib/auth/local-auth.ts` | Signup workspace logging |
| `src/lib/db/users.ts` | Upgrade workspace logging |
| `src/lib/api/team-client.ts` | Surface `WORKSPACE_CREATION_FAILED` message |

---

## Answers to Audit Questions

| Question | Answer |
|---|---|
| Workspace row created? | ✅ Yes — verified for admin team user |
| Membership row created? | ✅ Yes — owner role verified |
| `owner_id` matches user? | ✅ Yes |
| Exact failure if not? | Now returned via `WORKSPACE_CREATION_FAILED` + `details` |
| Silent failures removed? | ✅ Yes — membership errors throw |

---

## Next Steps (optional)

1. Uncomment `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
2. Sign in and hit `/api/debug/team` after any team flow change
3. Watch server logs for `[team-workspace]` during signup/upgrade/page load
4. Remove `/api/debug/team` before production deploy (temporary debug route)
