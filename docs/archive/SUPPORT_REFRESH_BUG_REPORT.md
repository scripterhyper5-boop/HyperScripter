# Support Refresh Bug Report

**Date:** 2026-06-14  
**Bug:** Support page continuously reloading every 1–2 seconds

---

## Root Cause

A **realtime feedback loop** between ticket fetch and mark-as-read updates.

### The loop

```
1. User selects ticket
2. GET /api/support/tickets/[id]  →  markSupportTicketReadByUser()
3. UPDATE support_tickets (user_unread_count = 0, updated_at changes)
4. Realtime listener fires on UPDATE support_tickets
5. onUpdate() → loadThread() + loadTickets()
6. loadTickets sets loading=true → full page "Loading tickets..." flash
7. GET /api/support/tickets/[id] again → step 2 repeats
```

Even when `user_unread_count` was already `0`, the mark-read function still ran an `UPDATE`, which triggered the `updated_at` trigger and fired Supabase Realtime `UPDATE` events.

### Contributing factors

| Issue | File | Effect |
|---|---|---|
| Realtime subscribed to `UPDATE` on `support_tickets` | `use-support-realtime.ts` | Every mark-read refetch retriggered realtime |
| `markSupportTicketReadByUser` always UPDATEs ticket | `src/lib/db/support.ts` | No-op writes still changed `updated_at` |
| `loadTickets()` always set `loading=true` | `support-view.tsx` | Visible reload flash on every realtime event |
| Inline `onUpdate` callback | `support-view.tsx` | Unstable dependency (re-subscribe risk) |
| `useSupportUnread` listened to `*` on `support_tickets` | `use-support-unread.ts` | Sidebar refetched on every ticket UPDATE |

### Not found

- No `setInterval()` in support code
- No `useSupportTickets()` or `useSupportConversation()` hooks (logic is inline in views)
- No explicit polling intervals

---

## APIs Repeatedly Called

During the loop, these fired every 1–2 seconds:

| API | Trigger |
|---|---|
| `GET /api/support/tickets` | `loadTickets()` from realtime `onUpdate` |
| `GET /api/support/tickets/[id]` | `loadThread()` from realtime `onUpdate` |
| `GET /api/support/unread` | Sidebar `useSupportUnread` on ticket `UPDATE` events |

Console logging now shows:

```
[support-api] fetch { path: "/api/support/tickets", method: "GET" }
[support-api] fetch { path: "/api/support/tickets/<id>", method: "GET" }
[support-realtime] new message received { ticketId, messageId }
[support-unread] fetching { scope, path }
```

---

## Files Causing Loop

| File | Role |
|---|---|
| `src/hooks/use-support-realtime.ts` | **Primary** — `UPDATE support_tickets` subscription |
| `src/components/dashboard/support-view.tsx` | **Primary** — refetch + loading flash on every realtime event |
| `src/lib/db/support.ts` | **Secondary** — unconditional mark-read UPDATEs |
| `src/hooks/use-support-unread.ts` | **Secondary** — `*` events on all ticket updates |
| `src/app/admin/(panel)/support/page.tsx` | Same pattern as user view |

---

## Fix Applied

### 1. `use-support-realtime.ts`

- **Removed** `UPDATE` listener on `support_tickets`
- **Kept only** `INSERT` on `support_messages` (new messages only)
- Stabilized callback with `useRef` (effect depends only on `ticketId`)
- Added `console.log("[support-realtime] new message received", ...)`

### 2. `use-support-unread.ts`

- **Removed** `event: "*"` on `support_tickets`
- **Kept only** `INSERT` on `support_messages`
- Stabilized refresh with `useRef`
- Added `console.log("[support-unread] fetching", ...)`

### 3. `src/lib/db/support.ts`

- `markSupportTicketReadByUser()` — **no-op** if `userUnreadCount === 0`
- `markSupportTicketReadByAdmin()` — **no-op** if `adminUnreadCount === 0`
- Ticket UPDATE uses `.gt("unread_count", 0)` guard

### 4. `support-view.tsx` + admin support page

- `loadTickets({ silent: true })` — no loading spinner on realtime refresh
- `loadThread(id, { silent: true })` — no conversation spinner on realtime refresh
- Stable `handleRealtimeUpdate` via `useCallback`
- Initial load still shows loading states once

### 5. API client logging

- `support-client.ts` — `console.log("[support-api] fetch", { path, method })`
- `admin-support-client.ts` — same logging

---

## Behavior After Fix

| Action | Fetches |
|---|---|
| Page load | `GET /api/support/tickets` once |
| Select ticket | `GET /api/support/tickets/[id]` once |
| New message (realtime INSERT) | Silent refetch of thread + ticket list |
| Sidebar unread | Refetch only on new message INSERT |
| Polling | None |

---

## Verification

1. Open `/dashboard/support`
2. Open browser console
3. Confirm **one** `[support-api] fetch` for `/api/support/tickets` on load
4. Select a ticket — **one** fetch for `/api/support/tickets/[id]`
5. No repeated fetches every 1–2 seconds while idle
6. Send a reply from admin — **one** realtime-triggered silent refetch

---

## Result

| Check | Status |
|---|---|
| Tickets load once on page load | ✅ |
| Conversation loads once on selection | ✅ |
| No polling | ✅ |
| Realtime updates only on new messages | ✅ |
| Infinite fetch loop prevented | ✅ |
| Console logging for API retriggers | ✅ |
| TypeScript passes | ✅ |
