# Support Schema Report

**Audit date:** 2026-06-14  
**Error:** `Could not find the table 'public.support_tickets' in the schema cache` (PGRST205)

---

## Executive Summary

| Check | Status |
|---|---|
| `support_tickets` table exists | ❌ **Not migrated** |
| `support_messages` table exists | ❌ **Not migrated** |
| RLS policies defined | ❌ Not applied (tables missing) |
| Indexes defined | ❌ Not applied |
| Foreign keys defined | ❌ Not applied |
| UI / API code | ✅ Implemented |
| Migration file created | ✅ `supabase/support-schema.sql` |

**Root cause:** The support UI and API were built, but `supabase/support.sql` was **never executed** in the Supabase SQL Editor. PostgREST has no schema cache entry for `support_tickets` or `support_messages`.

---

## Live Verification (Before Migration)

```http
GET /rest/v1/support_tickets?select=id&limit=1
```

**Response:**

```json
{
  "code": "PGRST205",
  "message": "Could not find the table 'public.support_tickets' in the schema cache",
  "hint": "Perhaps you meant the table 'public.subscriptions'"
}
```

**Status:** `404`

---

## Audit: Expected Schema

### `support_tickets`

| Column | Type | Constraints |
|---|---|---|
| `id` | UUID PK | `gen_random_uuid()` |
| `user_id` | TEXT FK | → `users(id)` ON DELETE CASCADE |
| `name` | TEXT | NOT NULL |
| `email` | TEXT | NOT NULL, lowercase check |
| `subject` | TEXT | NOT NULL, non-empty |
| `status` | TEXT | `open`, `in_progress`, `answered`, `closed` |
| `user_unread_count` | INTEGER | ≥ 0, default 0 |
| `admin_unread_count` | INTEGER | ≥ 0, default 0 |
| `created_at` | TIMESTAMPTZ | default `now()` |
| `updated_at` | TIMESTAMPTZ | default `now()`, auto-trigger |

### `support_messages`

| Column | Type | Constraints |
|---|---|---|
| `id` | UUID PK | `gen_random_uuid()` |
| `subject` | — | *(on parent ticket)* |
| `ticket_id` | UUID FK | → `support_tickets(id)` ON DELETE CASCADE |
| `sender_type` | TEXT | `user` or `admin` |
| `sender_id` | TEXT FK | → `users(id)` ON DELETE CASCADE |
| `body` | TEXT | NOT NULL, non-empty |
| `read_by_user` | BOOLEAN | default false |
| `read_by_admin` | BOOLEAN | default false |
| `created_at` | TIMESTAMPTZ | default `now()` |

---

## Indexes

### `support_tickets`

| Index | Columns |
|---|---|
| `support_tickets_user_id_idx` | `user_id` |
| `support_tickets_status_idx` | `status` |
| `support_tickets_created_at_idx` | `created_at DESC` |
| `support_tickets_updated_at_idx` | `updated_at DESC` |
| `support_tickets_user_created_idx` | `user_id, created_at DESC` |
| `support_tickets_user_unread_idx` | `user_id, user_unread_count` (partial, unread > 0) |
| `support_tickets_admin_unread_idx` | `admin_unread_count` (partial, unread > 0) |

### `support_messages`

| Index | Columns |
|---|---|
| `support_messages_ticket_id_idx` | `ticket_id` |
| `support_messages_ticket_created_idx` | `ticket_id, created_at ASC` |
| `support_messages_sender_id_idx` | `sender_id` |
| `support_messages_created_at_idx` | `created_at DESC` |

---

## Foreign Keys

| Table | Column | References | On Delete |
|---|---|---|---|
| `support_tickets` | `user_id` | `users(id)` | CASCADE |
| `support_messages` | `ticket_id` | `support_tickets(id)` | CASCADE |
| `support_messages` | `sender_id` | `users(id)` | CASCADE |

---

## RLS Policies

RLS is **enabled** on both tables in `support-schema.sql`.

