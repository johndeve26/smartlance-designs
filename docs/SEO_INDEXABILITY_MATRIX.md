# SEO Indexability Matrix

Last updated: SEO Indexability Acceptance V1 (2026-08-10).

## Policy summary

| Route family | Default index | Canonical | Sitemap | robots.txt | Notes |
|---|---|---|---|---|---|
| Homepage `/` | INDEX | self | yes | allow | CMS `noIndex` / `canonicalOverride` honored |
| Hubs (`/services`, `/solutions`, …) | INDEX | self | yes | allow | Managed-page SEO where configured |
| **AI & Automation hub `/ai-automation`** | **INDEX** | **self** | **yes** | allow | Code-driven; static sitemap entry |
| **AI child `/ai-automation/[slug]`** | **INDEX** | **self** (`/ai-automation/{slug}`) | **yes** | allow | 6 slugs; invalid slug → 404 |
| **Operations solutions** (`/solutions/respond-to-leads-faster`, etc.) | **INDEX** | **self** | **yes** | allow | 6 code-driven problem pages |
| Service `/services/[slug]` | INDEX if published & not noindex | self or CMS override | yes if indexable | allow | |
| Solution `/solutions/[slug]` (DB) | INDEX if published & not noindex | self or CMS override | yes if indexable | allow | |
| Platform `/platforms/[slug]` | INDEX if published & not noindex | self or CMS override | yes if indexable | allow | |
| SEO topics `/seo/*` | INDEX | self | yes | allow | Static typed pages |
| Work `/work` | INDEX | **always `/work`** | yes | allow | Query filters are QUERY_VARIANT |
| Work `/work?capability=*` | QUERY_VARIANT | **canonical `/work`** | no separate URL | allow | UI filter only; not indexable variants |
| Work `/work/[slug]` | INDEX if published & not noindex | self or CMS override | yes if indexable | allow | |
| Industries hub `/industries` | INDEX | self | yes | allow | |
| Industry detail `/industries/[slug]` | INDEX if published & not noindex | self or CMS override | yes if indexable | allow | Implemented with proven/supported boundaries |
| Insights `/blog/[slug]` | INDEX if published & not noindex | self or CMS override | yes if indexable | allow | |
| Blog archive `/blog` | INDEX page 1 only | always `/blog` | yes | allow | Page 2+ noindex |
| Blog category `?category=` | QUERY_VARIANT | canonical `/blog` | no separate URLs | allow | Consolidated archive policy |
| Resources `/guides`, `/compare`, etc. | INDEX if published & not noindex | self | yes if indexable | allow | |
| Managed pages (About, Contact, …) | INDEX unless Super Admin noindex | self or CMS override | yes if indexable | allow | |
| Legal `/legal/*` | INDEX | self | yes | allow | Managed-page SEO |
| **Free Website Review `/free-website-review`** | **INDEX** | **self** | **yes** | allow | Public acquisition landing |
| **Website Brief `/website-brief`** | **INDEX** | **self** | **yes** | allow | Public builder entry |
| **Project Planner `/project-planner`** | **INDEX** | **self** | **yes** | allow | |
| **Free Tools `/free-tools`** | **INDEX** | **self** | **yes** | allow | |
| Free review result `/free-website-review/[id]` | **NOINDEX** | n/a | **no** | allow | Private generated result |
| Admin `/admin/*` | **NOINDEX** | n/a | **no** | disallow + meta | `X-Robots-Tag` on layout |
| Client Portal `/portal/*` | **NOINDEX** | n/a | **no** | allow | Layout robots + auth |
| Prospect Workspace `/workspace/*` | **NOINDEX** | n/a | **no** | allow | Layout robots + auth |
| Preview `/admin/preview/*` | **NOINDEX** | n/a | no | disallow | |
| API `/api/*` | **NOINDEX** | n/a | no | disallow | Not a substitute for auth |
| **Legacy AI `/services/ai-*`** | **REDIRECT** | n/a | **no** | allow | 308 → `/ai-automation/*` |

## Priority AI routes (indexable)

| Path | Classification |
|------|----------------|
| `/ai-automation` | INDEX |
| `/ai-automation/ai-agents` | INDEX |
| `/ai-automation/workflow-automation` | INDEX |
| `/ai-automation/voice-ai` | INDEX |
| `/ai-automation/integrations` | INDEX |
| `/ai-automation/crm-lead-automation` | INDEX |
| `/ai-automation/custom-ai-tools` | INDEX |

## Priority operations solution routes (indexable)

| Path | Classification |
|------|----------------|
| `/solutions/respond-to-leads-faster` | INDEX |
| `/solutions/automate-repetitive-work` | INDEX |
| `/solutions/stop-leads-falling-through-the-cracks` | INDEX |
| `/solutions/automate-customer-enquiries` | INDEX |
| `/solutions/connect-business-tools` | INDEX |
| `/solutions/centralize-business-knowledge` | INDEX |

## Legacy AI redirects (not in sitemap)

| From | To | Status |
|------|-----|--------|
| `/services/ai-solutions` | `/ai-automation` | 308 |
| `/services/ai-agents` | `/ai-automation/ai-agents` | 308 |
| `/services/workflow-automation` | `/ai-automation/workflow-automation` | 308 |
| `/services/voice-ai` | `/ai-automation/voice-ai` | 308 |
| `/services/ai-integrations` | `/ai-automation/integrations` | 308 |
| `/services/custom-ai-tools` | `/ai-automation/custom-ai-tools` | 308 |

## Canonical domain

- Configured origin: `NEXT_PUBLIC_SITE_URL` or `https://smartlancedesigns.com` ([`lib/site.ts`](lib/site.ts))
- Runtime origin: Site Settings `canonicalHost` via `getSiteOrigin()` ([`lib/seo/canonical.ts`](lib/seo/canonical.ts))
- Current baseline audit origin: `https://smartlancedesigns.com` (apex, no www prefix in config)

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
