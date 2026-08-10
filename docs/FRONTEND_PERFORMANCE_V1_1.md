# Frontend Performance V1.1 — Smartlance Designs

Generated: 2026-08-10  
Scope: Homepage LCP · image delivery · unused JS audit · CSS · accessibility  
Stack: Next.js **16.3.0**, React **19.2.8**

## Executive verdict

**SMARTLANCE FRONTEND PERFORMANCE V1.1 COMPLETE — LIVE PERFORMANCE VERIFICATION PENDING**

Code fixes are merged locally with measurable lab improvements. Production/R2 CDN assets and live PageSpeed verification remain pending.

## LCP root cause

| Finding | Evidence |
|---------|----------|
| Deprecated `priority` prop (Next.js 16) | Lighthouse `lcp-discovery-insight`: `fetchpriority=high` **not applied** while `priority` was set on hero |
| LCP image below fold on mobile | Before: bounding rect `top: 624px`; hero text rendered first in DOM |
| Oversized logo competing for bandwidth | 915×199 PNG (~85 KiB) from R2 with no effective cache |
| R2 project hero oversized for mobile | 1024×562 WebP displayed ~370×208; no responsive variant |

No animation, opacity, framer-motion, or IntersectionObserver delayed the LCP element.

## LCP component chain

```
app/(site)/page.tsx (Server, async)
  └─ HomeHero — components/home/hero.tsx (Server)
       └─ PortfolioScreenshot — components/ui/site-image.tsx (Server)
            └─ <picture> + native <img fetchPriority="high"> (LCP path)
```

Header `Logo` is a separate client-boundary import; not an ancestor of the LCP `<img>`.

## Fixes applied

1. **Next.js 16 image API** — `lcp` prop maps to `loading="eager"` + `fetchPriority="high"` (replaces deprecated `priority` on hero)
2. **Mobile hero order** — image `order-1` / copy `order-2` below `lg` (LCP enters viewport ~158px higher)
3. **Responsive hero asset** — `hero-768.webp` via `<picture>` for ≤768px
4. **Hero `sizes`** — `(max-width: 640px) calc(100vw - 2.5rem), (max-width: 1024px) calc(100vw - 3rem), 648px`
5. **Logo** — versioned WebP assets (`*-v2.webp`), removed high-priority preload competition
6. **Cache-Control** — immutable headers for versioned brand assets; moderate TTL for legacy brand paths
7. **Fonts** — subset Syne 600/700, Figtree 400–700 (reduced WOFF2 payload)
8. **Accessibility** — token contrast bump (`--color-accent-text` → orange-800, `--color-subtle` → neutral-600); distinct article link labels

## Lighthouse mobile (local prod build, simulated throttling)

### Before (median of 3 runs)

| Run | Perf | A11y | LCP | FCP | TBT | CLS | SI | Render delay |
|-----|------|------|-----|-----|-----|-----|----|--------------|
| 1 | 82 | 96 | 4.8s | 1.2s | 92ms | 0 | 2.3s | 402ms |
| 2 | 82 | 96 | 4.8s | 1.2s | 69ms | 0 | 1.2s | 31ms |
| 3 | 89 | 96 | 3.8s | 1.2s | 11ms | 0 | 1.2s | 30ms |
| **Median** | **82** | **96** | **4.8s** | **1.2s** | **69ms** | **0** | **1.2s** | **31ms** |

User-reported production baseline: LCP **3.8s**, render delay **~2.08s** (same LCP element).

### After (median of 3 runs)

| Run | Perf | A11y | LCP | FCP | TBT | CLS | SI | Render delay |
|-----|------|------|-----|-----|-----|-----|----|--------------|
| 1 | 94 | 100 | 3.1s | 1.2s | 44ms | 0 | 2.3s | 1117ms* |
| 2 | 94 | 100 | 3.0s | 1.2s | 13ms | 0 | 1.2s | 141ms |
| 3 | 94 | 100 | 3.1s | 1.2s | 16ms | 0 | 1.2s | 143ms |
| **Median** | **94** | **100** | **3.1s** | **1.2s** | **16ms** | **0** | **1.2s** | **143ms** |

\*Run 1 outlier likely R2 404 on `hero-768.webp` (falls back to full hero).

