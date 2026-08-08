# Launch Readiness

Date: 2026-08-07  
Site: Smartlance Designs  
Phase: Production hardening + launch audit (Admin Phases 1–5 complete)

**Legal:** Privacy Statement Contact/Review sections are technical-complete; **legacy legal sections remain HUMAN REVIEW REQUIRED** — do not treat as auto-cleared compliance.

**Ops docs:** `PRODUCTION_DEPLOYMENT.md`, `DISASTER_RECOVERY.md`, `PRODUCTION_RELEASE_CHECKLIST.md`, `PRODUCTION_HARDENING_REPORT.md`, `ENVIRONMENT.md`.

Canonical migration: `npx prisma migrate deploy` only — never reset as normal deploy.

---

## Code

- Next.js App Router production architecture
- Brand contrast and CTA accessibility preserved
- Company, portfolio, testimonials, legal migrated
- **56 legacy Insights posts migrated** to `/blog/[slug]`
- **5 platform pages** at `/platforms` and `/platforms/[slug]` with legacy `/platform/*` redirects
- Blog archive: category filters + pagination (12/page); page 2+ noindex
- Legacy root post redirects: `/{slug}` → `/blog/{slug}` (308)
- Forms delivery + analytics abstractions ready

## Content

- Real company details, 8 projects, 7 testimonials, legal pages
- Blog: **59** published articles (56 migrated + 3 modern)
- Homepage features modern Website Design / SEO / Conversion articles (not PriceLabs-heavy posts)
- Vacation rental / PriceLabs content retained in blog for topical authority

## Forms

- Needs production Resend and/or webhook credentials — see **Commercial journey & conversion** (launch blocker)

## Layout width system (2026)

Full tokens and usage: [`LAYOUT.md`](./LAYOUT.md)

- Shell/standard: **1280px** (`Container`) — header, footer, hubs, and page body share one left and right edge
- Reading / narrow / interactive: **same as shell** (no inset page columns)
- Gutters: **20 / 24 / 32px**
- Prefer `Container` over one-off `max-w-[…]` shells; short headline/deck `max-w-*` only
- No new routes from this pass

## Commercial journey & conversion (2026)

Full architecture: [`COMMERCIAL_JOURNEY.md`](./COMMERCIAL_JOURNEY.md)

### Navigation / CTA architecture

- **Status: implemented** after Prompt 22 audit
- Global header primary (`siteConfig.cta.primary`): **Tell Us About Your Project** → `/contact`
- Global secondary (`siteConfig.cta.secondary`): **Get a Free Website Review** → `/free-website-review`
- Homepage hero: Contact + View Our Work (2 CTAs max); Planner contextual; Free Review mid-page teaser
- Page-level CTA matrix (Services, Solutions, Pricing, tools, 404, etc.) documented in `COMMERCIAL_JOURNEY.md`
- Footer company includes Project Planner, Contact, Free Website Review
- No new routes; Cost Calculator remains unpublished

### Contact form

- Route: `/contact` → `POST /api/contact` → `submitContactEnquiry()`
- Validation + honeypot (`_gotcha`) + rate limit; Site Settings can disable the form
- **Persistence to PostgreSQL is required for public success**
- Notification (Resend/webhook) is best-effort; failure is recorded and visible in Admin

### Free Review form

- Route: `/free-website-review` → `POST /api/website-review` → `submitWebsiteReviewEnquiry()`
- Distinct from paid Website Audit service
- Same persistence-first + spam protection model as Contact

### Email / webhook notification

| Status | Detail |
| --- | --- |
| **Recommended for launch** | Configure Resend (`RESEND_API_KEY` + `CONTACT_TO_EMAIL`) **or** webhook so the team is notified promptly |
| **Not a sole blocker if DB works** | Submissions still appear in `/admin/enquiries` when persistence succeeds |
| **Still a blocker** | Form claims success without DB persistence; PII exposed without authorization; unsafe unvalidated POST |

See `ENQUIRY_OPERATIONS.md` and `PHASE_5_COMPLETION.md`.

### Spam protection

- Honeypot field: `_gotcha` (fake success, no persist)
- Rate limit: in-memory sliding window `isFormRateLimited` — **8 submissions / hour / hashed IP / route**

### Analytics privacy

