# Supabase Setup

## 1. Apply schema

Open the [Supabase SQL Editor](https://supabase.com/dashboard/project/jvinzixeqnmtvjhizsqv/sql) and run:

1. `schema.sql` — creates all tables, indexes, RLS policies
2. `team-workspace.sql` — team workspace extensions (invitations, shared scripts)
3. `support-schema.sql` — support ticket tables, RLS, realtime (**required for /dashboard/support**)
4. `site-settings-schema.sql` — global head/body HTML snippets (**required for Site Settings**)
5. `email-schema.sql` — SMTP settings, email logs, password reset tokens (**required for Email System**)
6. `referral-schema.sql` — referrals, affiliate payouts, user referral codes (**required for Referrals**)
7. `affiliate-payment-methods.sql` — payout method settings per user (**required for Affiliate Payouts**)
8. `seed.sql` — inserts demo blog posts and legal pages
9. `seed-admin.sql` — seeded admin account

## 2. Environment variables

Already configured in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

For production API routes, add:

- `SUPABASE_SERVICE_ROLE_KEY` (Settings → API → service_role)

## 3. Tables

| Table | Purpose |
|-------|---------|
| `users` | Profiles, roles, plans |
| `scripts` | Generated TikTok scripts |
| `blog_posts` | Public blog content |
| `legal_pages` | Legal/compliance pages |
| `subscriptions` | Plan subscriptions (Stripe-ready) |
| `workspaces` | Team workspaces (future) |
| `workspace_members` | Team members (future) |
| `usage_records` | Usage tracking |
| `script_exports` | Export history |
| `support_tickets` | User support tickets |
| `support_messages` | Ticket conversation messages |
| `site_settings` | Global head/body HTML snippets |
| `email_settings` | SMTP configuration (single row) |
| `email_logs` | Email delivery history |
| `password_reset_tokens` | Password reset tokens |
| `referrals` | Referral tracking records |
| `affiliate_payouts` | Affiliate commission payouts |
| `affiliate_payment_methods` | User payout preferences (PayPal, bank, etc.) |

## 4. Clerk + admin roles

Users are created in Supabase automatically when they sign up via Clerk (`/api/auth/sync-metadata`).

To grant admin access, set in **Clerk Dashboard → Users → public metadata**:

```json
{ "role": "admin", "plan": "team" }
```

Also customize the session token (Sessions → Customize session token):

```json
{ "metadata": "{{user.public_metadata}}" }
```

## 5. Verify

After running the SQL files and configuring Clerk, restart the dev server. Admin panels and script generation will persist to Supabase automatically.
