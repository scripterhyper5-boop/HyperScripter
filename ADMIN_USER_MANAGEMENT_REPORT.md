# Admin User Management Report

**Date:** 2026-06-14  
**Route:** `/admin/users`

---

## Summary

Full user management has been added to the Admin Panel. Admins can search, sort, paginate, edit users, reset passwords (bcrypt hash only — never displayed), and delete users with cascade cleanup.

| Feature | Status |
|---|---|
| Edit button per user | ✅ |
| Edit Full Name, Email, Role, Plan | ✅ |
| Reset Password (new + confirm) | ✅ |
| Passwords never displayed | ✅ |
| Delete user with confirmation | ✅ |
| Cascade delete related data | ✅ |
| Search | ✅ |
| Pagination | ✅ |
| Sorting | ✅ |

---

## UI Features

### Users table (`/admin/users`)

- **Search** — debounced server-side filter on name and email
- **Sorting** — clickable column headers: Name, Email, Plan, Role, Created
- **Pagination** — page size 10/25/50, Previous/Next, "Showing X–Y of Z"
- **Actions** — Edit and Delete buttons per row

### Edit User modal

Fields:
- Full Name
- Email
- Role (`user` / `admin`)
- Plan (`free` / `pro` / `team`)

Separate **Reset Password** section:
- New Password
- Confirm Password
- Note: "Passwords are stored as bcrypt hashes and cannot be viewed"

Buttons:
- **Save Changes** — updates profile via `PATCH /api/admin/users/[id]`
- **Reset Password** — sets new bcrypt hash via `POST /api/admin/users/[id]/password`

### Delete User modal

- Confirmation requires typing the user's email
- Lists data that will be removed:
  - Subscriptions
  - Scripts
  - Usage records
  - Workspace memberships
  - Owned workspaces
  - User account

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/users` | Paginated user list |
| `PATCH` | `/api/admin/users/[id]` | Update name, email, role, plan |
| `POST` | `/api/admin/users/[id]/password` | Reset password (bcrypt hash) |
| `DELETE` | `/api/admin/users/[id]` | Delete user and related data |

### GET `/api/admin/users` query params

| Param | Default | Description |
|---|---|---|
| `search` | — | Filter by name or email |
| `page` | `1` | Page number |
| `pageSize` | `10` | Items per page (5–100) |
| `sortBy` | `createdAt` | `name`, `email`, `plan`, `role`, `createdAt` |
| `sortDir` | `desc` | `asc` or `desc` |

**Response:**

```json
{
  "users": [{ "id", "name", "email", "plan", "role", "createdAt" }],
  "total": 3,
  "page": 1,
  "pageSize": 10,
  "totalPages": 1
}
```

`password_hash` is **never** included in any response.

### PATCH `/api/admin/users/[id]`

**Body:**

```json
{
  "name": "Full Name",
  "email": "user@example.com",
  "role": "user",
  "plan": "pro"
}
```

**Guards:**
- Cannot demote self from admin
- Cannot demote/delete the last admin
- Email uniqueness validated

**Side effect:** Upgrading to `team` plan auto-creates workspace via `ensureTeamWorkspaceForUser()`.

### POST `/api/admin/users/[id]/password`

**Body:**

```json
{
  "password": "newpassword",
  "confirmPassword": "newpassword"
}
```

**Process:**
1. Validate min 8 characters
2. Validate passwords match
3. `password_hash = bcrypt(newPassword, 12 rounds)`
4. Update `users.password_hash` in Supabase

### DELETE `/api/admin/users/[id]`

**Explicit deletion order:**
1. `subscriptions` (where `user_id`)
2. `scripts` (where `user_id`)
3. `usage_records` (where `user_id`)
4. `workspace_members` (where `user_id`)
5. `workspaces` (where `owner_id`)
6. `users` (row)

**Guards:**
- Cannot delete own account
- Cannot delete last admin

---

## Security

| Rule | Implementation |
|---|---|
| Passwords never displayed | No API returns `password_hash`; UI uses `type="password"` inputs only |
| Password storage | `bcryptjs` with 12 salt rounds (`src/lib/auth/password.ts`) |
| Admin auth | `getAdminServerSession()` on all routes |
| Self-protection | Cannot delete self or demote self from admin |
| Last admin protection | Cannot delete/demote the only admin |

---

## Files Created / Modified

| File | Change |
|---|---|
| `src/app/admin/(panel)/users/page.tsx` | Full rewrite with search, sort, pagination, actions |
| `src/components/admin/user-edit-modal.tsx` | **New** — edit + reset password modal |
| `src/components/admin/user-delete-modal.tsx` | **New** — delete confirmation modal |
| `src/app/api/admin/users/route.ts` | Paginated GET with query params |
| `src/app/api/admin/users/[id]/route.ts` | **New** — PATCH, DELETE |
| `src/app/api/admin/users/[id]/password/route.ts` | **New** — POST reset password |
| `src/lib/db/users.ts` | `listUsersForAdminPaginated`, `updateUserByAdmin`, `resetUserPasswordByAdmin`, `deleteUserByAdmin`, `countAdminUsers` |
| `src/lib/admin/types.ts` | Pagination and update types |

---

## Manual Verification

Tested as `admin@hyperscripter.com`:

- [x] `GET /api/admin/users?page=1&pageSize=10` — returns paginated list
- [x] `PATCH /api/admin/users/[id]` — updates plan (pro → reverted to free)
- [x] `POST /api/admin/users/[id]/password` — returns `{ success: true }`
- [x] TypeScript passes (`npx tsc --noEmit`)

---

## Usage

1. Sign in at `/admin/login` as an admin user
2. Go to **Users** in the sidebar
3. Use search, sort, and pagination to find users
4. Click **Edit** to update profile or reset password
5. Click **Delete** to remove a user (type email to confirm)

---

## Result

Admin User Management is fully functional with secure password handling, cascade deletion, and server-side search/sort/pagination.
