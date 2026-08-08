# Blog Migration Report

Phase 4 — Legacy Insights → Next.js

## Total legacy URLs found

**56** WordPress posts from the live REST API / post sitemap (plus `/insights/` archive).

## Total migrated

**56** posts migrated to `content/blog/*.md` and published at `/blog/[slug]`.

Plus **3** existing modern articles retained:
- `/blog/what-makes-a-website-convert`
- `/blog/website-redesign-checklist`
- `/blog/technical-seo-foundations`

**Total published blog posts: 59**

## Same URLs preserved

**0** — WordPress used root permalinks `/{slug}/`; the Next.js architecture uses `/blog/[slug]`.

## URLs redirected

**56** permanent 308 redirects: `/{slug}` → `/blog/{slug}` (see `data/legacy-blog-redirects.ts` + `proxy.ts`).

Also: `/insights` → `/blog`; category archives `/hospitality`, `/performance`, `/analytics`, `/optimisation` → filtered blog views.

## Posts marked KEEP

**34** (including 3 modern articles)

## Posts marked UPDATE

**0**

## Posts marked MERGE

**0 implemented consolidations.** 28 posts noted as future MERGE candidates in `CONTENT_AUDIT.md`.

## Posts marked LEGACY

**25** — retained and published; not featured on homepage.

## Posts requiring manual review

**0**

## Images migrated

**52** featured images downloaded to `public/images/blog/<slug>/hero.webp`.

## Missing media

- `boost-off-season-bookings-with-pricelabs-dynamic-pricing` (source featured image 404)
- `harness-the-power-of-pricelabs-for-dynamic-airbnb-pricing` (source featured image 404)
- `leveraging-calendar-sync-to-scale-your-vacation-rental-business` (source featured image 404)
- `pricelabs-vs-manual-pricing-why-automation-wins` (source featured image 404)

## Broken links discovered

- Internal Smartlance URLs rewritten to Next.js destinations where mapped.
- External links preserved with `rel="noopener noreferrer"`.
- No systematic dead-external crawl beyond migration conversion; spot-check during QA.

## Redirects created

- 56 article root redirects
- Insights + category archive redirects

## Sitemap status

All published posts included via `getAllPosts()` in `app/sitemap.ts`. Redirect sources excluded.

## Remaining blockers

- Optional: recover 4 missing hero images
- Optional: future consolidation of overlapping PriceLabs/calendar clusters
- Production form delivery / analytics / final OG PNG remain launch ops tasks

