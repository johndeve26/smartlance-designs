# SEO Operations

Admin SEO control center: `/admin/seo`  
Link health: `/admin/link-health`  
Content quality: `/admin/content-audit`

## Workflow: publish a page

1. Publish in Admin (Service, Solution, Platform, Insight, Resource, Work, …)
2. Verify SEO fields: title, description, canonical override (if needed), OG image, noindex
3. Confirm indexability in `/admin/seo` inventory
4. Sitemap regenerates via Next.js (`revalidatePath('/sitemap.xml')` on publish hooks)
5. Optional IndexNow (if `INDEXNOW_ENABLED=true` + `INDEXNOW_KEY`): submit canonical URL after meaningful publish/update
6. Run link-health after navigation or slug changes

## Baseline audit

```bash
npx tsx scripts/run-seo-baseline-audit.ts
```

Writes `docs/audit-artifacts/seo-baseline-audit.json`.

## Inventory

`buildSeoInventory()` — `/admin/seo`  
`buildSeoUrlInventory()` — baseline script + `lib/seo/inventory.ts`

Issue severities: error / warning / info (no master score).

## Indexation policy

See `docs/SEO_INDEXABILITY_MATRIX.md`.

## Structured data

See `docs/STRUCTURED_DATA_ARCHITECTURE.md`.

## AI search

See `docs/AI_SEARCH_DISCOVERABILITY.md`.

## Search engine verification

Environment variables (never commit tokens):

| Variable | Purpose |
|---|---|
| `GOOGLE_SITE_VERIFICATION` | Google Search Console HTML verification |
| `BING_SITE_VERIFICATION` | Bing Webmaster `msvalidate.01` |

## IndexNow (optional)

| Variable | Purpose |
|---|---|
| `INDEXNOW_ENABLED` | Set `true` to enable submissions |
| `INDEXNOW_KEY` | Verification key |
| Key URL | `{origin}/indexnow-key.txt` |

Do not submit Admin draft saves — publish events only.

## Production launch

See **`docs/SEO_PRODUCTION_LAUNCH_CHECKLIST.md`** for Search Console, Bing, Cloudflare, and IndexNow manual steps.

Run after deploy:

```bash
SITE_URL=https://smartlancedesigns.com npx tsx scripts/run-seo-production-verification.ts
```

When Search Console / Bing are connected:

- Index coverage, queries, pages, CTR, CWV
- Referral sources including ChatGPT where visible
- Conversions: contact, free review, project planner

No fabricated rankings or traffic.

## SEO finding → assistant routing

| Finding type | Route to |
|---|---|
| Service title/meta/body | Service AI |
| Platform factual SEO | Platform AI |
| Industry thin/specificity | Industry AI |
| Guide freshness | Guide AI |
| Comparison outdated facts | Comparison AI |

## Related docs

- `docs/TECHNICAL_SEO_AUDIT.md`
- `docs/ON_PAGE_SEO_AUDIT.md`
- `docs/SEO_IMPLEMENTATION_PLAN.md`
- `docs/SEO_INTERNAL_LINKING_ARCHITECTURE.md`
