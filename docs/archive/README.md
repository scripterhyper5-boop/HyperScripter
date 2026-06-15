# Documentation Archive

Historical audit reports, deployment logs, feature implementation notes, and debug session write-ups. These were moved from the repository root on **June 15, 2026** to reduce clutter.

**Active documentation:**

- [`/README.md`](../../README.md) — project overview
- [`/supabase/README.md`](../../supabase/README.md) — database setup

**Future reports:** Do not add new `*_REPORT.md` files to the repo root. Place them here or in `/docs/generated/` (gitignored). Root-level report patterns are listed in `.gitignore`.

---

## Move Summary

| Metric | Value |
|--------|-------|
| Files moved | **40** |
| Source | Repository root (`*.md` except `README.md`) |
| Destination | `docs/archive/` |
| Files deleted | **0** |

---

## Moved Files (alphabetical)

| # | File |
|---|------|
| 1 | `ADMIN_USER_MANAGEMENT_REPORT.md` |
| 2 | `AFFILIATE_PAYOUT_REPORT.md` |
| 3 | `CSS_RENDER_FAILURE_REPORT.md` |
| 4 | `DASHBOARD_LAYOUT_REDESIGN_REPORT.md` |
| 5 | `DOCUMENTATION_CLEANUP_REPORT.md` |
| 6 | `EMAIL_SYSTEM_REPORT.md` |
| 7 | `ERROR_AUDIT_REPORT.md` |
| 8 | `FAVICON_SETTINGS_REPORT.md` |
| 9 | `GITHUB_DEPLOYMENT_REPORT.md` |
| 10 | `GITHUB_PUSH_REPORT.md` |
| 11 | `HEADER_FOOTER_CMS_REPORT.md` |
| 12 | `HERO_LAYOUT_OPTIMIZATION_REPORT.md` |
| 13 | `HERO_PREVIEW_REDESIGN_REPORT.md` |
| 14 | `HOMEPAGE_SCROLL_AND_HERO_REFACTOR_REPORT.md` |
| 15 | `LAUNCH_READINESS_REPORT.md` |
| 16 | `LAUNCH_SMOKE_TEST.md` |
| 17 | `PERFORMANCE_AUDIT_REPORT.md` |
| 18 | `PRODUCTION_CHECKLIST.md` |
| 19 | `RATE_LIMIT_REPORT.md` |
| 20 | `REFERRAL_BILLING_AUDIT_REPORT.md` |
| 21 | `REFERRAL_SYSTEM_REPORT.md` |
| 22 | `RLS_COMPATIBILITY_REPORT.md` |
| 23 | `RLS_VERIFICATION_REPORT.md` |
| 24 | `SECURITY_AUDIT_REPORT.md` |
| 25 | `SEO_SETTINGS_REPORT.md` |
| 26 | `SIDEBAR_SCROLL_FIX_REPORT.md` |
| 27 | `SITE_SETTINGS_REPORT.md` |
| 28 | `SUPABASE_CLIENT_AUDIT.md` |
| 29 | `SUPABASE_SECURITY_HARDENING_REPORT.md` |
| 30 | `SUPPORT_REFRESH_BUG_REPORT.md` |
| 31 | `SUPPORT_SCHEMA_REPORT.md` |
| 32 | `SUPPORT_SYSTEM_REPORT.md` |
| 33 | `TEAM_API_FAILURE_REPORT.md` |
| 34 | `TEAM_DEBUG_REPORT.md` |
| 35 | `TEAM_FRONTEND_AUDIT_REPORT.md` |
| 36 | `TEAM_WORKSPACE_FIX_REPORT.md` |
| 37 | `UI_REDESIGN_REPORT.md` |
| 38 | `UI_STYLING_FIX_REPORT.md` |
| 39 | `USAGE_LIMIT_BUG_REPORT.md` |
| 40 | `VERCEL_DEPLOYMENT_REPORT.md` |

---

## By Category

### Launch & operations (4)

- `LAUNCH_SMOKE_TEST.md`
- `PRODUCTION_CHECKLIST.md`
- `LAUNCH_READINESS_REPORT.md`
- `VERCEL_DEPLOYMENT_REPORT.md`

### Security & infrastructure audits (11)

- `SECURITY_AUDIT_REPORT.md`
- `PERFORMANCE_AUDIT_REPORT.md`
- `RLS_VERIFICATION_REPORT.md`
- `RLS_COMPATIBILITY_REPORT.md`
- `SUPABASE_CLIENT_AUDIT.md`
- `SUPABASE_SECURITY_HARDENING_REPORT.md`
- `RATE_LIMIT_REPORT.md`
- `REFERRAL_BILLING_AUDIT_REPORT.md`
- `ERROR_AUDIT_REPORT.md`
- `TEAM_FRONTEND_AUDIT_REPORT.md`
- `DOCUMENTATION_CLEANUP_REPORT.md`

### Deployment & Git (2)

- `GITHUB_DEPLOYMENT_REPORT.md`
- `GITHUB_PUSH_REPORT.md`

### Incidents & debug fixes (7)

- `CSS_RENDER_FAILURE_REPORT.md`
- `UI_STYLING_FIX_REPORT.md`
- `TEAM_DEBUG_REPORT.md`
- `TEAM_API_FAILURE_REPORT.md`
- `TEAM_WORKSPACE_FIX_REPORT.md`
- `SUPPORT_REFRESH_BUG_REPORT.md`
- `USAGE_LIMIT_BUG_REPORT.md`

### Feature implementation (15)

- `ADMIN_USER_MANAGEMENT_REPORT.md`
- `AFFILIATE_PAYOUT_REPORT.md`
- `EMAIL_SYSTEM_REPORT.md`
- `FAVICON_SETTINGS_REPORT.md`
- `HEADER_FOOTER_CMS_REPORT.md`
- `REFERRAL_SYSTEM_REPORT.md`
- `SEO_SETTINGS_REPORT.md`
- `SITE_SETTINGS_REPORT.md`
- `SUPPORT_SCHEMA_REPORT.md`
- `SUPPORT_SYSTEM_REPORT.md`
- `UI_REDESIGN_REPORT.md`
- `DASHBOARD_LAYOUT_REDESIGN_REPORT.md`
- `HERO_PREVIEW_REDESIGN_REPORT.md`
- `HERO_LAYOUT_OPTIMIZATION_REPORT.md`
- `HOMEPAGE_SCROLL_AND_HERO_REFACTOR_REPORT.md`

### UI fixes (1)

- `SIDEBAR_SCROLL_FIX_REPORT.md`

---

## `.gitignore` (repository root)

New patterns prevent future report files from accumulating at the repo root:

```
/*_REPORT.md
/*_AUDIT_REPORT.md
/*_AUDIT.md
/PRODUCTION_CHECKLIST.md
/LAUNCH_SMOKE_TEST.md
/LAUNCH_READINESS_REPORT.md
/DOCUMENTATION_CLEANUP_REPORT.md
/VERCEL_DEPLOYMENT_REPORT.md
/CSS_RENDER_FAILURE_REPORT.md
/GITHUB_*.md
```

Files in `docs/archive/` remain tracked in Git.