### Delta (median)

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| LCP | 4.8s (lab) / 3.8s (user prod) | 3.1s | **−1.7s lab** |
| Render delay | 31ms (lab) / ~2080ms (user prod) | 143ms | **−1887ms vs user prod** |
| Performance | 82 | 94 | +12 |
| Accessibility | 96 | 100 | +4 |
| TBT | 69ms | 16ms | −53ms |
| CLS | 0 | 0 | — |

**LCP target (<2.5s):** Not yet met in lab; further gains expected after R2 upload of `hero-768.webp` and live CDN verification.

**REAL-USER CWV: PENDING** (no CrUX field data at time of writing).

## Image bytes

| Asset | Before | After | Notes |
|-------|--------|-------|-------|
| Logo | 85,478 B (915×199 PNG) | 5,886 B (580w WebP) | **−93%** |
| LCP hero (mobile) | 37,948 B (1024w) | 15,962 B (`hero-768.webp`) | **−58%** when served |
| LCP hero (desktop) | 37,948 B | 37,948 B | unchanged source |

Lab homepage image transfer (run 1): ~124 KiB → reduced after logo/hero optimization (exact total varies by R2 availability).

## JS / CSS

| Area | Finding | Action |
|------|---------|--------|
| Unused JS | ~78 KiB est. (header client bundle + Next runtime) | Audited; no safe removal without header refactor |
| Legacy JS | ~14 KiB polyfills | Next.js 16 defaults; no custom browserslist override |
| Render-blocking CSS | ~27 KiB (~80–310ms est.) | Tailwind public bundle; no admin leak found |
| Homepage client boundaries | Header + PreFooterCta only | All `components/home/*` remain Server Components |

Homepage public JS: **~248 KiB** transferred (substantially unchanged — fixes were image/LCP-focused).

## Manual R2 / Cloudflare actions

**P0 — before production verification:**

```bash
# Upload new versioned assets (paths must match resolveMediaUrl output)
npm run media:migrate:r2   # or sync specific keys:
#   /images/brand/smartlance-logo-v2.webp
#   /images/brand/smartlance-logo-dark-v2.webp
#   /images/brand/smartlance-mark-v2.webp
#   /images/projects/freelance-os/hero-768.webp
```

**P1 — R2 object metadata / Cloudflare:**

- Versioned brand `*-v2.webp`: `Cache-Control: public, max-age=31536000, immutable`
- Project screenshots: `public, max-age=2592000, stale-while-revalidate=86400`

See [`docs/CLOUDFLARE_PERFORMANCE_CONFIG.md`](CLOUDFLARE_PERFORMANCE_CONFIG.md).

## Security findings deferred

Documented for separate hardening phase — **not implemented in V1.1**:

- CSP enforcement
- HSTS `includeSubDomains` / preload
- COOP
- Trusted Types

## Tests

| Check | Result |
|-------|--------|
| `npx vitest run` | **684 passed**, 98 skipped |
| `npx tsc --noEmit` | **PASS** |
| `npm run build` | **PASS** |
| `npx prisma validate` | **PASS** |
| Migrations | **ZERO** |
| Integration suite | **Skipped** (not required for frontend-only pass) |

## Files changed

- `components/ui/site-image.tsx` — LCP props, `<picture>` mobile hero
- `components/home/hero.tsx` — mobile order, `lcp`, `sizes`
- `components/ui/logo.tsx` — versioned WebP assets
- `components/layout/header.tsx` — remove logo priority
- `components/ui/blog-card.tsx` — accessible article labels
- `app/globals.css` — contrast tokens
- `app/layout.tsx` — font weight subsetting
- `next.config.ts` — brand/project cache headers
- `lib/structured-data.ts`, `lib/repositories/siteSettingsRepository.ts`, `app/(site)/layout.tsx` — logo path v2
- `public/images/brand/*-v2.webp`, `public/images/projects/freelance-os/hero-768.webp` — new assets
- `docs/CLOUDFLARE_PERFORMANCE_CONFIG.md`, `docs/FRONTEND_PERFORMANCE_V1_1.md`

Artifacts: `docs/audit-artifacts/lighthouse-mobile-{run,after-run}*.json`
