# Support System Report

**Date:** 2026-06-14

---

## Summary

A complete support ticket system has been implemented for users and admins, with Supabase Realtime for instant message delivery and unread badges in both sidebars.

| Area | Status |
|---|---|
| User page `/dashboard/support` | ✅ |
| Admin page `/admin/support` | ✅ |
| Database tables | ✅ |
| API routes | ✅ |
| Realtime messaging | ✅ |
| Unread badges | ✅ |
| Security (user/admin scoping) | ✅ |

---

## Tables Created

**Migration file:** `supabase/support-schema.sql`

### `support_tickets`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | TEXT FK → `users.id` | ON DELETE CASCADE |
| `name` | TEXT | Contact name |
| `email` | TEXT | Contact email (lowercase) |
| `subject` | TEXT | Ticket subject |
| `status` | TEXT | `open`, `in_progress`, `answered`, `closed` |
| `user_unread_count` | INTEGER | Unread messages for user |
| `admin_unread_count` | INTEGER | Unread messages for admin |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | Auto-updated via trigger |

**Indexes:** `user_id`, `status`, `created_at DESC`, `user_id + created_at`, `admin_unread_count` (partial)

### `support_messages`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `ticket_id` | UUID FK → `support_tickets.id` | ON DELETE CASCADE |
| `sender_type` | TEXT | `user` or `admin` |
| `sender_id` | TEXT FK → `users.id` | ON DELETE CASCADE |
| `body` | TEXT | Message content |
| `read_by_user` | BOOLEAN | |
| `read_by_admin` | BOOLEAN | |
| `created_at` | TIMESTAMPTZ | |

**Indexes:** `ticket_id`, `ticket_id + created_at`, `sender_id`

### Realtime

Both tables added to `supabase_realtime` publication.

---

## APIs Created

### User APIs

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/support/tickets` | List current user's tickets |
| `POST` | `/api/support/tickets` | Create ticket (name, email, subject, message) |
| `GET` | `/api/support/tickets/[id]` | Get ticket + messages, mark user read |
| `POST` | `/api/support/tickets/[id]` | User reply |
| `GET` | `/api/support/unread` | Total unread count for user |

### Admin APIs

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/support/tickets` | Paginated list with search + status filter |
| `GET` | `/api/admin/support/tickets/[id]` | Ticket + messages, mark admin read |
| `PATCH` | `/api/admin/support/tickets/[id]` | Change status and/or send reply |
| `GET` | `/api/admin/support/unread` | Total unread count for admin |

---

## Pages Created

| Route | Component | Features |
|---|---|---|
| `/dashboard/support` | `SupportView` | Create ticket, ticket history, conversation, reply |
| `/admin/support` | `AdminSupportPage` | Ticket list, search, status filter, details, reply, status change |

### Shared components

| File | Purpose |
|---|---|
| `src/components/support/support-conversation.tsx` | Message thread UI |
| `src/components/support/support-status-badge.tsx` | Status badges (Open, In Progress, Answered, Closed) |

---

## Realtime Channels

| Channel | Scope | Events |
|---|---|---|
| `support-ticket-{ticketId}` | Conversation view | `INSERT` on `support_messages`, `UPDATE` on `support_tickets` |
| `support-unread-user-{userId}` | User sidebar badge | `*` on `support_tickets`, `INSERT` on `support_messages` |
| `support-unread-admin-all` | Admin sidebar badge | `*` on `support_tickets`, `INSERT` on `support_messages` |

**Client hooks:**
- `useSupportTicketRealtime(ticketId, onUpdate)` — refreshes conversation on new messages
- `useSupportUnread(scope, userId?)` — polls API + listens for realtime updates

---

## Permissions

| Role | Access |
|---|---|
| **User** | Create tickets, view own tickets only, reply to own open tickets |
| **Admin** | View all tickets, reply, change status |

**Enforcement:**
- User APIs: `getUserServerSession()` + `ticket.userId === session.user.id`
- Admin APIs: `getAdminServerSession()` (role === `admin`)
- Closed tickets: users cannot reply
- User reply reopens `answered`/`closed` tickets to `open`
- Admin reply sets status to `answered`

---

## Unread Badges

| Location | Source |
|---|---|
| User sidebar → Support | Sum of `user_unread_count` across user's tickets |
| Admin sidebar → Support | Sum of `admin_unread_count` across all tickets |
| Ticket list (user) | Per-ticket `userUnreadCount` badge |
| Ticket list (admin) | Per-ticket `adminUnreadCount` badge |

Marking read:
- User opens ticket → `user_unread_count = 0`, messages `read_by_user = true`
- Admin opens ticket → `admin_unread_count = 0`, messages `read_by_admin = true`

---

## Status Workflow

| Status | Label | Typical use |
|---|---|---|
| `open` | Open | New ticket or user replied |
| `in_progress` | In Progress | Admin is working on it |
| `answered` | Answered | Admin replied |
| `closed` | Closed | Resolved, no more user replies |

---

## Files Created / Modified

### Created

| File |
|---|
| `supabase/support-schema.sql` |
| `src/lib/support/types.ts` |
| `src/lib/db/support.ts` |
| `src/lib/api/support-client.ts` |
| `src/lib/api/admin-support-client.ts` |
| `src/hooks/use-support-unread.ts` |
| `src/hooks/use-support-realtime.ts` |
| `src/components/support/support-conversation.tsx` |
| `src/components/support/support-status-badge.tsx` |
| `src/components/dashboard/support-view.tsx` |
| `src/app/dashboard/support/page.tsx` |
| `src/app/admin/(panel)/support/page.tsx` |
| `src/app/api/support/tickets/route.ts` |
| `src/app/api/support/tickets/[id]/route.ts` |
| `src/app/api/support/unread/route.ts` |
| `src/app/api/admin/support/tickets/route.ts` |
| `src/app/api/admin/support/tickets/[id]/route.ts` |
| `src/app/api/admin/support/unread/route.ts` |

### Modified

| File | Change |
|---|---|
| `src/components/dashboard/sidebar.tsx` | Added Support nav + unread badge |
| `src/components/admin/sidebar.tsx` | Added Support nav + unread badge |
| `supabase/README.md` | Documented support migration |

---

## Setup

Run in Supabase SQL Editor (after `schema.sql`):

```
supabase/support-schema.sql
```

Ensure Realtime is enabled for the project in Supabase Dashboard → Database → Replication.

---

## Verification

- [x] TypeScript passes (`npx tsc --noEmit`)
- [ ] Run `support.sql` in Supabase
- [ ] Create ticket as user at `/dashboard/support`
- [ ] Reply as admin at `/admin/support`
- [ ] Verify realtime updates without page refresh
- [ ] Verify unread badges in both sidebars

---

## Result

Full support ticket system with user and admin interfaces, conversation threading, status management, realtime updates, and secure access controls.
