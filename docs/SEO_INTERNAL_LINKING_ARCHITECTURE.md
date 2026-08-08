# SEO Internal Linking Architecture

## Intended journey

```
Problem → Solution → Service → Proof → Resource → Planning → Contact
```

Not every page must traverse all stages. Links should be contextual.

## Commercial relationships (verified in code)

| From | To | Mechanism |
|---|---|---|
| Solution | Service | `relatedServiceHrefs`, `relatedServiceReasons` |
| Service | Service / SEO / Platform | `relatedServiceSlugs`, `relatedSeoSlugs`, `relatedPlatformSlugs` |
| Platform | Service | `relatedServiceHrefs` |
| Industry (hub) | Services / Work | industries hub sections |
| Work | Service / Industry / Platform | case study relations |
| Insight / Guide | Service / Solution | `relatedServiceHrefs`, `relatedSolutionSlugs` |
| Comparison | Platform | comparison content |
| Glossary | Resources | glossary cross-links |
| Global nav / footer | All hubs | `navigationRepository` |

## Link health operations

- Admin: `/admin/link-health`
- Logic: `lib/ops/link-health.ts`
- Checks: nav/footer broken & redirecting links, orphan important routes, industry→work integrity
- Does **not** full-body crawl or external link audit

## Audit findings (baseline)

| Severity | Finding |
|---|---|
| HIGH | Industry CMS records reference `/industries/[slug]` but public detail routes are missing — internal links to industry slugs may 404 or redirect to hub |
| NORMAL | Some legacy WordPress paths redirect via `proxy.ts` — internal links should prefer final canonical URLs |
| NORMAL | Generic anchors (“Learn more”) remain in some templates — improve during content passes |

## Anchor text guidance

- Prefer descriptive phrases: “Website redesign services”, “WordPress website development”
- Avoid exact-match over-optimization
- Replace “click here” where a descriptive phrase fits editorially

## Orphan policy

Important commercial pages should appear in:

1. Primary navigation or footer
2. At least one hub page
3. Contextual body links from related content

Orphans flagged by link-health runs require human review — not automatic noindex.
