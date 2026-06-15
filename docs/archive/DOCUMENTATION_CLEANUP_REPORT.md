# Documentation Cleanup Report

**Date:** June 15, 2026  
**Scope:** All `.md` files in the HyperScripter repository  
**Action taken:** Audit only — **no files deleted or moved**

---

## Executive Summary

| Metric | Count |
|--------|-------|
| Total `.md` files | **40** |
| At repository root | **39** |
| In `supabase/` | **1** |
| In `docs/` | **0** (folder does not exist yet) |

The repository root is cluttered with **37 agent-generated reports** alongside `README.md`. Only a handful of files are useful for ongoing contributors or public GitHub visitors. The rest are valuable as **internal history** but should be reorganized under `/docs` or archived.

---

## 1. Complete File Inventory

| # | File | Lines (approx.) | Category |
|---|------|-----------------|----------|
| 1 | `README.md` | 94 | Required documentation |
| 2 | `supabase/README.md` | 70 | Required documentation |
| 3 | `PRODUCTION_CHECKLIST.md` | 214 | Required documentation |
| 4 | `LAUNCH_SMOKE_TEST.md` | 499 | Required documentation |
| 5 | `LAUNCH_READINESS_REPORT.md` | — | Internal audit report |
| 6 | `SECURITY_AUDIT_REPORT.md` | — | Internal audit report |
| 7 | `PERFORMANCE_AUDIT_REPORT.md` | — | Internal audit report |
| 8 | `RLS_VERIFICATION_REPORT.md` | — | Internal audit report |
| 9 | `RLS_COMPATIBILITY_REPORT.md` | — | Internal audit report |
| 10 | `SUPABASE_CLIENT_AUDIT.md` | — | Internal audit report |
| 11 | `SUPABASE_SECURITY_HARDENING_REPORT.md` | — | Internal audit report |
| 12 | `RATE_LIMIT_REPORT.md` | — | Internal audit report |
| 13 | `REFERRAL_BILLING_AUDIT_REPORT.md` | — | Internal audit report |
| 14 | `ERROR_AUDIT_REPORT.md` | — | Internal audit report |
| 15 | `TEAM_FRONTEND_AUDIT_REPORT.md` | — | Internal audit report |
| 16 | `GITHUB_DEPLOYMENT_REPORT.md` | 297 | Deployment report |
| 17 | `GITHUB_PUSH_REPORT.md` | 231 | Deployment report |
| 18 | `CSS_RENDER_FAILURE_REPORT.md` | 297 | Deployment / incident report |
| 19 | `TEAM_DEBUG_REPORT.md` | 241 | Temporary debug report |
| 20 | `TEAM_API_FAILURE_REPORT.md` | — | Temporary debug report |
| 21 | `TEAM_WORKSPACE_FIX_REPORT.md` | 128 | Temporary debug report |
| 22 | `SUPPORT_REFRESH_BUG_REPORT.md` | 147 | Temporary debug report |
| 23 | `USAGE_LIMIT_BUG_REPORT.md` | — | Temporary debug report |
| 24 | `UI_STYLING_FIX_REPORT.md` | 191 | Temporary debug report |
| 25 | `SIDEBAR_SCROLL_FIX_REPORT.md` | — | Temporary debug report |
| 26 | `UI_REDESIGN_REPORT.md` | 278 | Feature / implementation report |
| 27 | `DASHBOARD_LAYOUT_REDESIGN_REPORT.md` | — | Feature / implementation report |
| 28 | `HERO_PREVIEW_REDESIGN_REPORT.md` | — | Feature / implementation report |
| 29 | `HERO_LAYOUT_OPTIMIZATION_REPORT.md` | — | Feature / implementation report |
| 30 | `HOMEPAGE_SCROLL_AND_HERO_REFACTOR_REPORT.md` | — | Feature / implementation report |
| 31 | `ADMIN_USER_MANAGEMENT_REPORT.md` | — | Feature / implementation report |
| 32 | `AFFILIATE_PAYOUT_REPORT.md` | — | Feature / implementation report |
| 33 | `EMAIL_SYSTEM_REPORT.md` | 314 | Feature / implementation report |
| 34 | `FAVICON_SETTINGS_REPORT.md` | — | Feature / implementation report |
| 35 | `HEADER_FOOTER_CMS_REPORT.md` | — | Feature / implementation report |
| 36 | `REFERRAL_SYSTEM_REPORT.md` | — | Feature / implementation report |
| 37 | `SEO_SETTINGS_REPORT.md` | — | Feature / implementation report |
| 38 | `SITE_SETTINGS_REPORT.md` | — | Feature / implementation report |
| 39 | `SUPPORT_SCHEMA_REPORT.md` | — | Feature / implementation report |
| 40 | `SUPPORT_SYSTEM_REPORT.md` | — | Feature / implementation report |

