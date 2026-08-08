# Project Structure

```text
app/                         # Next.js App Router pages & API routes
  api/contact/               # Contact form endpoint
  api/website-review/        # Free review endpoint
  services/                  # Services hub + individual service pages
  seo/                       # SEO hub + SEO service pages
  work/                      # Portfolio listing + case studies
  blog/                      # Blog index + article pages
  guides/                    # Guides archive + Guide detail pages
  compare/                   # Comparisons archive + Comparison detail pages
  checklists/                # Checklists archive + Checklist detail pages
  glossary/                  # Glossary archive + Glossary term pages
  templates/                 # Templates archive + Template detail pages
  tools/                     # Tools archive + Tool detail pages
  resources/                 # Resources knowledge hub
  about/ contact/ industries/ solutions/ free-website-review/
  sitemap.ts robots.ts not-found.tsx
  layout.tsx globals.css page.tsx

components/
  home/                      # Homepage sections
  layout/                    # Header, footer, analytics scripts
  services/                  # Service page template + trackers
  seo/                       # SEO page template
  work/                      # Portfolio filters + trackers
  blog/                      # Markdown renderer + CTAs
  guides/                    # Guide hero, body, visuals
  comparisons/               # Comparison hero, tables, decision UI
  checklists/                # Checklist cards + interactive checklist
  glossary/                  # Glossary archive search + term visuals
  templates/                 # Template worksheets (project brief form)
  tools/                     # Interactive tools (platform selector)
  project-planner/           # Website Project Planner UI
  pricing/                   # Pricing page sections
  resources/                 # Resources hub sections
  forms/                     # Contact + website review forms
  ui/                        # Design-system primitives (Container — see LAYOUT.md)

content/blog/                # Markdown articles
data/                        # Typed content (nav, services, portfolio, resources, guides, comparisons, glossary, templates…)
lib/                         # Site config, SEO, analytics, blog, forms, utils
  ai/content-assistants/     # Specialized CMS AI proposals (Service→Homepage; 13 modules + shared)
  ops/content-quality-audit.ts # Published content quality audit (read-only)
types/                       # Shared TypeScript types
public/images public/og      # Static assets
proxy.ts                     # Redirect architecture (Next.js proxy)
```

## Architecture decisions

- **Server Components by default** — client components only for navigation interactivity, forms, FAQ accordion, filters and analytics beacons.
- **Content outside pages** — business copy and structured content live in `data/` and `content/` so pages stay thin.
- **Reusable templates** — `ServicePageTemplate` and `SeoPageTemplate` avoid duplicated service/SEO layouts.
- **Single site URL** — `NEXT_PUBLIC_SITE_URL` drives canonicals, sitemap, robots and JSON-LD.
- **Form delivery abstraction** — webhook and/or Resend email via env vars; local logging fallback when unset.
- **Analytics abstraction** — no hardcoded credentials; events push to dataLayer / gtag / Clarity when configured.
- **No fabricated proof** — stats, testimonials and case-study results are placeholders until real data is supplied.
- **AI CMS proposals** — 13 specialized assistants propose fields; humans accept into normal draft/revision (Homepage via `draftJson`). See `docs/AI_CONTENT_ASSISTANTS_FINAL_ARCHITECTURE.md`.

## Design system

Tokens live in `app/globals.css` (`:root` + `@theme inline`):

- Primary ink navy, teal accent, soft surfaces
- Display font: Syne
- Layout widths: see **LAYOUT.md** (shell 1280 · reading 760 · narrow 660 · interactive 820; gutters 20/24/32)
- Body font: Figtree
- Shared UI: Button, Container, Section, SectionHeader, cards, FAQ, Breadcrumbs, CTASection

## Routing map

