# Content Migration (Phase 2)

## What moved to the database

| Family | Count | Seed source | Runtime |
| --- | --- | --- | --- |
| Services | 16 | `data/services.ts` (+ `additional-services`) | `servicesRepository` |
| Solutions | 9 | `data/solutions.ts` + `data/solution-pages.ts` | `solutionsRepository` (`pageKind` + `pageContent`) |
| Platforms | 11 | `data/platforms.ts` (+ `additional-platforms`) | `platformsRepository` |
| Homepage | 1 | hero hardcodes + `data/home.ts` | `homepageRepository` |

Typed source files are retained with `@migration-reference` comments. **Do not delete them**; they are the deterministic seed input and offline reference. After seed, public detail pages and sitemap for these families read the database. Hubs/home may briefly fall back to typed catalogues only when the DB returns an empty set (e.g. pre-seed production build).

## Seed

```bash
# After migrate + DATABASE_URL
npm run db:seed
```

`scripts/seed-from-typed-data.ts` upserts by slug (and singleton ids `home` / `site`). Re-running is safe and overwrites catalogue fields from typed data.

## Routing change

Static `app/services/<slug>/page.tsx` files were replaced by `app/services/[slug]/page.tsx`. Public URLs are unchanged.

## Field mapping notes

- Service/Platform `metaTitle` / `metaDescription` → DB `seoTitle` / `seoDescription` → public mapper restores `metaTitle` / `metaDescription`
- Solution narrative pages: store full kind-tagged blob in `pageContent`; `pageKind` mirrors `kind`
- Homepage `sections` JSON holds copy blocks; layout remains in React components
- Relation fields stay as slug/href arrays matching the public architecture

## Not migrated (later phases)

Pricing, Planner/Selector engine CMS, Media upload library, Nav/Footer managers, Redirect manager UI, Enquiries, Legal CMS, full Site Settings panel.

## Phase 3 families

| Family | Count | Source | Runtime |
| --- | --- | --- | --- |
| Industries | 20 | `data/industries.ts` | `industriesRepository` |
| Work | 8 | `data/portfolio.ts` | `workRepository` |
| Testimonials | 7 verified | `data/testimonials.ts` | `testimonialsRepository` |
| Insights | 59 | `content/blog/*.md` | `insightsRepository` |
| Guides | 1 | `data/guides/` | `CmsResource` (`guide`) |
| Comparisons | 1 | `data/comparisons/` | `CmsResource` (`comparison`) |
| Checklists | 1 / 127 items | `data/checklists/` | `CmsResource` (`checklist`) |
| Glossary | 12 | `data/glossary/` | `CmsResource` (`glossary`) |
| Templates | 1 / 73 fields | `data/templates/` | `CmsResource` (`template`) |
| Tools | 1 | `data/tools/` | `CmsResource` (`tool`) |

### Phase 3 import (one-time)

```bash
npx prisma migrate deploy
npm run content:import:phase3
```

- Writes `ContentImportMarker` (`phase3`). Re-runs are skipped unless `--force`.
- Does **not** run on every deploy. Do not use `--force` against edited production content.
- Imports 56 legacy `/{slug}` → `/blog/{slug}` rows into `Redirect`.
- Insights keep **original** `publishedAt` as `originalPublishedAt` (migration time ≠ public date).

### Fallback policy

`lib/content/phase3-public.ts`: if a family’s published DB list is empty, fall back to typed/markdown sources. Once import has populated the family, DB is authoritative — empty slug → `notFound()`, not silent markdown.

### Interactive ID protection

- Checklist item IDs and Template field IDs must not be casually renamed (localStorage).
- Tool scoring remains in code.

## Blog notes

- Public URL stays `/blog/[slug]` (not `/insights/...`).
- Markdown files remain migration/reference backup after import.
- Hero images: preserve existing paths; do not fabricate missing assets.