---

## 2. Category Definitions

| Category | Description | Typical audience |
|----------|-------------|------------------|
| **Required documentation** | Onboarding, ops checklists, QA runbooks — kept current | Contributors, deployers |
| **Internal audit reports** | Security, performance, RLS, launch-readiness assessments | Engineering, security review |
| **Temporary debug reports** | Point-in-time bug investigations and fixes (often resolved) | Dev session only |
| **Deployment reports** | Git push/deploy session logs and readiness snapshots | CI/CD setup (ephemeral) |
| **Feature / implementation reports** | How a subsystem was built; schema and API notes | Maintainers, future refactors |

---

## 3. Recommendations by File

### Legend

| Action | Meaning |
|--------|---------|
| **Keep (root)** | Stay at repo root on GitHub |
| **Move → `/docs`** | Relocate under structured docs folder |
| **Archive** | Move to `docs/archive/` — keep in Git but de-emphasize |
| **Delete** | Safe to remove after review (content redundant or obsolete) |

---

### Required documentation — **Keep on GitHub**

| File | Recommendation | Target path |
|------|----------------|-------------|
| `README.md` | **Keep (root)** — update content (still references Clerk; app uses custom auth) | `/README.md` |
| `supabase/README.md` | **Keep** — co-located with SQL migrations | `/supabase/README.md` |
| `PRODUCTION_CHECKLIST.md` | **Move → `/docs`** | `docs/launch/PRODUCTION_CHECKLIST.md` |
| `LAUNCH_SMOKE_TEST.md` | **Move → `/docs`** | `docs/launch/LAUNCH_SMOKE_TEST.md` |

---

### Internal audit reports — **Move → `/docs/audits`**

| File | Recommendation |
|------|----------------|
| `SECURITY_AUDIT_REPORT.md` | Move → `docs/audits/` |
| `PERFORMANCE_AUDIT_REPORT.md` | Move → `docs/audits/` |
| `RLS_VERIFICATION_REPORT.md` | Move → `docs/audits/` |
| `RLS_COMPATIBILITY_REPORT.md` | Move → `docs/audits/` |
| `SUPABASE_CLIENT_AUDIT.md` | Move → `docs/audits/` |
| `SUPABASE_SECURITY_HARDENING_REPORT.md` | Move → `docs/audits/` |
| `RATE_LIMIT_REPORT.md` | Move → `docs/audits/` |
| `REFERRAL_BILLING_AUDIT_REPORT.md` | Move → `docs/audits/` |
| `ERROR_AUDIT_REPORT.md` | Move → `docs/audits/` |
| `TEAM_FRONTEND_AUDIT_REPORT.md` | Move → `docs/audits/` |
| `LAUNCH_READINESS_REPORT.md` | Move → `docs/audits/` |

**Stay in GitHub:** Yes — valuable for compliance and onboarding senior devs.

---

### Deployment reports — **Archive or gitignore future copies**

| File | Recommendation | Rationale |
|------|----------------|-----------|
| `GITHUB_DEPLOYMENT_REPORT.md` | **Archive** → `docs/deployment/archive/` | Snapshot before first push; superseded after push succeeds |
| `GITHUB_PUSH_REPORT.md` | **Archive** → `docs/deployment/archive/` | Session log (403 auth error); ephemeral |
| `CSS_RENDER_FAILURE_REPORT.md` | **Move** → `docs/incidents/` | Useful runbook for `.next` cache issues |

