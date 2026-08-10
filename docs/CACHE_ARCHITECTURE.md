# Cache Architecture — Smartlance V1

## Overview

Smartlance uses **tag-based on-demand invalidation** with **`unstable_cache`** for public published content. Write-path invalidation was already mature; V1 adds read-path caching and closes managed-page gaps.

**Not used:** global `cacheComponents`, `"use cache"`, shared cache for authenticated data.

## Module layout

```
lib/public/cache/
  config.ts         # TTL, test bypass
  tags.ts           # re-exports CACHE_TAGS
  cached-reads.ts   # unstable_cache wrappers (Prisma → public DTO)
  request-memo.ts   # React.cache per-request dedup
  index.ts          # public API for pages
```

Existing cached reads (unchanged pattern):
- `getPublicNavigation()` — `navigation` tag, 300s fallback
- `getPublicSettings()` — `site-settings` tag, 300s fallback

## Tag taxonomy

Tags in [`lib/admin/publishing.ts`](../lib/admin/publishing.ts) (alias `public:*` in prose):

| Content | List tag | Entity tag | Hub tags |
|---------|----------|------------|----------|
| Homepage | `homepage` | — | — |
| Services | `service` | `service:{slug}` | `services-hub` |
| Solutions | `solution` | `solution:{slug}` | `solutions-hub` |
| Platforms | `platform` | `platform:{slug}` | `platforms-hub` |
| Work | `work` | `work:{slug}` | `work-hub` |
| Insights | `insight` | `insight:{slug}` | `blog-hub` |
| Resources | `resources` | `resource:{type}:{slug}` | `resources-hub` |
| Industries | `industries` | — | — |
| Testimonials | `testimonials` | — | — |
| Navigation | `navigation` | — | — |
| Site settings | `site-settings` | — | — |
| Managed pages | — | `managed-page:{key}` | — |
| Sitemap | `sitemap` | — | — |
| CMS runtime probe | `cms-runtime` | — | — |

**TTL fallback:** 3600s (`PUBLIC_CACHE_REVALIDATE_SECONDS`) — tags remain authoritative for freshness.

## Invalidation matrix

| Content | Create draft | Update draft | Publish | Archive/unpublish | Delete |
|---------|-------------|--------------|---------|-------------------|--------|
| Service | — | — | `revalidateService` | `revalidateService` | `revalidateService` |
| Solution | — | — | `revalidateSolution` | same | same |
| Platform | — | — | `revalidatePlatform` | same | same |
| Work | — | — | `revalidateWork` (+ homepage, industries) | same | same |
| Insight | — | — | `revalidateInsight` (+ homepage) | same | same |
| Resource | — | — | `revalidateCmsResource` | same | same |
| Homepage | — | — | `revalidateHomepage` | — | — |
| Navigation | — | — | `revalidateNavigation` | — | — |
| Site settings | — | — | `revalidateSiteSettings` | — | — |
| Managed page | — | — | `revalidateManagedPage` | — | — |
| Redirects | — | — | `revalidateRedirects` | — | — |

Draft saves intentionally **do not** revalidate public cache.

## Privacy class

| Class | Cache | Key includes user? |
|-------|-------|-------------------|
| Public published DTO | Yes — shared | No |
| Preview/draft | No | N/A |
| Admin/portal/workspace | No | N/A |
| Session/auth | No | N/A |
| Free website review results | No | Must not share between users |

## Preview safety

- Preview URL: `/admin/preview/[entity]/[id]` with token/cookie gate
- Loaders: `getServiceForPreview`, `getHomepageForPreview`, etc.
- **Never** wrapped in `lib/public/cache/cached-reads.ts`

## Request deduplication

`generateMetadata` + page both call the same memoized getter, e.g.:

```ts
import { getHomepageContent } from "@/lib/public/cache";
```

Single DB read per request (when cache miss), single cross-request cache entry when hit.

## Failure modes

- Cache miss → repository/DB (source of truth)
- DB error → existing fail-closed behavior in loaders (empty arrays / null)
- Invalidation failure → TTL bound (3600s max staleness)

## Tests

- `tests/performance/public-cache-invalidation.test.ts`
- `tests/performance/preview-cache-isolation.test.ts`
- `tests/admin/publishing-tags.test.ts`
