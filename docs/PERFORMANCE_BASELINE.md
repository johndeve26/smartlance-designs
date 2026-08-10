# Performance Baseline — Smartlance V1

Generated: 2026-08-10  
Stack: Next.js **16.3.0**, React **19.2.8**, Node (local), Vercel deploy target  
Measurement: local `next build && next start` at `http://localhost:3000`

> **Note:** Vercel preview/staging and production CDN/CWV verification are **pending** (run `scripts/run-performance-baseline.ts` against preview URL after deploy). Do not use WordPress production as the Next.js baseline.

Artifacts:
- [`docs/audit-artifacts/performance-before.json`](audit-artifacts/performance-before.json) — cold-ish first pass
- [`docs/audit-artifacts/performance-after.json`](audit-artifacts/performance-after.json) — warm pass after cache layer
- [`docs/audit-artifacts/performance-baseline.json`](audit-artifacts/performance-baseline.json) — latest copy

## Summary (local prod build)

| Metric | Before (1st pass) | After (warm pass) |
|--------|-------------------|-------------------|
| Avg public TTFB | ~7162 ms | ~1021 ms |
| Public routes OK | 18/18 | 18/18 |
| Private routes OK | 3/3 | 3/3 |
| Private cache leaks | 0 | 0 |
| `.next/static` size | ~2.6 MB | ~2.6 MB |

## Route sample (after / warm)

| Route | Class | TTFB | HTML bytes | Cache-Control | Bottleneck / notes |
|-------|-------|------|------------|---------------|-------------------|
| `/` | PUBLIC_CACHED | 2070 ms | 220 KB | `no-cache, must-revalidate` | Homepage CMS + showcase; cached reads + dedup |
| `/services` | PUBLIC_CACHED | 736 ms | 183 KB | `no-cache, must-revalidate` | Service list cached |
| `/services/website-redesign` | PUBLIC_CACHED | 2462 ms | 187 KB | `no-cache, must-revalidate` | Slug detail; metadata/page dedup |
| `/work` | PUBLIC_DYNAMIC | 797 ms | — | `no-cache, must-revalidate` | Filter query params |
| `/blog/technical-seo-foundations` | PUBLIC_CACHED | — | — | — | Insight slug cached |
| `/how-we-work` | STATIC | — | — | — | Typed content, no CMS DB |
| `/ai-automation` | STATIC | — | — | — | Typed content |
| `/admin` | AUTH_DYNAMIC | — | — | `no-store` (proxy + next.config) | Session gate |
| `/portal` | AUTH_DYNAMIC | — | — | `no-store` | Client portal |
| `/workspace` | AUTH_DYNAMIC | — | — | `no-store` | Prospect workspace |
| `/_next/static/*` | STATIC | — | — | long-lived immutable (framework) | Hashed assets ~2.6 MB total |

## Rendering mode (post-change)

- Root layout: **no `headers()`** — public marketing routes no longer forced dynamic by chrome detection
- Public chrome: `app/(site)/layout.tsx` (header, footer, analytics, structured data)
- Admin / portal / workspace: separate trees, `force-dynamic` where declared
- `cacheComponents`: **OFF** (not enabled)
- `"use cache"`: **none**
- Public data cache: `unstable_cache` + `React.cache` via [`lib/public/cache/`](../lib/public/cache/)

## Known bottlenecks (P1 addressed / P2 remaining)

| Priority | Finding | Status |
|----------|---------|--------|
| P1 | Uncached public CMS reads on every request | **Addressed** — centralized cache layer |
| P1 | Duplicate metadata + page DB fetches | **Addressed** — `React.cache` in request-memo |
| P1 | Root `headers()` forcing dynamic sitewide | **Addressed** — `(site)` route group |
| P1 | Managed page invalidation gap | **Addressed** — `revalidateManagedPage` |
| P2 | HTML still `no-cache, must-revalidate` locally | Expected for dev server; verify on Vercel preview |
| P2 | Lighthouse / CWV on preview | **Pending** |
| P2 | Cloudflare edge HTML caching | **Not enabled** — see CLOUDFLARE doc |
| P3 | Font weight subsetting | Deferred — only default weights loaded via `next/font` |

## Commands

```bash
# Baseline capture
SITE_URL=http://localhost:3000 npx tsx scripts/run-performance-baseline.ts
SITE_URL=https://your-preview.vercel.app RUN_LABEL=preview npx tsx scripts/run-performance-baseline.ts
```