**Future:** Do not commit regenerated push/deployment reports (see `.gitignore` update below).

---

### Temporary debug reports — **Archive or delete after review**

| File | Recommendation | Rationale |
|------|----------------|-----------|
| `TEAM_DEBUG_REPORT.md` | **Archive** → `docs/archive/debug/` | Contains project-specific Supabase URL; fix merged |
| `TEAM_API_FAILURE_REPORT.md` | **Archive** → `docs/archive/debug/` | Resolved API issue |
| `TEAM_WORKSPACE_FIX_REPORT.md` | **Archive** → `docs/archive/debug/` | Fix merged |
| `SUPPORT_REFRESH_BUG_REPORT.md` | **Archive** → `docs/archive/debug/` | Root cause documented; fix merged |
| `USAGE_LIMIT_BUG_REPORT.md` | **Archive** → `docs/archive/debug/` | Bug fix session |
| `UI_STYLING_FIX_REPORT.md` | **Move** → `docs/incidents/` | Keep — documents `.next` cache fix (reusable) |
| `SIDEBAR_SCROLL_FIX_REPORT.md` | **Delete** (optional) | Narrow UI fix; low long-term value |

**Delete candidates (lowest value, after confirm fixes are in `main`):**

- `SIDEBAR_SCROLL_FIX_REPORT.md`
- `HERO_LAYOUT_OPTIMIZATION_REPORT.md` (if redundant with `HERO_PREVIEW_REDESIGN_REPORT.md`)
- `HOMEPAGE_SCROLL_AND_HERO_REFACTOR_REPORT.md` (overlap with other hero reports)

---

### Feature / implementation reports — **Move → `/docs/features`**

| File | Recommendation |
|------|----------------|
| `ADMIN_USER_MANAGEMENT_REPORT.md` | Move → `docs/features/` |
| `AFFILIATE_PAYOUT_REPORT.md` | Move → `docs/features/` |
| `EMAIL_SYSTEM_REPORT.md` | Move → `docs/features/` |
| `FAVICON_SETTINGS_REPORT.md` | Move → `docs/features/` |
| `HEADER_FOOTER_CMS_REPORT.md` | Move → `docs/features/` |
| `REFERRAL_SYSTEM_REPORT.md` | Move → `docs/features/` |
| `SEO_SETTINGS_REPORT.md` | Move → `docs/features/` |
| `SITE_SETTINGS_REPORT.md` | Move → `docs/features/` |
| `SUPPORT_SCHEMA_REPORT.md` | Move → `docs/features/` |
| `SUPPORT_SYSTEM_REPORT.md` | Move → `docs/features/` |
| `UI_REDESIGN_REPORT.md` | Move → `docs/features/` |
| `DASHBOARD_LAYOUT_REDESIGN_REPORT.md` | Move → `docs/features/` |
| `HERO_PREVIEW_REDESIGN_REPORT.md` | Move → `docs/archive/ui/` |
| `HERO_LAYOUT_OPTIMIZATION_REPORT.md` | Move → `docs/archive/ui/` |
| `HOMEPAGE_SCROLL_AND_HERO_REFACTOR_REPORT.md` | Move → `docs/archive/ui/` |

**Stay in GitHub:** Yes — under `/docs`, not root.

---

## 4. Proposed `/docs` Structure

