# On-Page SEO Audit

**Date:** 2026-08-08  
**Method:** CMS inventory (`buildSeoInventory`), route/template review, content architecture mapping  
**No composite SEO score** — severity categories only

## Title tags

| Finding | Severity | Action |
|---|---|---|
| Missing SEO titles on published pages | ERROR (per page) | Fix in Admin / assistant workflow |
| Duplicate titles among indexable pages | WARNING | Review in `/admin/seo` |
| Work pages using project name vs SEO title | NORMAL | Prefer `seoTitle` when set — **FIXED** in metadata |
| Title length guidance | INFO | Admin inventory warnings only |

### Title architecture (guidance)

- Service: `{Service} | Smartlance Designs` when custom title not better
- Solution: problem/outcome language — not a duplicate Service page
- Platform: platform-specific positioning
- Insight: `{Article title} | Smartlance Designs`

## Meta descriptions

| Finding | Severity | Action |
|---|---|---|
| Missing descriptions | ERROR | Admin / assistant |
| Generic descriptions | NORMAL | Human editorial review |
| Unsupported claims | HIGH | Remove or substantiate — never invent rankings |

## H1 & headings

| Finding | Severity | Action |
|---|---|---|
| Service/Solution/Platform templates | PASS | Clear primary H1 from CMS |
| Heading hierarchy skips | LOW | Fix during content refresh passes |
| Style-only headings | LOW | Human review |

## Search intent map (commercial pillars)

| Page | Primary intent |
|---|---|
| Website Design | Commercial — design capability |
| Website Development | Commercial — build/engineering |
| Website Redesign | Commercial — refresh/rebuild |
| Website Strategy | Commercial — planning/direction |
| SEO / Technical / Local / On-page | Commercial — search services (distinct scopes) |
| CRO / Performance / Audit / Migration | Commercial — measurable improvement |
| Solutions hub | Problem-led commercial |
| Platforms hub | Technology fit |
| Industries hub | Sector context (detail pages pending) |
| Work | Proof / relevance |
| Resources | Education / decision support |

## Cannibalization review

| Cluster | Risk | Recommendation |
|---|---|---|
| Website Design vs Development vs Redesign vs Strategy | MEDIUM | Preserve distinct intent — see Content Quality Audit |
| SEO service vs `/seo/*` topic pages | MEDIUM | Services = commercial; `/seo/*` = educational depth |
| Solutions vs Services | MEDIUM | Solutions own problem queries; avoid duplicate copy |
| Vacation Rental Insights cluster | HIGH (volume) | **KEEP / REFRESH / CONSOLIDATION REVIEW** — no mass delete |
| 20 Industries (when routed) | HIGH | Avoid near-identical “web design for X” — Industry AI specificity |

## Insights cluster (Vacation Rentals)

Substantial archive — recommended disposition:

| Action | Criteria |
|---|---|
| KEEP | Strong, distinct, accurate, internally linked |
| REFRESH | Decayed facts, weak intro, missing internal links |
| CONSOLIDATION REVIEW | Near-duplicates competing for same intent |
| ARCHIVE REVIEW | Thin/outdated with no unique value |

Do not auto-delete or auto-consolidate.

## Internal links (on-page)

- Commercial CTAs present on templates — PASS
- Descriptive anchor improvement — NORMAL backlog
- Orphan detection — use `/admin/link-health`

## Open Graph / social

| Finding | Severity | Action |
|---|---|---|
| Default OG fallback | INFO | Acceptable; prioritize homepage + core services |
| Per-page OG from CMS | PARTIAL | Homepage + CMS fields wired; expand during editorial passes |

## Content changes

**No mass rewrites in this sprint.** Subjective copy → human backlog + existing AI assistants.