- Anonymous events only; `sanitizePayload` strips PII keys
- Planner / template / selector answers never in analytics
- Primary conversions: `contact_form_submitted`, `free_review_submitted` (+ error variants without field data)
- `/admin` excluded from public analytics scripts
- Contact/Review forms use Clarity mask attribute where Clarity is loaded
- Wire GTM/GA/Clarity IDs when ready (optional at launch)

### Phase 5 commercial operations checks

- [ ] Contact persists to DB and appears in Admin
- [ ] Free Review persists to DB and appears in Admin
- [ ] Notification configured (or System clearly shows Not configured)
- [ ] Notification failure leaves enquiry intact with FAILED status
- [ ] Unauthorized roles cannot view enquiry PII
- [ ] Export / anonymize / delete Super Admin only
- [ ] Privacy statement covers Contact + Free Review (legal review flagged for legacy sections)

### Mobile / accessibility (commercial paths)

- Brand contrast and CTA accessibility preserved (see Code section)
- Header / footer CTAs and form controls use shared Button / form patterns sized for touch
- Commercial forms remain single-column and keyboard-accessible; honeypot is visually hidden, not removed from tab order incorrectly
- Homepage hero capped at two CTAs to avoid mobile CTA overload

## Services expansion (2026)

- Eight new service routes added (strategy, UI/UX, performance, website audit, SEO copywriting, analytics/tracking, migration, branding)
- Services hub grouped; nav/footer remain curated
- Related Work on new pages hidden until verified portfolio linkage exists
- Free Website Review remains distinct from Website Audit

## Platforms expansion (2026)

- Six new platform routes: WooCommerce, Webflow, Wix Studio, Squarespace, Framer, HubSpot CMS
- Hub grouped into Core Website / E-commerce / Connected
- `verifiedExperience` true only for WordPress until other platforms have portfolio proof
- No vendor partnership claims

## Solutions hub (2026) — READY

- **SOLUTIONS SYSTEM COMPLETE** — 10 public routes (hub + 9 detail pages)
- Published detail pages (**ORIGINAL SOLUTIONS SET COMPLETE — 9/9**):
  - `/solutions/website-not-generating-leads`
  - `/solutions/website-not-ranking`
  - `/solutions/slow-website`
  - `/solutions/outdated-website`
  - `/solutions/low-website-conversions`
  - `/solutions/website-migration`
  - `/solutions/new-business-website`
  - `/solutions/ecommerce-growth`
  - `/solutions/local-business-visibility`
- No remaining unpublished items in the original Solutions set
- Detail route uses `[slug]` + `getPublishedSolutions()`; unknown/unpublished slugs 404
- Hub discovery uses published-only category filtering
- Sitemap includes hub + all nine published solution URLs
- Cross-links between published solutions only (`RelatedSolutions` filters unpublished); max 2–3 per page
- Services That May Help capped at 5 prioritized capabilities per page
- Navigation + footer link to hub; homepage and services cross-links added
- New Business Website uses contact + Explore Website Services CTAs; secondary Plan Your Website Project → `/project-planner` enabled
- E-commerce Growth has no verified published e-commerce portfolio proof — Related Work hidden until available
- Local Business Visibility: problem-first local discovery (not a clone of Local SEO service); anti-doorway/thin location pages; accurate profiles only; ethical reviews; no ranking guarantees; industries link to `/industries` only
- Final QA polish (Prompt 11): service prioritization, hub published filter, migration featured on hub, CTA/context differentiation preserved, no fabricated claims

## Website Project Planner (2026)

**Status: ready for launch** (lint, TypeScript, build, and 11/11 deterministic scenarios verified).

- Live at `/project-planner` — self-canonical, indexable, sitemap once
- Schema: WebPage + BreadcrumbList only
- 8 base questions + 1 conditional; paths Improve/Redesign/Build/Migrate/Grow/Diagnose First
- Deterministic engine + documented scenarios in `lib/project-planner-scenarios.ts`
- Persistence: `smartlance.planner.website-project` v1; answers never leave the browser
- Analytics: start/complete/restart only — no answer payloads
- Pricing hero secondary CTA → Plan Your Project; Project Brief remains on Pricing
- Cost Calculator remains intentionally unpublished
- Not a Resource format (taxonomy stays 7/7)

## Resources hub (2026) — RESOURCE FORMAT SYSTEM COMPLETE — 7/7 LIVE

**Status: ready for launch** (routes, metadata, sitemap, privacy, interactive state, print, and build verified in Prompt 19 QA).

