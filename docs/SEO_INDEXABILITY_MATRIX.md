# SEO Indexability Matrix

Generated as part of the Smartlance comprehensive SEO baseline (2026-08-08).

## Policy summary

| Route family | Default index | Canonical | Sitemap | robots.txt | Notes |
|---|---|---|---|---|---|
| Homepage `/` | INDEX | self | yes | allow | CMS `noIndex` / `canonicalOverride` honored |
| Hubs (`/services`, `/solutions`, …) | INDEX | self | yes | allow | Managed-page SEO where configured |
| Service `/services/[slug]` | INDEX if published & not noindex | self or CMS override | yes if indexable | allow | |
| Solution `/solutions/[slug]` | INDEX if published & not noindex | self or CMS override | yes if indexable | allow | |
| Platform `/platforms/[slug]` | INDEX if published & not noindex | self or CMS override | yes if indexable | allow | |
| SEO topics `/seo/*` | INDEX | self | yes | allow | Static typed pages |
| Work `/work/[slug]` | INDEX if published & not noindex | self or CMS override | yes if indexable | allow | |
| Industries hub `/industries` | INDEX | self | yes | allow | |
| Industry detail `/industries/[slug]` | INDEX if published & not noindex | self or CMS override | yes if indexable | allow | Implemented with proven/supported boundaries |
| Insights `/blog/[slug]` | INDEX if published & not noindex | self or CMS override | yes if indexable | allow | |
| Blog archive `/blog` | INDEX page 1 only | always `/blog` | yes | allow | Page 2+ noindex |
| Blog category `?category=` | INDEX page 1 | canonical `/blog` | no separate URLs | allow | Consolidated archive policy |
| Resources `/guides`, `/compare`, etc. | INDEX if published & not noindex | self | yes if indexable | allow | |
| Managed pages (About, Contact, …) | INDEX unless Super Admin noindex | self or CMS override | yes if indexable | allow | |
| Legal `/legal/*` | INDEX | self | yes | allow | Managed-page SEO |
| Admin `/admin/*` | **NOINDEX** | n/a | **no** | disallow + meta | `X-Robots-Tag` on layout |
| Preview `/admin/preview/*` | **NOINDEX** | n/a | no | disallow | |
| API `/api/*` | **NOINDEX** | n/a | no | disallow | Not a substitute for auth |
| Project Planner / forms | INDEX | self | yes | allow | Utility but commercially useful |

## Crawler access (robots.txt)

| Crawler | Public content | Admin | API |
|---|---|---|---|
| `*` | allow `/` | disallow `/admin/` | disallow `/api/` |
| `OAI-SearchBot` | allow `/` | disallow `/admin/` | disallow `/api/` |

Sources: Google Search Central robots guidance; OpenAI OAI-SearchBot publisher guidance (2026-08).

## Sitemap rules

- Canonical production host from Site Settings (`canonicalHost`) via `getSiteOrigin()`
- Excludes `noIndex` CMS records
- Excludes admin, preview, API
- Uses real `updatedAt` / `materialUpdatedAt` where available — no fabricated `lastmod`
- Single sitemap file (no index) — URL count does not require splitting

## Manual review flags

1. **Blog category canonicalization** — categories index on page 1 but canonicalize to `/blog` (intentional consolidation)
2. **Production CDN/WAF** — verify Googlebot, Bingbot, OAI-SearchBot are not challenged (manual infra check)
