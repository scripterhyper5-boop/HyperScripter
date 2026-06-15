# Production Checklist

**Date:** June 13, 2026  
**Application:** HyperScripter  
**Use this checklist before deploying to production.**

---

## 1. Environment Variables

### Required

| Variable | Purpose | Verified |
|----------|---------|----------|
| `AUTH_SECRET` | Session HMAC signing (64+ random chars) | [ ] |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | [ ] |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side DB access (**never expose to client**) | [ ] |
| `GEMINI_API_KEY` | AI script generation | [ ] |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL (https://yourdomain.com) | [ ] |
| `APP_URL` | Email links / server redirects | [ ] |

### Billing (if enabling paid plans)

| Variable | Purpose | Verified |
|----------|---------|----------|
| `STRIPE_SECRET_KEY` | **Live** secret key (`sk_live_...`) | [ ] |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | **Live** publishable key (`pk_live_...`) | [ ] |
| `STRIPE_WEBHOOK_SECRET` | Production webhook signing secret | [ ] |
| `STRIPE_PRICE_PRO` | Live Pro price ID | [ ] |
| `STRIPE_PRICE_TEAM` | Live Team price ID | [ ] |

### Optional

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser client (support realtime only — after RLS hardening) |
| `ADMIN_EMAIL` | Auto-admin on signup (use carefully) |
| `API_KEY_ENCRYPTION_SECRET` | 64-char hex for AI key encryption |

### Security

- [ ] `.env.local` is in `.gitignore` and never committed
- [ ] `.env.example` contains **placeholders only** (Stripe keys scrubbed)
- [ ] Rotate any keys that were previously committed to git
- [ ] Vercel env vars set for **Production** environment only

---

## 2. Supabase Production Setup

### Schema Migrations (run in order)

- [ ] `supabase/schema.sql`
- [ ] `supabase/email-schema.sql`
- [ ] `supabase/ai-settings.sql`
- [ ] `supabase/referral-schema.sql`
- [ ] `supabase/site-settings-schema.sql`
- [ ] `supabase/favicon-settings-schema.sql`
- [ ] `supabase/seo-settings-schema.sql`
- [ ] `supabase/header-footer-settings-schema.sql`
- [ ] `supabase/affiliate-payment-methods.sql` (if using payouts)
- [ ] `supabase/support-schema.sql`
- [ ] `supabase/seed.sql` (optional — dev/staging only)

### Security

- [ ] **Run `supabase/rls-hardening.sql`** after smoke tests
- [ ] Confirm `SUPABASE_SERVICE_ROLE_KEY` is set in production
- [ ] Disable Supabase dashboard public access to service role key
- [ ] Enable Supabase daily backups (Pro plan)
- [ ] Point-in-time recovery enabled (if available)

### Connection

- [ ] Production Supabase project separate from dev
- [ ] Connection pooling configured (Supabase pooler for serverless)

---

## 3. Stripe Production Readiness

- [ ] Switch from test to **live** API keys
- [ ] Create live Products/Prices matching `STRIPE_PRICE_PRO` and `STRIPE_PRICE_TEAM`
- [ ] Configure production webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
- [ ] Webhook events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`
- [ ] Test checkout flow end-to-end with real card (then refund)
- [ ] Customer portal enabled in Stripe Dashboard
- [ ] Publish **Refund Policy** legal page before accepting payments

---

## 4. Email System Readiness

Email is **database-driven** (not env vars):

- [ ] Admin → Platform → Email Settings: configure SMTP host, port, user, password
- [ ] Send test email from admin panel
- [ ] Verify `email_logs` table records sent/failed messages
- [ ] SPF/DKIM/DMARC configured on sending domain
- [ ] `APP_URL` / `NEXT_PUBLIC_APP_URL` set correctly for password-reset links
- [ ] Test: welcome email, password reset, billing notification

---

## 5. Error Handling

| Component | Status |
|-----------|--------|
| `src/app/error.tsx` | Light-themed 500 page + console logging |
| `src/app/global-error.tsx` | Root fallback + console logging |
| `src/app/not-found.tsx` | 404 with navbar/footer |
| `src/app/dashboard/error.tsx` | Dashboard-scoped boundary |
| `src/app/admin/(panel)/error.tsx` | Admin-scoped boundary |
| Toast notifications (`sonner`) | Used across admin/dashboard forms |

### Still Needed

- [ ] External error tracking (Sentry, LogRocket, or Vercel monitoring)
- [ ] Structured server logging (pino/winston)
- [ ] Alerting on 5xx spike / webhook failures

---

## 6. Logging

| Current State | Production Action |
|---------------|-------------------|
| `console.log/error` throughout | Replace critical paths with structured logger |
| Login debug logs | **Remove before launch** |
| Workspace/support debug logs | Gate behind `NODE_ENV !== 'production'` |
| Stripe webhook logs | Keep; add alerting on failures |
| Email failure logs | Stored in `email_logs` table — monitor |

---

## 7. Backup Strategy

| Data | Backup Method |
|------|---------------|
| PostgreSQL (Supabase) | Enable automated daily backups + PITR |
| Uploaded files (`public/uploads/`) | Not in DB — backup via deployment artifact or object storage migration |
| Stripe data | Stripe Dashboard exports |
| Environment secrets | Vercel env var export (encrypted) |

### Recovery Plan

- [ ] Document RTO/RPO targets
- [ ] Test database restore from Supabase backup once
- [ ] Export admin user list quarterly

---

## 8. CMS / Platform Settings

Configure in admin before launch:

- [ ] Header & Footer (nav links, CTA)
- [ ] Favicon upload
- [ ] SEO Settings (title, description, OG image, analytics IDs)
- [ ] Legal pages published (Privacy, Terms, Cookie, **Refund**)
- [ ] AI Settings (Gemini key)
- [ ] Email Settings (SMTP)
- [ ] Pricing plans match Stripe live prices

---

## 9. Pre-Deploy Smoke Tests

- [ ] Signup → email welcome (if enabled)
- [ ] Login → dashboard
- [ ] Generate script (free plan limit)
- [ ] Upgrade to Pro (Stripe checkout)
- [ ] Webhook fires → plan updates in DB
- [ ] Referral signup + commission on upgrade
- [ ] Support ticket create + admin reply
- [ ] Password reset flow
- [ ] Admin: users, billing, support, platform settings

---

## 10. Post-Deploy Verification

- [ ] `https://yourdomain.com/robots.txt`
- [ ] `https://yourdomain.com/sitemap.xml`
- [ ] `/legal/privacy-policy`, `/legal/terms-of-service` load
- [ ] Favicon visible in browser tab
- [ ] OG tags correct (share on Twitter/Slack debugger)
- [ ] Google Search Console verification meta present
- [ ] Analytics receiving events (if configured)
- [ ] SSL certificate valid (Vercel auto)
- [ ] `/debug` routes return 404/redirect in production

---

## 11. Vercel Deployment

- [ ] Connect Git repository
- [ ] Set all production env vars
- [ ] Custom domain configured + DNS propagated
- [ ] `NODE_ENV=production` automatic on Vercel
- [ ] Function region close to Supabase region
- [ ] Enable Vercel Analytics (optional)
- [ ] Set up deployment protection for preview branches

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Engineering | | | |
| Product | | | |
| Security review | | | |
