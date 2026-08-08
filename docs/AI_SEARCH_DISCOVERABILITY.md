# AI Search Discoverability

## Principle

Google states normal SEO fundamentals apply to AI Search features (AI Overviews, AI Mode). There is **no** separate “AI Overview schema” or ranking guarantee.

Smartlance focuses on being **understandable, crawlable, and citable** — not gimmick markup.

Sources consulted (2026-08):

- Google Search Central — Search Essentials, structured data, JavaScript SEO
- OpenAI publisher / OAI-SearchBot guidance

## What we do

| Area | Implementation |
|---|---|
| Crawlability | Server-rendered public HTML; real `<a href>` navigation |
| Indexation controls | Accurate robots meta + sitemap + CMS `noIndex` |
| Entity clarity | Explicit naming (Smartlance Designs, platforms, services) |
| Structured data | Valid JSON-LD matching visible content |
| OAI-SearchBot | Allowed on public paths; `/admin/` and `/api/` disallowed in `app/robots.ts` |
| Answer-first sections | Editorial pattern on Services/Solutions/Glossary — human-reviewed |
| First-party evidence | Work, testimonials where verified — never fabricated metrics |

## What we deliberately do NOT do

- `llms.txt` for Google ranking (not a Search Essentials requirement)
- Fake AI/GEO/LLM schema types
- Mass AI-generated doorway pages
- Claimed AI citation scores or guaranteed ChatGPT inclusion
- Blocking OAI-SearchBot site-wide

## Measurement (when available)

- Google Search Console organic performance
- Referral traffic from ChatGPT / Bing chat where analytics exposes it
- Qualified enquiries, Project Planner completions, Free Review submissions

No fabricated AI ranking metrics.

## Content routing for improvements

SEO findings route to existing assistants — not a generic SEO writer:

- Service metadata → Service AI
- Platform factual SEO → Platform AI
- Industry specificity → Industry AI
- Comparison freshness → Comparison AI
