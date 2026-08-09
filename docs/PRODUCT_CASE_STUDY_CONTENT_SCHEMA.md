# Product case study content schema

Versioned JSON stored in `WorkProject.caseStudyContent`.

## First-class columns

| Field | Purpose |
| --- | --- |
| `caseStudyKind` | `WEBSITE` or `PRODUCT` — controls renderer + admin UI |
| `heroEyebrow` | Product/website hero eyebrow |
| `heroSupportingCopy` | Hero supporting copy |
| `externalLinkLabel` | Live site CTA label |

## JSON (`caseStudyContent`)

Schema: `CaseStudyContentV1Schema` in `lib/work/case-study-content.ts`

```json
{
  "version": 1,
  "introHeading": "...",
  "sectionHeadings": { "engineering": "...", "principles": "..." },
  "solutionIntro": "...",
  "serviceLinks": [{ "id": "...", "label": "...", "description": "..." }],
  "engineeringIntro": "...",
  "engineeringStacks": [{ "id": "...", "category": "...", "items": ["..."] }],
  "productPrinciples": [{ "id": "...", "title": "...", "description": "..." }],
  "productFeatures": [{ "id": "...", "title": "...", "heading": "...", "body": "..." }],
  "saasInfrastructure": [{ "id": "...", "category": "...", "items": ["..."] }],
  "showArchitectureDiagram": true,
  "caseStudyCta": { "title": "...", "description": "..." },
  "gallery": [{ "id": "...", "src": "...", "alt": "..." }]
}
```

## Validation

- All JSON from Prisma is parsed with Zod — never cast blindly.
- External URLs must be `http(s)` or site-relative paths.
- Stable `id` values on list items are preserved on import and expected in Admin JSON array editors.

## Renderer

`resolveCaseStudyContent()` + `caseStudyKind === "product"` drives product sections. Legacy inference from `productFeatures` in narrative files is fallback-only.

## Import

```bash
npx tsx scripts/import-work-case-study-content.ts --dry-run
npx tsx scripts/import-work-case-study-content.ts
npx tsx scripts/import-work-case-study-content.ts --force
```

**Backup production before running without `--dry-run`.**

Primary targets: `padeya`, `freelance-os`.

Marker: `phase3-work-case-study`