```
docs/
├── README.md                          # Index linking to all sections
├── launch/
│   ├── PRODUCTION_CHECKLIST.md
│   └── LAUNCH_SMOKE_TEST.md
├── audits/
│   ├── SECURITY_AUDIT_REPORT.md
│   ├── PERFORMANCE_AUDIT_REPORT.md
│   ├── RLS_VERIFICATION_REPORT.md
│   ├── RLS_COMPATIBILITY_REPORT.md
│   ├── SUPABASE_CLIENT_AUDIT.md
│   ├── SUPABASE_SECURITY_HARDENING_REPORT.md
│   ├── RATE_LIMIT_REPORT.md
│   ├── REFERRAL_BILLING_AUDIT_REPORT.md
│   ├── ERROR_AUDIT_REPORT.md
│   ├── TEAM_FRONTEND_AUDIT_REPORT.md
│   └── LAUNCH_READINESS_REPORT.md
├── features/
│   ├── EMAIL_SYSTEM_REPORT.md
│   ├── REFERRAL_SYSTEM_REPORT.md
│   ├── SUPPORT_SYSTEM_REPORT.md
│   └── … (other implementation reports)
├── incidents/
│   ├── CSS_RENDER_FAILURE_REPORT.md
│   └── UI_STYLING_FIX_REPORT.md
├── deployment/
│   └── archive/
│       ├── GITHUB_DEPLOYMENT_REPORT.md
│       └── GITHUB_PUSH_REPORT.md
└── archive/
    ├── debug/
    │   ├── TEAM_DEBUG_REPORT.md
    │   └── …
    └── ui/
        ├── HERO_PREVIEW_REDESIGN_REPORT.md
        └── …
```

**Root should retain only:**

- `README.md`
- `supabase/README.md` (stays with SQL)

---

## 5. Summary Matrix

| Action | Count | Files |
|--------|-------|-------|
| **Keep at root** | 2 | `README.md`, `supabase/README.md` |
| **Move to `/docs`** | 34 | All reports + checklists (see above) |
| **Delete (optional)** | 1–4 | `SIDEBAR_SCROLL_FIX_REPORT.md` + redundant hero reports |
| **Gitignore future** | 3 patterns | Ephemeral deployment reports |

---

## 6. `.gitignore` Update

The following patterns were added to prevent **regenerated session reports** from being committed accidentally in the future:

```gitignore
# Ephemeral agent/tooling reports (regenerated per session — see docs/README.md)
/docs/generated/
GITHUB_DEPLOYMENT_REPORT.md
GITHUB_PUSH_REPORT.md
```

**Rationale:**

| Pattern | Why |
|---------|-----|
| `/docs/generated/` | Drop zone for future auto-generated reports |
| `GITHUB_DEPLOYMENT_REPORT.md` | Regenerated per Git prep session |
| `GITHUB_PUSH_REPORT.md` | Regenerated per push attempt |

**Not ignored:** Audit reports, feature docs, launch checklists, `DOCUMENTATION_CLEANUP_REPORT.md` — commit under `/docs` or root as needed.

---

## 7. Additional Findings

### `README.md` is outdated

Still documents **Clerk** authentication. The app uses **custom HMAC cookie auth** + Supabase. Update before public launch.

### `supabase/README.md` contains a hardcoded project URL

```
https://supabase.com/dashboard/project/jvinzixeqnmtvjhizsqv/sql
```

Replace with a generic placeholder before open-sourcing, or use `YOUR_PROJECT_REF` in docs.

### `TEAM_DEBUG_REPORT.md` references live environment

Contains Supabase project ref and local env state. Fine for private repo; redact if repo goes public.

### No `docs/` folder exists

First cleanup PR should:

1. Create `docs/README.md` index
2. `git mv` files into structure above
3. Add a one-line pointer in root `README.md` → `docs/`

---

## 8. Suggested Cleanup Commands (manual — not executed)

```powershell
# Example — create structure and move launch docs
mkdir docs\launch, docs\audits, docs\features, docs\incidents, docs\deployment\archive, docs\archive\debug, docs\archive\ui

git mv PRODUCTION_CHECKLIST.md docs/launch/
git mv LAUNCH_SMOKE_TEST.md docs/launch/
git mv SECURITY_AUDIT_REPORT.md docs/audits/
# … repeat for each file per table above

git commit -m "Reorganize documentation into docs/ folder"
```

---

## 9. Sign-Off

| Check | Status |
|-------|--------|
| All `.md` files listed | ✅ 40 files |
| Categories assigned | ✅ |
| Recommendations provided | ✅ |
| `.gitignore` updated | ✅ |
| Files deleted | ❌ Intentionally skipped |
| Files moved | ❌ Intentionally skipped |

**Next step:** Review delete candidates, run `git mv` batch, update root `README.md`, then commit docs reorganization as a separate PR.