### Helper functions

| Function | Purpose |
|---|---|
| `auth_user_id()` | Returns `auth.uid()::text` from Supabase JWT |
| `is_support_admin()` | True if JWT user has `role = 'admin'` in `users` |
| `can_access_support_ticket(user_id)` | Admin OR ticket owner |

### `support_tickets` policies

| Policy | Role | Command | Rule |
|---|---|---|---|
| Users select own support tickets | `authenticated` | SELECT | `can_access_support_ticket(user_id)` |
| Users insert own support tickets | `authenticated` | INSERT | `user_id = auth_user_id()` |
| Users update own support tickets | `authenticated` | UPDATE | owner or admin |
| Admins manage all support tickets | `authenticated` | ALL | `is_support_admin()` |
| Service access support tickets | `anon` | ALL | `true` (API fallback) |

### `support_messages` policies

| Policy | Role | Command | Rule |
|---|---|---|---|
| Users select own support messages | `authenticated` | SELECT | parent ticket accessible |
| Users insert own support messages | `authenticated` | INSERT | sender is owner, ticket belongs to user |
| Admins manage all support messages | `authenticated` | ALL | `is_support_admin()` |
| Service access support messages | `anon` | ALL | `true` (API fallback) |

### Security model

| Layer | Enforcement |
|---|---|
| **Primary** | Next.js API routes (`getUserServerSession` / `getAdminServerSession`) |
| **Database (JWT)** | RLS policies when using Supabase Auth `authenticated` role |
| **Server fallback** | `anon` service policies OR `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS) |

**Recommendation:** Uncomment `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` for production. The service role bypasses RLS; API routes remain the authoritative access gate.

---

## Migration File

**Path:** `supabase/support-schema.sql`

**Run order:**

1. `schema.sql` (base tables)
2. `team-workspace.sql` (optional)
3. **`support-schema.sql`** ← run this now

**Ends with:**

```sql
NOTIFY pgrst, 'reload schema';
```

This refreshes the PostgREST schema cache so `/rest/v1/support_tickets` resolves immediately.

---

## Post-Migration Verification

Run in Supabase SQL Editor:

```sql
SELECT * FROM public.support_tickets LIMIT 1;
SELECT * FROM public.support_messages LIMIT 1;
```

Expected: `0 rows` (empty tables, no error).

REST API check:

```http
GET /rest/v1/support_tickets?select=id&limit=1
```

Expected: `200` with `[]`.

App check:

1. Sign in → `/dashboard/support` → create a ticket
2. Sign in as admin → `/admin/support` → view and reply
3. Unread badges update in sidebars

---

## Application Code (Already Implemented)

| Layer | Files |
|---|---|
| DB | `src/lib/db/support.ts` |
| Types | `src/lib/support/types.ts` |
| User API | `/api/support/tickets`, `/api/support/unread` |
| Admin API | `/api/admin/support/tickets`, `/api/admin/support/unread` |
| User UI | `/dashboard/support` |
| Admin UI | `/admin/support` |
| Realtime | `use-support-realtime.ts`, `use-support-unread.ts` |

No application code changes required — only the database migration.

---

## Fix Applied

| Action | Status |
|---|---|
| Created `supabase/support-schema.sql` | ✅ |
| Tables with `created_at`, `updated_at`, `status`, `user_id`, unread counters | ✅ |
| RLS enabled | ✅ |
| User-scoped + admin-scoped policies | ✅ |
| Indexes and foreign keys | ✅ |
| Realtime publication | ✅ |
| `NOTIFY pgrst, 'reload schema'` | ✅ |
| Generated `SUPPORT_SCHEMA_REPORT.md` | ✅ |

---

## Next Step

Open [Supabase SQL Editor](https://supabase.com/dashboard/project/jvinzixeqnmtvjhizsqv/sql), paste the contents of `supabase/support-schema.sql`, and run it.

Then verify:

```sql
SELECT * FROM support_tickets LIMIT 1;
```