| Path | Purpose |
| --- | --- |
| `/` | Homepage |
| `/services` | Services hub (grouped: Websites, SEO & Growth, Conversion, Support) |
| `/services/*` | Individual website/conversion services (16 total) |
| `/seo` | SEO hub |
| `/seo/*` | SEO specialisms |
| `/work` `/work/[slug]` | Portfolio |
| `/blog` `/blog/[slug]` | Editorial content (Insights) |
| `/resources` | Resources knowledge hub |
| `/guides` | Guides archive (published Guides only) |
| `/guides/[slug]` | Published Guide detail pages |
| `/compare` | Comparisons archive (published Comparisons only) |
| `/compare/[slug]` | Published Comparison detail pages |
| `/checklists` | Checklists archive (published Checklists only) |
| `/checklists/[slug]` | Published Checklist detail pages |
| `/glossary` | Glossary archive (published terms only) |
| `/glossary/[slug]` | Published Glossary term pages |
| `/templates` | Templates archive (published Templates only) |
| `/templates/[slug]` | Published Template detail pages |
| `/tools` | Tools archive (published Tools only) |
| `/tools/[slug]` | Published Tool detail pages |
| `/pricing` | Project scope & investment guidance (no fabricated public prices) |
| `/project-planner` | Guided Website Project Planner (diagnostic; not a Resource type) |
| `/industries` | Industry overview (no thin landing pages) |
| `/solutions` | Problem-first Solutions hub |
| `/solutions/[slug]` | Published solution detail pages only |
| `/about` `/contact` `/free-website-review` | Company + lead gen |

### Solutions content architecture (2026)

- Data: `data/solutions.ts` + `Solution` type in `types/index.ts`
- Detail narrative: `data/solution-pages.ts` (required before a slug can render)
- Route: `app/solutions/[slug]/page.tsx` — `generateStaticParams` from `getPublishedSolutions()`; unpublished → `notFound()`
- Hub only links a solution when `published: true`
- Categories: Growth & Conversion, Visibility, Website Quality, Change & New Projects
- Sitemap: `/solutions` + each published solution slug only
- Nav: top-level Solutions; footer company link to hub only
- Cross-links: homepage problem section + services hub “Start with the problem”

#### Published solution pages

| Slug | URL | Status |
| --- | --- | --- |
| `website-not-generating-leads` | `/solutions/website-not-generating-leads` | **Published** |
| `website-not-ranking` | `/solutions/website-not-ranking` | **Published** |
| `slow-website` | `/solutions/slow-website` | **Published** |
| `outdated-website` | `/solutions/outdated-website` | **Published** |
| `low-website-conversions` | `/solutions/low-website-conversions` | **Published** |
| `website-migration` | `/solutions/website-migration` | **Published** |
| `new-business-website` | `/solutions/new-business-website` | **Published** |
| `ecommerce-growth` | `/solutions/ecommerce-growth` | **Published** |
| `local-business-visibility` | `/solutions/local-business-visibility` | **Published** |

**ORIGINAL SOLUTIONS SET COMPLETE — 9/9 PUBLISHED**

Public routes: **10 total** (1 hub + 9 detail pages).

Published pages use solution-specific layouts with shared primitives in `solution-primitives.tsx`.

#### Shared components
`SolutionHero`, `ProblemContrast`, `DiagnosticFramework`, `NumberedCauseList`, `SymptomList`, `DecisionSection`, `RecommendedServices` (capped at 5), `RelatedWork`, `RelatedInsights`, `SolutionFaq`, `SolutionFinalCta`, `RelatedSolutions`, `SolutionBackLink`, hub sections in `solutions-sections.tsx`.

#### Page-specific layouts
Leads uses `solution-page-template.tsx`; Ranking, Performance, Outdated, Conversions, Migration, New Business, Ecommerce, Local Visibility each have dedicated page components.

#### Internal-link strategy
- Hub ↔ Services mutual contextual links
- Homepage restrained problem → `/solutions`
- Nav/footer: Solutions hub only (not all nine detail routes)
- Each detail page: max 2–3 related Solutions; max 5 Services That May Help
- Related Work / Insights hide when empty (ecommerce Related Work intentionally empty)

#### Anti-fabrication / quality rules
No fake metrics, rankings, reviews, or case-study outcomes. No thin/doorway location pages. No migration zero-risk promises. No dark-pattern CRO guidance. Ecommerce proof gap preserved honestly.

Low Website Conversions focuses on journey/action friction (broader than enquiries). Cross-links to `ecommerce-growth` when the journey is specifically an online store.

Planning a Website Migration focuses on transition planning and risk protection (not a clone of `/services/website-migration`). Featured in Change & New Projects on the hub.

New Business Website CTAs: Tell Us About Your Project + Explore Website Services; secondary **Plan Your Website Project** → `/project-planner` (enabled). Avoids over-promoting Free Website Review for visitors without a site.

E-commerce Growth: commerce system story; Shopify / WooCommerce / BigCommerce; Related Work hidden until verified store projects exist.

Local Business Visibility: local discovery + profile ↔ website; links to `/industries` (no industry-detail anchors); anti-doorway / fake-location / review-manipulation rules.

