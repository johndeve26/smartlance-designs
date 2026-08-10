# Performance Acceptance Report — Smartlance V1

**Date:** 2026-08-10  
**Verdict:** `SMARTLANCE PERFORMANCE & CACHING V1 COMPLETE — LIVE CDN / CORE WEB VITAL VERIFICATION PENDING`

## Executive summary

Implemented measure-first performance & caching for public marketing routes: centralized `lib/public/cache/` with `unstable_cache` + `React.cache`, route-group layout refactor removing root `headers()` dynamic penalty, managed-page invalidation, private `no-store` headers, and regression tests. Local warm TTFB improved ~7× on repeated passes. Vercel preview Lighthouse/CWV and production Cloudflare verification remain pending.

## Stack

| Item | Value |
|------|-------|
| Next.js | 16.3.0 |
| React | 19.2.8 |
| cacheComponents | OFF |
| Migrations | 0 |

## BEFORE / CHANGE / AFTER

| Area | Before | Change | After |
|------|--------|--------|-------|
| Public CMS reads | Direct Prisma every request | `unstable_cache` + existing tags | Cached DTOs, tag invalidation on publish |
| Metadata + page fetch | Duplicate DB calls | `React.cache` in `request-memo.ts` | Single read per request |
| Root layout | `headers()` for chrome → all routes dynamic | `(site)` route group + slim root layout | Public routes not penalized by admin detection |
| Managed pages | Admin-only revalidate | `revalidateManagedPage(key)` | Public `/about`, `/contact`, etc. invalidate |
| Private headers | Admin only in next.config | Portal, workspace, sensitive APIs | `no-store` aligned with proxy |
| Avg public TTFB (local) | ~7162 ms (1st pass) | Cache warm + dedup | ~1021 ms (warm pass) |
| Tests | 666 unit | +18 performance tests | **684 passed**, 98 skipped |

## Bottlenecks found

| Priority | Item | Resolution |
|----------|------|------------|
| P0 | Private route cache safety | Verified locally; headers hardened |
| P0 | Preview polluting public cache | Preview loaders isolated; test added |
| P1 | Uncached CMS reads | Cache layer |
| P1 | Duplicate metadata fetches | React.cache |
| P1 | Root headers() dynamic | Route groups |
| P1 | Managed page stale cache | revalidateManagedPage |
| P2 | Sitemap DB storm | Cached via `sitemap` tag |
| P2 | Lighthouse/CWV on preview | **Pending** |
| P2 | Cloudflare HTML edge cache | **Not enabled** (documented) |

## Regression gate

| Check | Result |
|-------|--------|
| `npm run build` | PASS |
| `npx tsc --noEmit` | PASS |
| `npx vitest run` | **684 passed**, 98 skipped |
| `npx prisma validate` | PASS |
| Migrations | 0 |

## Files changed (summary)

**New:** `lib/public/cache/*`, `scripts/run-performance-baseline.ts`, `app/(site)/layout.tsx`, `tests/performance/*`, docs (`PERFORMANCE_*`, `CACHE_ARCHITECTURE`, `CLOUDFLARE_*`)

**Modified:** `app/layout.tsx`, public pages → cache imports, `lib/admin/publishing.ts`, `lib/admin/phase4-actions.ts`, `next.config.ts`, `lib/home/editorial.ts`, `lib/home/showcase.ts`, marketing routes moved to `app/(site)/`

## Manual infrastructure actions

1. Deploy to Vercel preview
2. Run `SITE_URL=https://preview-url npx tsx scripts/run-performance-baseline.ts`
3. Run Lighthouse mobile/desktop on `/`, `/services`, `/work`
4. Apply Cloudflare bypass rules per `CLOUDFLARE_PERFORMANCE_CONFIG.md`
5. After production cutover, rerun baseline against `smartlancedesigns.com`

## Deferred

- Enable `cacheComponents` globally
- Cloudflare HTML edge caching
- Font weight subsetting (P3)
- DB index migrations (none proven needed)

## Final verdict

Application-side performance & caching architecture is **complete and tested**. Live CDN behavior and Core Web Vitals on Vercel preview/production require post-deploy verification to reach **VERIFIED** status.

---

## V1.1 Frontend delivery pass (2026-08-10)

**Verdict:** `SMARTLANCE FRONTEND PERFORMANCE V1.1 COMPLETE — LIVE PERFORMANCE VERIFICATION PENDING`

| Metric | Before (lab median) | After (lab median) |
|--------|---------------------|---------------------|
| Mobile LCP | 4.8s | **3.1s** |
| Mobile Performance | 82 | **94** |
| Accessibility | 96 | **100** |
| TBT | 69ms | 16ms |
| CLS | 0 | 0 |

Primary LCP fix: Next.js 16 `fetchPriority="high"` + mobile hero reorder + responsive hero/logo assets. Full report: [`docs/FRONTEND_PERFORMANCE_V1_1.md`](FRONTEND_PERFORMANCE_V1_1.md).

**P0 manual:** Upload `*-v2.webp` brand assets and `hero-768.webp` to R2 before production Lighthouse rerun.
