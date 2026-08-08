# Technical SEO Audit

**Date:** 2026-08-08  
**Scope:** Public Smartlance site (excludes `/admin/*` content indexing)  
**Verdict category:** See `docs/SEO_IMPLEMENTATION_PLAN.md`

## Crawl & indexation

| Check | Status | Notes |
|---|---|---|
| Public pages server-rendered | PASS | Next.js App Router SSR for core templates |
| Admin noindex | PASS | Layout robots + `X-Robots-Tag` |
| CMS `noIndex` on public metadata | **FIXED** | Services, platforms, solutions, work, insights, homepage, managed pages |
| Industry detail routes | **RESOLVED** | `/industries/[slug]` shipped with proven/supported boundaries |
| Blog pagination noindex | PASS | Page 2+ noindex in `app/blog/page.tsx` |

## robots.txt

| Check | Status | Notes |
|---|---|---|
| Allows public crawl | PASS | |
| Disallows `/admin/` | **FIXED** | Added explicit disallow |
| Disallows `/api/` | PASS | |
| OAI-SearchBot policy | **FIXED** | Explicit allow public / disallow admin |
| Sitemap reference | PASS | Uses canonical origin |

## Sitemap

| Check | Status | Notes |
|---|---|---|
| Canonical host | **FIXED** | Uses `getSiteOrigin()` from Site Settings |
| Excludes noindex | **FIXED** | Prisma filters |
| Excludes admin | PASS | |
| Real lastmod | **IMPROVED** | DB `updatedAt` / `materialUpdatedAt` |
| Legal pages | **FIXED** | Included from managed pages |
| Sitemap index | N/A | Single file sufficient |

## Canonicals

| Check | Status | Notes |
|---|---|---|
| Self-canonical on indexable pages | PASS | via `buildPageMetadata` |
| CMS canonicalOverride | **FIXED** | Wired on major CMS families |
| metadataBase | PASS | Root layout uses Site Settings URL |
| Blog archive canonical | PASS | Always `/blog` |

## Redirects

| Check | Status | Notes |
|---|---|---|
| Legacy WP redirects | PASS | `proxy.ts` 308 map |
| DB slug redirects | PASS | redirect-lookup API |
| Admin protected | PASS | Auth + noindex |

## JavaScript rendering

| Check | Status | Notes |
|---|---|---|
| Critical content in HTML | PASS | Templates SSR primary content |
| Client-only navigation for key routes | LOW risk | Nav uses crawlable links |

## Structured data

| Check | Status | Notes |
|---|---|---|
| Valid JSON-LD helpers | PASS | Tests added |
| No fake ratings | PASS | |
| Organization/WebSite global | PASS | |

## Performance (code review)

| Risk | Severity | Notes |
|---|---|---|
| LCP hero images | NORMAL | Review per-template in production CWV report |
| Font loading | LOW | `display: swap` configured |
| Third-party analytics | NORMAL | Consent-aware scripts in layout |

**Manual:** Run Search Console Core Web Vitals + field data in production.

## Security

| Check | Status |
|---|---|
| Admin not in sitemap | PASS |
| Schema escaping | PASS |
| IndexNow key not committed | PASS (env-only) |

## CDN / WAF (manual production)

Verify in Cloudflare/hosting:

- Googlebot, Bingbot, OAI-SearchBot not receiving persistent 403/429/CAPTCHA on public URLs
- HTTPS enforced with single canonical host redirect (www/non-www per Site Settings)

## BLOCKERS

None remaining after safe fixes in this sprint.

## HIGH

1. Production CDN crawler access verification (Cloudflare)
2. Vacation Rental Insights cluster — consolidation/refresh plan

## NORMAL

1. Align internal links away from redirect targets (link-health backlog)
2. Resource detail CMS SEO — **FIXED** on guides, comparisons, checklists, glossary, templates, tools