### Resources hub (2026)

- Hub: `/resources`
- Data: `data/resources.ts` + `data/resource-content-types.ts` + `data/guides.ts` + `data/comparisons.ts` + `data/checklists.ts` + `data/glossary.ts` + `data/glossary/entries.ts` + `data/templates.ts` + `data/templates/*` + `data/tools.ts` + `data/tools/*` + `lib/platform-selector.ts`
- Insights = Blog articles adapted via `insightFromBlogPost()` — **no duplicated article metadata**; `/blog` URLs unchanged
- **RESOURCE FORMAT SYSTEM COMPLETE — 7/7 LIVE:** Insights, Guides, Comparisons, Checklists, Glossary, Templates, Tools
- Inventory (calculate dynamically in UI where shown): Insights = blog posts; Guide 1; Comparison 1; Checklist 1; Glossary 12; Template 1; Tool 1
- Format roles: Insight = articles; Guide = deep reference; Comparison = trade-offs; Checklist = verification; Glossary = definitions; Template = fillable brief; Tool = interactive shortlist
- Topics (separate from type): Website Design, Website Development, SEO, Conversion, E-commerce, Website Performance, Platforms, Digital Marketing, Hospitality & Vacation Rentals
- Hub featured mix: Guide lead + Comparison + supporting Insight; restrained Platform Selector callout; other formats via type nav
- Labels: INSIGHT / GUIDE / COMPARISON / CHECKLIST / GLOSSARY / TEMPLATE / TOOL
- Local interactivity namespaces: `smartlance.checklist.*`, `smartlance.template.*`, `smartlance.tool.*`, `smartlance.planner.*` (no remote autosave; no answer analytics)
- Template: hidden conditional fields stay in storage but are excluded from summary/copy via visibility filter
- Sitemap: `/resources`, `/guides`, `/compare`, `/checklists`, `/glossary`, `/templates`, `/tools`, published detail slugs
- Nav: Resources grouped Learn / Decide / Reference / Tools; footer Resources uses a two-column link list

#### First Guide (published)

| Slug | URL | Status |
| --- | --- | --- |
| `website-redesign-guide` | `/guides/website-redesign-guide` | **Published** |

- Topics: Website Design, Website Development, SEO, Conversion, Website Performance, Platforms
- Related Solutions: outdated-website, website-migration
- Related Services: website-redesign, website-strategy, website-migration, website-audit
- Related Insights: website-redesign-checklist, what-makes-a-website-convert, technical-seo-foundations
- Layout: editorial TOC + sticky sidebar; Related Guides hidden until a second Guide exists
- Components: `components/guides/*`

#### First Comparison (published)

| Slug | URL | Status |
| --- | --- | --- |
| `wordpress-vs-webflow` | `/compare/wordpress-vs-webflow` | **Published** |

- Neutral decision content — no universal winner, scores, fake prices, or partnership claims
- Topics: Platforms, Website Development, Website Design, SEO, Website Performance
- Related platforms: wordpress, webflow
- Related Guide: website-redesign-guide
- Components: `components/comparisons/*`
- **Content maintenance:** platform comparisons may need periodic review as features/plans/integrations change

#### First Checklist (published)

| Slug | URL | Status |
| --- | --- | --- |
| `website-redesign-checklist` | `/checklists/website-redesign-checklist` | **Published** |

- Verification companion to `/guides/website-redesign-guide` — scannable items, not Guide prose
- Interactive checkboxes + localStorage progress (`smartlance.checklist.website-redesign-checklist`); browser print CSS
- Topics: Website Design, Website Development, SEO, Conversion, Website Performance
- Components: `components/checklists/*`
- **Content maintenance:** review when the Redesign Guide is materially updated

#### Glossary (published — first batch)

| Slug | URL | Status |
| --- | --- | --- |
| (archive) | `/glossary` | **Published** |
| `seo` | `/glossary/seo` | **Published** |
| `cms` | `/glossary/cms` | **Published** |
| `cta` | `/glossary/cta` | **Published** |
| `conversion-rate` | `/glossary/conversion-rate` | **Published** |
| `core-web-vitals` | `/glossary/core-web-vitals` | **Published** |
| `lcp` | `/glossary/lcp` | **Published** |
| `inp` | `/glossary/inp` | **Published** |
| `cls` | `/glossary/cls` | **Published** |
| `canonical-url` | `/glossary/canonical-url` | **Published** |
| `301-redirect` | `/glossary/301-redirect` | **Published** |
| `xml-sitemap` | `/glossary/xml-sitemap` | **Published** |
| `structured-data` | `/glossary/structured-data` | **Published** |