### Inventory (from data — do not hardcode in UI)

| Format | Archive | Public items |
| --- | --- | ---: |
| Insights | `/blog` | 59 posts |
| Guides | `/guides` | 1 |
| Comparisons | `/compare` | 1 |
| Checklists | `/checklists` | 1 |
| Glossary | `/glossary` | 12 |
| Templates | `/templates` | 1 |
| Tools | `/tools` | 1 |

### Interactivity & privacy

| Format | Client behavior | Storage key | Remote save |
| --- | --- | --- | --- |
| Checklist | checkboxes + print | `smartlance.checklist.*` | Never |
| Template | form + copy + print | `smartlance.template.*` | Never |
| Tool | selector + copy | `smartlance.tool.*` | Never |
| Glossary search | client filter over search index only | None | N/A |

Template conditional answers may remain in localStorage when hidden, but summary/copy exclude non-visible fields.

Tool answers are never POSTed, never placed in URLs, and never included in analytics payloads. Optional anonymous `tool_start` / `tool_complete` events carry no answer data.

### Content rules (preserve)

- No fabricated proof, fake resource popularity, or universal platform winners
- No affiliate / sponsored recommendation language
- No universal conversion benchmarks or hardcoded CWV thresholds without central sourcing
- No FID as a current Core Web Vital (LCP / INP / CLS)
- No thin pages published only to fill an archive
- Blog URLs remain `/blog` and `/blog/[slug]` (Insights label in Resources nav)
- **Public numeric pricing intentionally not published** on `/pricing` — not a launch blocker

### Navigation

- Header Resources: Learn / Decide / Reference / Tools
- Footer Resources: two-column link list for density
- Hub: Guide-led featured mix + restrained Platform Selector callout
- Top-level **Pricing** in header; Company footer includes Pricing

## Pricing page (2026)

- Live at `/pricing` — scope and engagement guidance without invented prices
- Data: `data/pricing.ts` with `showPublicPricing: false`
- Sitemap includes `/pricing` once; self-canonical; indexable
- Schema: WebPage + BreadcrumbList + FAQPage (no Offer/Product prices)
- Hero secondary CTA: Plan Your Project → `/project-planner`; Project Brief Template linked later on page
- Contextual links from Services, Contact, Project Brief Template, Platform Selector results
- Cost Calculator remains intentionally unpublished

## SEO

- Canonicals for articles at `/blog/[slug]`, Guides, Comparisons, Checklists, Glossary terms, Templates, and Tools at their self-canonical paths
- Sitemap includes published posts, services, platforms, SEO pages, work, `/solutions`, `/resources`, `/guides`, `/compare`, `/checklists`, `/glossary`, `/templates`, `/tools`, `/pricing`, `/project-planner`, and published detail URLs
- Legacy blog URLs have defined 308 destinations — **no accidental 404 plan**
- See `URL_MIGRATION_MAP.md`, `CONTENT_AUDIT.md`, `BLOG_MIGRATION_REPORT.md`

## Analytics

- Wire IDs when ready (GTM preferred)
- Privacy + commercial conversion events: see Commercial journey section / `COMMERCIAL_JOURNEY.md`

## Assets

- 52/56 blog heroes downloaded; 4 missing documented
- Project covers present
- Final OG PNG still missing

## Deployment

- Keep WordPress live until DNS cutover after verifying redirects in production
- Do not delete WordPress content/media yet

## Security

- No secrets committed; form delivery server-only

## Remaining Manual Tasks

1. Confirm production `NEXT_PUBLIC_SITE_URL`
2. **LAUNCH BLOCKER:** Configure form delivery (Resend/webhook) and test both forms
3. Add analytics IDs (optional at launch)
4. Export final OG PNG 1200×630
5. Optional: recover 4 missing blog hero images; confirm Facebook URL
6. After go-live: submit sitemap in Google Search Console; monitor coverage

## Final Status

**READY TO LAUNCH** (code / content / SEO) — with one **commercial delivery** exception

Code-level and content-migration launch blockers are resolved, including legacy blog URL preservation via permanent redirects to migrated articles.

**Commercial launch blocker:** configure production form delivery (Resend or webhook) and test both Contact and Free Review before treating lead capture as live. See `COMMERCIAL_JOURNEY.md`.

Other remaining items are **credentials and assets you must provide** (analytics IDs, final OG image) plus optional polish — not accidental content/SEO gaps.
