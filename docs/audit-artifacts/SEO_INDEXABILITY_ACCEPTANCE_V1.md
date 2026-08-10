# SEO Indexability Acceptance V1

**Generated:** 2026-08-10  
**Acceptance version:** SEO_INDEXABILITY_ACCEPTANCE_V1

---

## Executive verdict

**STAGING TECHNICAL SEO VERIFIED — PRODUCTION INDEXABILITY PENDING**

The Next.js codebase passes technical SEO acceptance for all **13 priority URLs** (7 AI + 6 operations solutions) when verified against a local production build (`npm run build && npm start`). Automated tests, sitemap inventory, legacy redirects, and content differentiation checks all pass in code.

**Production domain `https://smartlancedesigns.com` still serves the legacy WordPress site.** Next.js routes including `/ai-automation/*` and the six new operations solution pages return **404** on live production. Legacy `/services/ai-*` paths redirect with **301** (WordPress), not the intended **308** Next.js map. Production HTTP verification therefore cannot confirm Next.js indexability until deployment.

**Google indexing status:** NOT VERIFIED IN THIS PASS (no Search Console inspection).

---

## Environment tested

| Environment | Base URL | Result |
|-------------|----------|--------|
| **Staging (local prod build)** | `http://localhost:3001` | Priority matrix **PASS** (13/13 URLs) |
| **Production (live)** | `https://smartlancedesigns.com` | Legacy WordPress — Next.js routes **not deployed** |

**Canonical domain (configured):** `https://smartlancedesigns.com` (apex)  
**Canonical domain (live WordPress):** `https://www.smartlancedesigns.com` (www preferred via 301)

Artifacts:
- `docs/audit-artifacts/seo-baseline-audit.json`
- `docs/audit-artifacts/seo-indexability-acceptance.json`
- `docs/SEO_INDEXABILITY_MATRIX.md`

---

## Priority URL matrix (13 Search Console targets)

Staging HTTP verification (`localhost:3001`, canonical origin `https://smartlancedesigns.com`):

| URL | Status | Canonical | Robots | Title | H1 | SSR |
|-----|--------|-----------|--------|-------|-----|-----|
| `/ai-automation` | 200 | ✅ self | index,follow | ✅ | ✅ | ✅ |
| `/ai-automation/ai-agents` | 200 | ✅ self | index,follow | ✅ | ✅ | ✅ |
| `/ai-automation/workflow-automation` | 200 | ✅ self | index,follow | ✅ | ✅ | ✅ |
| `/ai-automation/voice-ai` | 200 | ✅ self | index,follow | ✅ | ✅ | ✅ |
| `/ai-automation/integrations` | 200 | ✅ self | index,follow | ✅ | ✅ | ✅ |
| `/ai-automation/crm-lead-automation` | 200 | ✅ self | index,follow | ✅ | ✅ | ✅ |
| `/ai-automation/custom-ai-tools` | 200 | ✅ self | index,follow | ✅ | ✅ | ✅ |
| `/solutions/respond-to-leads-faster` | 200 | ✅ self | index,follow | ✅ | ✅ | ✅ |
| `/solutions/automate-repetitive-work` | 200 | ✅ self | index,follow | ✅ | ✅ | ✅ |
| `/solutions/stop-leads-falling-through-the-cracks` | 200 | ✅ self | index,follow | ✅ | ✅ | ✅ |
| `/solutions/automate-customer-enquiries` | 200 | ✅ self | index,follow | ✅ | ✅ | ✅ |
| `/solutions/connect-business-tools` | 200 | ✅ self | index,follow | ✅ | ✅ | ✅ |
| `/solutions/centralize-business-knowledge` | 200 | ✅ self | index,follow | ✅ | ✅ | ✅ |

**Invalid slugs:** `/ai-automation/not-real` and `/solutions/not-real` → **404** (correct).

---

## Redirect matrix (legacy AI paths)

Staging (Next.js `proxy.ts`):

| From | To | Status | Hops |
|------|-----|--------|------|
| `/services/ai-solutions` | `/ai-automation` | 308 | 1 |
| `/services/ai-agents` | `/ai-automation/ai-agents` | 308 | 1 |
| `/services/workflow-automation` | `/ai-automation/workflow-automation` | 308 | 1 |
| `/services/voice-ai` | `/ai-automation/voice-ai` | 308 | 1 |
| `/services/ai-integrations` | `/ai-automation/integrations` | 308 | 1 |
| `/services/custom-ai-tools` | `/ai-automation/custom-ai-tools` | 308 | 1 |

Production (WordPress): all six paths **301 → www**, destinations still legacy WordPress URLs — **not verified** against Next.js map.

---

## Sitemap matrix

Baseline audit (`run-seo-baseline-audit.ts`):

| Check | Result |
|-------|--------|
| Total URLs | 149 (baseline) / 184 (staging build with DB content) |
| AI hub + 6 children present | ✅ |
| 6 operations solutions present | ✅ |
| Legacy `/services/ai-*` absent | ✅ |
| Sitemap mismatches vs inventory | 0 |

---

## Robots & crawl control

| Check | Staging | Production (WordPress) |
|-------|---------|------------------------|
| `/robots.txt` allows `/` | ✅ | ✅ (WordPress Rank Math) |
| Disallows `/admin/` | ✅ | N/A (no Next.js admin) |
| Disallows `/api/` | ✅ | N/A |
| Global noindex on public pages | ❌ none detected | ❌ none on homepage |
| `X-Robots-Tag: noindex` on AI/solution pages | ❌ none | N/A (404) |

---

## SSR content checks (priority URLs)

All 13 priority URLs render **title**, **meta description**, **canonical**, and **H1** in raw HTML on staging. AI child pages include **BreadcrumbList** JSON-LD. Root layout includes **Organization** + **WebSite** schema.