- Reference format: definition-led, evergreen; not Guides, not blog posts
- Archive: client-side search (term / acronym / aliases / short definition), alphabetical index (letters with terms only; `#` for numeric), topic groups (Website Foundations, Search & Technical SEO, Performance)
- Topic groups are archive filters only — no separate topic routes
- Aliases improve search only — no duplicate indexable routes (e.g. “schema markup” → Structured Data; “sitemap” → XML Sitemap)
- Schema: `DefinedTerm` + `BreadcrumbList` (no mechanical FAQ schema)
- Internal linking: selective first-use Glossary links in long resources; max ~one link per term per long page
- Depth: useful enough to justify an indexable URL; length matches the term (not thin stubs, not 2k-word articles)
- **Content maintenance:** Core Web Vitals / LCP / INP / CLS / Structured Data / SEO terminology may need more frequent review; CTA / CMS tend to be more stable
- Do **not** publish additional Glossary terms unless intentionally commissioned; future ideas stay off-route

#### Templates (published — first batch)

| Slug | URL | Status |
| --- | --- | --- |
| (archive) | `/templates` | **Published** |
| `website-project-brief-template` | `/templates/website-project-brief-template` | **Published** |

- Fillable worksheet: captures project requirements (not a Checklist “have we checked X?” pattern)
- Field schema: text / textarea / select / radio / checkboxGroup (+ url/date where useful)
- Local persistence key: `smartlance.template.website-project-brief-template` (browser only; no account; no network autosave)
- Privacy: answers stay local unless the user copies, prints, or pastes into contact themselves
- Utilities: Copy Brief (plain text), Print Brief, Print Blank Template, Clear Template (confirm)
- Conditional fields: e-commerce (when project type or sell-products goal), SEO detail (when search is yes/not sure), URL preservation (redesign/rebuild/migration)
- Schema: WebPage + BreadcrumbList (no HowTo / SoftwareApplication / fake download Product)
- Do **not** publish additional Templates unless commissioned; future ideas stay off-route

#### Tools (published — first batch)

| Slug | URL | Status |
| --- | --- | --- |
| (archive) | `/tools` | **Published** |
| `website-platform-selector` | `/tools/website-platform-selector` | **Published** |

- Interactive decision aid: shortlists platforms from requirements (not a quiz, affiliate funnel, or guaranteed winner)
- Candidates: WordPress, Webflow, Shopify, WooCommerce, BigCommerce, Wix Studio, Squarespace, Framer, HubSpot CMS (not Salesforce/Clixlo in default selector)
- 10 base questions + 1 conditional HubSpot question; deterministic weighted scoring; **no visible percentages**
- Behaviors: ties (“two platforms deserve a closer look”), low-confidence → Project Brief Template, complex backend → custom/hybrid caution, commerce=none filters pure commerce platforms from top results
- Persistence: `smartlance.tool.website-platform-selector` versioned local state; answers never POSTed, never in URL, never in analytics payloads
- Engine: `lib/platform-selector.ts`; scenarios: `lib/platform-selector-scenarios.ts`
- Schema: WebPage + BreadcrumbList
- Do **not** publish additional Tools unless commissioned
- **RESOURCE FORMAT SYSTEM COMPLETE — 7/7 LIVE** (format architecture complete; content library continues to grow)

### Commercial journey (2026)

- Documented in [`COMMERCIAL_JOURNEY.md`](./COMMERCIAL_JOURNEY.md) (principle, readiness levels, journey map, CTA matrix, forms, analytics privacy)
- Global CTA primary: **Tell Us About Your Project** → `/contact` (`siteConfig.cta.primary`)
- Global CTA secondary: **Get a Free Website Review** → `/free-website-review` (`siteConfig.cta.secondary`)
- Forms: `POST /api/contact` + `POST /api/website-review` → `lib/enquiries/service.ts` (PostgreSQL persist) + `lib/forms.ts` notification (Resend and/or webhooks; honeypot `_gotcha`; rate limit 8/hour/hashed-IP/route). Admin: `/admin/enquiries`. See `ENQUIRY_OPERATIONS.md`.
- AI Editorial Studio: `/admin/ai-writer` → Insight DRAFT handoff (never auto-publish). See `AI_EDITORIAL_ARCHITECTURE.md`, `AI_EDITORIAL_OPERATIONS.md`, `AI_EDITORIAL_PRIVACY.md`.
- Cost Calculator, chatbot, Calendly, newsletter, sticky bar, and unverified WhatsApp deliberately not added

