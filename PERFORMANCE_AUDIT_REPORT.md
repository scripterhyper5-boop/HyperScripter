# Performance Audit Report

**Date:** June 13, 2026  
**Application:** HyperScripter  
**Scope:** Bundle size, API efficiency, DB queries, hydration, images, re-renders

---

## Executive Summary

The app is reasonably performant for an MVP SaaS. Main opportunities: **reduce duplicate server fetches**, **code-split admin-only dependencies**, and **cache blog post metadata**. Several duplicate-query issues were **fixed** during this audit.

---

## 1. Database Query Efficiency

### Fixed During Audit

| Issue | Before | After |
|-------|--------|-------|
| Duplicate `site_settings` per request | 2 queries (layout + SEO) | 1 query via shared `cache(getSiteSettings)` |
| Duplicate `header_footer_settings` | 2 queries (navbar + footer) | 1 query via `cache(getHeaderFooterSettings)` |

**Files:** `src/lib/db/site-settings.ts`, `src/lib/db/header-footer-settings.ts`, `src/lib/seo-settings/server.ts`

### Remaining Issues

| ID | Severity | Finding | File(s) | Recommendation |
|----|----------|---------|---------|----------------|
| PERF-01 | **Medium** | Blog post fetched twice per `/blog/[slug]` (metadata + page) | `blog/[slug]/page.tsx` | Wrap `getPublishedBlogPost` in `cache()` |
| PERF-02 | **Medium** | Referral reconcile loops per-user DB calls | `reconcile-commissions.ts` | Batch queries where possible |
| PERF-03 | **Low** | Commission processing: 5+ sequential queries per user | `process-commission.ts` | Combine into fewer round-trips |

### Good Patterns

- `listWorkspaceMembers` uses Supabase join (no N+1)
- Admin dashboard stats uses `Promise.all`
- Team workspace loads members/analytics in parallel

---

## 2. Duplicate API Calls (Client)

| ID | Severity | Finding | File(s) | Recommendation |
|----|----------|---------|---------|----------------|
| PERF-04 | **Medium** | `/api/auth/me` on every page mount | `local-auth-provider.tsx` | OK for auth; consider SWR with dedup |
| PERF-05 | **Medium** | `/api/team/workspace` called from guard + hooks | `team-route-guard.tsx`, `use-has-team-access.ts` | Share context provider |
| PERF-06 | **Low** | Team guard polls every 2s during init | `team-route-guard.tsx` | Use event/callback instead of interval |
| PERF-07 | **Low** | Support unread polling | `use-support-unread.ts` | Acceptable; tune interval in production |

---

## 3. Bundle Size & Code Splitting

| Dependency | Used On | Severity | Recommendation |
|------------|---------|----------|----------------|
| `motion/react` | Homepage hero, navbar, sidebars | **Medium** | `optimizePackageImports`; reduce motion on marketing pages |
| `recharts` | Admin analytics only | **Medium** | `dynamic(() => import(...), { ssr: false })` |
| TipTap stack | Admin legal editor only | **Medium** | Already admin-scoped; ensure no accidental imports |
| `highlight.js` CSS | Admin editors | **Low** | Load only on admin editor pages |
| `@google/genai` | Server-only generate route | **OK** | Not in client bundle |

### `next.config.ts` Recommendations

```typescript
experimental: {
  optimizePackageImports: ["lucide-react", "recharts", "motion"],
},
```

Currently **not configured**.

---

## 4. Slow Pages (Estimated)

| Page | Risk | Cause |
|------|------|-------|
| Homepage `/` | Medium | Multiple client components + motion animations |
| `/dashboard/generate` | Medium | Form + AI API latency (expected) |
| `/admin/analytics` | Medium | recharts + multiple API calls |
| `/blog/[slug]` | Low-Medium | Double blog fetch |

---

## 5. Hydration Issues

| Finding | Severity | Status |
|---------|----------|--------|
| `suppressHydrationWarning` on html/body | Low | Intentional (extensions) |
| `HydrationExtensionGuard` strips extension attrs | Low | Good mitigation |
| `ClientOnly` for navbar auth | OK | Prevents auth mismatch |
| Header/footer preview hook reads sessionStorage | Low | Preview-only (`?hf-preview=1`) |
| Blog dates use deterministic formatter | OK | No locale hydration issues |

**Overall hydration risk: Low**

---

## 6. React Re-renders

| Area | Notes |
|------|-------|
| Dashboard sidebar | Collapse state + motion — acceptable |
| Support conversation | Realtime updates trigger re-renders — expected |
| Auth provider | Single context; triggers on `/api/auth/me` | 

No critical re-render loops identified.

---

## 7. Image Optimization

| Asset | Status | Recommendation |
|-------|--------|----------------|
| OG images | Static upload to `/public/uploads/seo/` | Use `next/image` where rendered in React |
| Favicon | Generated PNGs via Sharp | OK |
| Blog images | Markdown content | Add `next/image` if inline images added |
| Dashboard mockup | `<img>` in marketing | Acceptable for hero demo |

No `next/image` remote patterns configured for external URLs.

---

## 8. Unused Components

No systematic dead-code analysis run. Candidates for review:

- `src/components/sections/product-preview.tsx` (removed from homepage)
- `src/components/sections/why-hyperscripter.tsx` (removed from homepage)
- `src/components/sections/use-cases.tsx` (removed from homepage)
- `src/components/sections/cta.tsx` (removed from homepage)

These remain in codebase for potential reuse but add to bundle if accidentally imported.

---

## 9. Caching Strategy

| Layer | Implementation |
|-------|----------------|
| React `cache()` | `getSiteSettings`, `getHeaderFooterSettings`, `getResolvedSeoSettings` |
| Email transport | In-memory transporter cache |
| AI settings import | `invalidateImportCache` on update |
| CDN | Vercel edge for static assets (when deployed) |

**Missing:** HTTP cache headers for public API routes; Redis for session/rate-limit.

---

## 10. Performance Score

| Category | Score (/10) |
|----------|-------------|
| Server data fetching | 7 (improved from 5) |
| Client bundle | 6 |
| DB query patterns | 7 |
| Hydration | 8 |
| Images | 6 |
| **Overall** | **6.8 / 10** |

---

## 11. Quick Wins (Post-Launch)

1. `cache(getPublishedBlogPost)` for blog slug pages
2. `optimizePackageImports` in Next config
3. Dynamic import recharts in admin analytics
4. Remove or tree-shake unused marketing section components
5. Add `loading.tsx` skeletons for dashboard routes (partial coverage exists)
