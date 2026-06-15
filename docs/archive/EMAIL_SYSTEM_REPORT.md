# Email Notification System — Implementation Report

## Overview

HyperScripter now has a complete email notification system powered by **Nodemailer**. Admins configure SMTP from **Admin → Platform → Email Settings**. All outbound emails are logged to `email_logs`.

---

## Database Schema

**Migration file:** `supabase/email-schema.sql`

Run in Supabase SQL Editor **after** `schema.sql`.

### `email_settings` (single row)

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `smtp_host` | TEXT | SMTP server hostname |
| `smtp_port` | INTEGER | SMTP port (default 587) |
| `smtp_username` | TEXT | SMTP username |
| `smtp_password` | TEXT | Encrypted SMTP password |
| `sender_name` | TEXT | From display name |
| `sender_email` | TEXT | From email address |
| `created_at` | TIMESTAMPTZ | Created timestamp |
| `updated_at` | TIMESTAMPTZ | Auto-updated on save |

Enforced single row via `email_settings_singleton_idx`.

### `email_logs`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `recipient` | TEXT | Destination email |
| `subject` | TEXT | Email subject |
| `status` | TEXT | `sent` or `failed` |
| `error_message` | TEXT | Error details when failed |
| `created_at` | TIMESTAMPTZ | Send attempt time |

### `password_reset_tokens`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `user_id` | TEXT | FK → `users.id` |
| `token_hash` | TEXT | SHA-256 hash of reset token |
| `expires_at` | TIMESTAMPTZ | 1-hour expiry |
| `used_at` | TIMESTAMPTZ | Set when consumed |
| `created_at` | TIMESTAMPTZ | Created timestamp |

**Security:** SMTP password encrypted with AES-256-GCM (same as AI API keys via `AUTH_SECRET`).

---

## APIs Created

### Admin — Email Settings

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/admin/email-settings` | Admin | Load SMTP settings (password masked) |
| `PUT` | `/api/admin/email-settings` | Admin | Save SMTP settings |
| `POST` | `/api/admin/email-settings/test` | Admin | Send test email + verify SMTP |

### Admin — Email Logs

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/admin/email-logs` | Admin | List logs (`?status=sent\|failed&page=1`) |

### Password Reset

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/auth/forgot-password` | Public | Request reset link |
| `GET` | `/api/auth/reset-password?token=` | Public | Validate token |
| `POST` | `/api/auth/reset-password` | Public | Set new password |

---

## Email Library (`src/lib/email/`)

| File | Purpose |
|------|---------|
| `types.ts` | Shared TypeScript types |
| `get-app-url.ts` | Base URL for links (`NEXT_PUBLIC_APP_URL` → `APP_URL` → `siteConfig.url`) |
| `transport.ts` | Nodemailer transporter, `sendEmail()`, logging |
| `send-emails.ts` | All send functions + templates |
| `notify.ts` | Billing helpers + fire-and-forget wrapper |
| `templates/layout.ts` | HTML email layout + button helper |
| `index.ts` | Public exports |

### Send Functions

| Function | Trigger |
|----------|---------|
| `sendWelcomeEmail()` | User signup |
| `sendSupportTicketCreatedEmail()` | User creates support ticket |
| `sendSupportReplyEmail()` | Admin replies → user; User replies → admin(s) |
| `sendPasswordResetEmail()` | Forgot password request |
| `sendBillingEmail()` | Plan change or subscription cancellation |
| `sendTestEmail()` | Admin test button |

---

## Email Templates

All templates use a dark-themed HTML layout (`templates/layout.ts`) with:

- Branded header
- Body content
- CTA button (where applicable)
- Footer

| Template | Subject | Key content |
|----------|---------|-------------|
| Welcome | `Welcome to HyperScripter` | User name + dashboard link |
| Support ticket created | `Support ticket received — {subject}` | Confirmation + ticket link |
| Support reply (to user) | `Reply on your ticket — {subject}` | Message preview + dashboard link |
| Support reply (to admin) | `User replied — {subject}` | Message preview + admin link |
| Password reset | `Reset your HyperScripter password` | 1-hour reset link |
| Plan changed | `Your HyperScripter plan has been updated` | Old/new plan + billing link |
| Subscription cancelled | `Your HyperScripter subscription has been cancelled` | Free plan notice + billing link |
| Test email | `HyperScripter — Test Email` | SMTP verification message |

---

## Admin Pages

**Route:** `/admin/platform/email-settings`

**Sidebar:** Platform → Email Settings

**Sections:**
1. SMTP configuration (host, port, username, password, sender name, sender email)
2. Test Email button (optional recipient; defaults to admin session email)
3. Email Logs table with filters: **All / Sent / Failed**

**Files:**
- `src/app/admin/(panel)/platform/email-settings/page.tsx`
- `src/components/admin/sidebar.tsx` (menu entry)

---

## Auth Pages

| Page | Route | Status |
|------|-------|--------|
| Forgot Password | `/forgot-password` | Updated (sends real emails) |
| Reset Password | `/reset-password?token=` | **New** |

**Files:**
- `src/app/(auth)/reset-password/page.tsx`
- `src/components/auth/reset-password-form.tsx`
- `src/lib/auth/constants.ts` — added `resetPassword` route
- `src/lib/auth/middleware.ts` — reset page allowed for guests

---

## Integration Points

| Event | Hook location |
|-------|---------------|
| User signup | `src/lib/auth/local-auth.ts` → `sendWelcomeEmail()` |
| Support ticket created | `POST /api/support/tickets` |
| User support reply | `POST /api/support/tickets/[id]` → emails all admins |
| Admin support reply | `PATCH /api/admin/support/tickets/[id]` → emails ticket owner |
| Stripe plan sync | `src/lib/billing/sync-subscription.ts` → `notifyPlanChange()` |
| Checkout completed | `handleCheckoutSessionCompleted()` → `notifyPlanChange()` |
| Subscription deleted | `handleSubscriptionDeleted()` → `notifySubscriptionCancelled()` |
| Admin manual plan change | `updateUserByAdmin()` in `src/lib/db/users.ts` |

Emails are sent **fire-and-forget** — failures are logged but never block the main request.

---

## Security Checks

| Check | Implementation |
|-------|----------------|
| Admin-only SMTP settings | `getAdminServerSession()` on all `/api/admin/email-*` routes |
| Admin-only email logs | Same |
| SMTP password encrypted at rest | `encryptApiKey()` before DB save |
| Password never returned in GET | `smtpPasswordConfigured` boolean only |
| Reset tokens hashed | SHA-256 in DB; raw token only in email link |
| Token expiry | 1 hour; single-use via `used_at` |
| Forgot password enumeration-safe | Always returns success message |
| Non-admin cannot access settings UI | Admin panel layout enforces admin role |

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `AUTH_SECRET` | Encrypt SMTP password (required) |
| `ADMIN_EMAIL` | Admin notification recipient |
| `NEXT_PUBLIC_APP_URL` | Base URL for email links (recommended for local dev: `http://localhost:3000`) |
| `APP_URL` | Server-side fallback for email links |