### Pricing & project scope (2026)

- Route: `/pricing` only — no pricing child routes, packages, or cost calculator
- Data: `data/pricing.ts` (`showPublicPricing: false`)
- Philosophy: website pricing is scope pricing; understand deliverables before work begins
- Content: 10 scope factors · Improve/Redesign/Build/Grow engagement paths · 4 scope examples · scope matrix · 6-step scoping process · 9 FAQs
- **No fabricated** public amounts, starting-at prices, retainers, payment percentages, or universal timelines
- Third-party costs (hosting, platforms, apps, etc.) clarified as often separate; details in proposal
- Hero secondary CTA: **Plan Your Project** → `/project-planner` (Project Brief remains linked later on Pricing)
- Strong Resource links: Project Planner, Project Brief Template, Platform Selector, Redesign Guide
- Schema: WebPage + BreadcrumbList + FAQPage — **no** Product/Offer/AggregateOffer price schema
- Nav: top-level Pricing; footer Company column
- Cost Calculator remains intentionally unpublished
- Future: verified `startingFrom` fields only when approved

### Website Project Planner (2026)

- Route: `/project-planner` only — no child routes (`/results`, `/start`, `[slug]`)
- Purpose: answer “What type of website project should I be planning?” — diagnostic, decision-oriented, useful without contacting Smartlance
- **Not** a Resource type (keeps taxonomy at 7 formats); **not** Project Brief, Platform Selector, price calculator, chatbot, or audit scanner
- Philosophy: define the project before choosing the solution
- Data: `data/project-planner.ts` · Engine: `lib/project-planner.ts` · Scenarios: `lib/project-planner-scenarios.ts` · UI: `components/project-planner/*`
- Questions: 8 base + 1 conditional multi-problem follow-up; one question per step; no budget/timeline/PII questions
- Paths: Improve · Redesign · Build · Migrate · Grow · Diagnose First (planning directions, not packages)
- Deterministic `evaluateProjectPlan(answers)` — weighted signals internal only; no scores/percentages/AI
- Guardrails: no-site → never Free Review primary; confirmed platform change → Migration; high uncertainty → Diagnose First; commerce gated; conflicting scope surfaced honestly
- Persistence: `smartlance.planner.website-project` version `1`; memory fallback if localStorage unavailable; invalid schema resets gracefully
- Privacy: answers stay in-browser; never POSTed, never in URL, never in analytics payloads; anonymous events only (`project_planner_start|complete|restart`)
- Results: path + why + priorities + solutions/services/resources + pricing link + contact handoff; Copy My Project Path plain text (no scores)
- Schema: WebPage + BreadcrumbList
- Integrations: Pricing hero secondary; New Business Solution secondary CTA; Services/Solutions/Contact helpers; Resources Browse-by-Goal link; footer Company
- Cost Calculator remains unpublished
### Website service catalogue (2026 expansion)

Existing (preserved URLs):
- Website Design, Development, Redesign, E-commerce, Landing Pages, CRO, Maintenance, Digital Marketing

Added:
- `/services/website-strategy`
- `/services/ui-ux-design`
- `/services/website-performance-optimization`
- `/services/website-audit`
- `/services/seo-copywriting`
- `/services/analytics-conversion-tracking`
- `/services/website-migration`
- `/services/branding`

Service `group` field: `websites` | `seo-growth` | `conversion-measurement` | `support`.
Navigation stays curated; full catalogue on `/services`.
New services ship without fabricated related-work proof unless portfolio data supports it.

### Platform catalogue (2026 expansion)

Existing (preserved URLs):
- WordPress, Shopify, BigCommerce, Salesforce, Clixlo

Added:
- `/platforms/woocommerce`
- `/platforms/webflow`
- `/platforms/wix-studio`
- `/platforms/squarespace`
- `/platforms/framer`
- `/platforms/hubspot-cms`

Platform `group`: `websites` | `ecommerce` | `connected`.
`verifiedExperience: true` only for WordPress today (portfolio match).
Hub groups platforms; nav/footer stay curated.