---

## Internal linking & content audit

| Check | Result |
|-------|--------|
| Stale `/services/ai-*` internal hrefs in app code | **None** (only redirect map + tests) |
| Header/footer AI links → `/ai-automation/*` | ✅ (`data/navigation.ts`) |
| AI page content differentiation | ✅ unique metaTitle, heroTitle, first section per slug |
| Lead-related ops solutions distinct titles | ✅ 3 distinct metaTitles |
| Orphan audit (`audit-internal-links.ts`) | AI routes linked via nav; no new orphans flagged |
| Structured data | Organization + WebSite in `app/layout.tsx`; BreadcrumbList on AI pages |

---

## Work page query variants

| URL | Canonical (metadata) | Index |
|-----|---------------------|-------|
| `/work` | `/work` | index |
| `/work?capability=websites` | `/work` (UI filter only) | index on page; not separate sitemap URLs |
| `/work?capability=ai` | `/work` | same |
| `/work?capability=automation` | `/work` | same |
| `/work?capability=random` | `/work` | same |

---

## Findings by priority

### P0 — Blockers

| ID | Finding | Status | Notes |
|----|---------|--------|-------|
| P0-1 | **Next.js not live on production domain** | **OPEN (deployment)** | Live site is WordPress; `/ai-automation` returns 404 on www |
| P0-2 | Malformed `NEXT_PUBLIC_SITE_URL` in local `.env.local` | **OPEN (config)** | Embeds `DATABASE_URL`; causes bad canonicals on some hub pages locally. Fix `.env.local` line break before production deploy. Guard exists in `lib/env.ts`. |

### P1 — High

| ID | Finding | Status | Notes |
|----|---------|--------|-------|
| P1-1 | Production legacy AI redirects use 301 not 308 | **OPEN (deployment)** | WordPress handles redirects until Next.js cutover |
| P1-2 | Canonical host mismatch apex vs www on live site | **OPEN (deployment)** | Live WordPress canonicalizes to `www.smartlancedesigns.com`; Next.js config uses apex |

### P2 — Medium (deferred)

| ID | Finding | Notes |
|----|---------|-------|
| P2-1 | Hub pages (`/services`, `/solutions`, etc.) canonical affected by env when `NEXT_PUBLIC_SITE_URL` malformed | Resolved by env fix at deploy |
| P2-2 | `/industries/short-term-rentals` 404 in staging DB | Industry exists in catalog; may need publish in CMS |

### P3 — Low (deferred)

| ID | Finding |
|----|---------|
| P3-1 | Service schema not added to AI child pages (BreadcrumbList only) |

**Code fixes applied in this pass:** None required for indexability logic — defects are deployment/config, not application bugs.

---

## Automated test coverage added

| File | Coverage |
|------|----------|
| `tests/public/ai-automation-routes.test.ts` | Unique metadata, self-canonical, legacy redirect keys, invalid slug |
| `tests/seo/technical-seo.test.ts` | Sitemap AI + ops inclusion, legacy exclusion, distinct ops titles |
| `tests/seo/indexability-acceptance.test.ts` | Work canonical, robots.txt, AI noindex, content differentiation |

**Script:** `scripts/run-seo-production-verification.ts` — extended with full priority matrix, redirect checks, sitemap audit, SSR assertions. Outputs `seo-indexability-acceptance.json`.

---

## Regression gates

| Gate | Result |
|------|--------|
| `npx vitest run` | **673 passed**, 98 skipped, 0 failed |
| `npx tsc --noEmit` | **Pass** |
| `npm run build` | **Pass** |
| `npx prisma validate` | **Pass** (no schema changes) |

---

## Search Console priority URL list

Submit for inspection after Next.js production deploy:

1. `https://smartlancedesigns.com/ai-automation`
2. `https://smartlancedesigns.com/ai-automation/ai-agents`
3. `https://smartlancedesigns.com/ai-automation/workflow-automation`
4. `https://smartlancedesigns.com/ai-automation/voice-ai`
5. `https://smartlancedesigns.com/ai-automation/integrations`
6. `https://smartlancedesigns.com/ai-automation/crm-lead-automation`
7. `https://smartlancedesigns.com/ai-automation/custom-ai-tools`
8. `https://smartlancedesigns.com/solutions/respond-to-leads-faster`
9. `https://smartlancedesigns.com/solutions/automate-repetitive-work`
10. `https://smartlancedesigns.com/solutions/stop-leads-falling-through-the-cracks`
11. `https://smartlancedesigns.com/solutions/automate-customer-enquiries`
12. `https://smartlancedesigns.com/solutions/connect-business-tools`
13. `https://smartlancedesigns.com/solutions/centralize-business-knowledge`

---

## Google indexing status

**NOT VERIFIED IN THIS PASS**

Indexing confirmation requires Google Search Console URL Inspection after Next.js is live on the production domain.

---

## Recommended next steps (post-acceptance)

1. Fix `.env.local` / production env: single-line `NEXT_PUBLIC_SITE_URL=https://smartlancedesigns.com` (or chosen canonical host).
2. Deploy Next.js to production domain (or cutover DNS/hosting from WordPress).
3. Re-run: `SITE_URL=https://smartlancedesigns.com npx tsx scripts/run-seo-production-verification.ts`
4. Confirm apex/www redirect policy matches `SiteSettings.canonicalHost`.
5. Submit the 13 priority URLs in Search Console.

---

## Sign-off summary

| Layer | Status |
|-------|--------|
| SEO implemented in code | ✅ Verified |
| Staging technical SEO | ✅ Verified |
| Production Next.js indexability | ⏳ Pending deployment |
| Google indexing | ⏳ Not verified |