---

## Test Instructions

### 1. Apply migration

```sql
-- Run supabase/email-schema.sql in Supabase SQL Editor
```

### 2. Configure SMTP (Admin)

1. Sign in as admin
2. Go to **Platform → Email Settings**
3. Enter SMTP credentials (e.g. Gmail App Password, SendGrid, Mailtrap)
4. Click **Save Changes**
5. Click **Send Test Email**
6. Confirm log shows **sent** status

### 3. Welcome email

1. Sign up a new user at `/signup`
2. Check inbox for welcome email with dashboard link
3. Verify entry in Email Logs

### 4. Support emails

1. As user: create a ticket at `/dashboard/support`
2. Confirm ticket confirmation email
3. As admin: reply at `/admin/support`
4. Confirm user receives reply email
5. As user: reply again
6. Confirm admin receives notification

### 5. Password reset

1. Visit `/forgot-password`
2. Enter registered email
3. Open reset link from email
4. Set new password at `/reset-password?token=...`
5. Sign in with new password

### 6. Billing emails

1. Upgrade a user plan via Stripe checkout or admin user edit
2. Confirm plan change email
3. Cancel subscription via Stripe portal
4. Confirm cancellation email

### 7. Email log filters

1. Open Email Settings page
2. Click **Sent** — only successful deliveries
3. Click **Failed** — only failures with error messages

### 8. Security

```bash
# Non-admin → 401
curl http://localhost:3000/api/admin/email-settings

# Public forgot-password always succeeds
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

---

## Dependencies Added

- `nodemailer`
- `@types/nodemailer` (dev)

---

## Files Added / Changed

| File | Change |
|------|--------|
| `supabase/email-schema.sql` | New migration |
| `src/lib/email/*` | Email library |
| `src/lib/db/email-settings.ts` | SMTP settings DB |
| `src/lib/db/email-logs.ts` | Email logs DB |
| `src/lib/db/password-reset.ts` | Reset tokens DB |
| `src/app/api/admin/email-settings/*` | Admin APIs |
| `src/app/api/admin/email-logs/route.ts` | Logs API |
| `src/app/api/auth/forgot-password/route.ts` | Real reset flow |
| `src/app/api/auth/reset-password/route.ts` | New |
| `src/app/(auth)/reset-password/page.tsx` | New page |
| `src/components/auth/reset-password-form.tsx` | New form |
| `src/app/admin/(panel)/platform/email-settings/page.tsx` | Admin UI |
| `src/lib/auth/local-auth.ts` | Welcome email hook |
| `src/app/api/support/*` | Support email hooks |
| `src/lib/billing/sync-subscription.ts` | Billing email hooks |
| `src/lib/db/users.ts` | Admin plan change email |
| `supabase/README.md` | Updated migration docs |

---

## Status

✅ Database schema  
✅ Nodemailer transport + logging  
✅ Welcome, support, billing, password reset emails  
✅ Forgot + Reset password pages  
✅ Admin Email Settings + logs UI  
✅ Admin-only security  
✅ Test email button  

**Required before use:** Run `email-schema.sql` and configure SMTP in admin panel. Set `NEXT_PUBLIC_APP_URL=http://localhost:3000` for local development reset links.
