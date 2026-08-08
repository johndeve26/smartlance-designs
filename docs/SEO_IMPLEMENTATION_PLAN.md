# SEO Implementation Plan

**Date:** 2026-08-08

## COMPLETED SAFE FIXES (this sprint)

| Fix | Files |
|---|---|
| Canonical host alignment for sitemap/robots | `lib/seo/canonical.ts`, `app/sitemap.ts`, `app/robots.ts` |
| Sitemap excludes `noIndex`, uses real dates, includes legal | `lib/seo/sitemap-entries.ts` |
| robots.txt disallows `/admin/`, OAI-SearchBot policy | `app/robots.ts` |
| CMS `noIndex` / `canonicalOverride` / OG on public metadata | `lib/seo/page-metadata.ts`, entity pages |
| Managed page SEO (About, Contact, Pricing, …) | `buildManagedPageMetadata`, page updates |
| Search verification env support | `app/layout.tsx` (`GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`) |
| Industry detail routes | `app/industries/[slug]/page.tsx`, `components/industries/industry-page-template.tsx` |
| Resource CMS metadata | `lib/seo/resource-metadata.ts`, all resource detail pages |
| Industry sitemap entries | `lib/seo/sitemap-entries.ts` |
| Hub crawlable industry links | `components/industries/industries-sections.tsx` |
| Service card anchor text | `components/ui/service-card.tsx` |
| Production verification script | `scripts/run-seo-production-verification.ts` |
| Launch checklist | `docs/SEO_PRODUCTION_LAUNCH_CHECKLIST.md` |

## HIGH PRIORITY — HUMAN REVIEW

1. ~~**Industry detail pages**~~ — **DONE** (`/industries/[slug]`)
2. Production CDN crawler access verification (Cloudflare)
3. Vacation Rental Insights cluster — consolidation/refresh plan

## NORMAL

1. Improve generic internal anchor text site-wide
2. Per-page OG images for top commercial pages
3. Resource detail `generateMetadata` CMS wiring (guides, compare, …)
4. Blog category URL/canonical policy confirmation

## CONTENT IMPROVEMENT (assistant workflow)

Route via existing AI Content Assistants — not generic SEO writer:

- Thin industry specificity → Industry AI
- Platform stale SEO facts → Platform AI
- Service meta/title → Service AI
- Comparison outdated facts → Comparison AI

## RESEARCH REQUIRED

- Live SERP intent checks for priority commercial queries (manual)
- Search Console query data after sufficient impressions (future)

## OFF-PAGE (6-month authority roadmap)

| Month | Focus |
|---|---|
| 1–2 | Publish 2–3 link-worthy Guides/Tools; promote verified case studies |
| 2–3 | Digital PR around original frameworks (Project Planner insights, audit checklists) |
| 3–4 | Expert contributions to industry publications (vacation rental, web strategy) |
| 4–6 | Partner/vendor profiles where verified; client co-marketing for published Work |

No link farms, PBNs, or automated outreach.

## MANUAL PRODUCTION ACTIONS

- [ ] Set `canonicalHost` in Site Settings (Super Admin) if not production domain
- [ ] Add `GOOGLE_SITE_VERIFICATION` / `BING_SITE_VERIFICATION` env vars
- [ ] Verify sitemap at `{origin}/sitemap.xml` in GSC + Bing
- [ ] Optional: `INDEXNOW_ENABLED=true` + `INDEXNOW_KEY` for Bing IndexNow
- [ ] Cloudflare: allow verified search bots; avoid sitewide JS challenge on public HTML
- [ ] DNS/host: single-hop HTTPS redirect to canonical host

## FINAL STATUS

**READY FOR PRODUCTION SEO VERIFICATION**

Code gaps closed. Confirm deployed behavior in Search Console, Bing, and Cloudflare using `docs/SEO_PRODUCTION_LAUNCH_CHECKLIST.md`.
