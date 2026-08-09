# Resource Public Discovery

Public resource indexes, the `/resources` hub, and related resource cards use the same published CMS universe as resource detail routes.

## Authority

Discovery loaders in `lib/content/phase3-public.ts` use `resolveCmsContentRuntime()`:

| Runtime | Behavior |
|---|---|
| `database` | Query published `CmsResource` rows only |
| `typed-fallback` | Use typed catalogs in `data/guides`, `data/comparisons`, etc. |
| probe/query failure | Fail closed (`[]` / `null`) — no static resurrection |

Empty published rows in DATABASE mode return empty discovery surfaces. This is intentional.

## Listing projection

Index pages do **not** load full validated payloads.

`lib/resources/discovery.ts` selects first-class columns via `RESOURCE_LISTING_SELECT` and reads only minimal payload keys when a card needs them (for example comparison `optionA` / `optionB`, checklist section counts).

Detail routes continue to use `resolvePublicResourceContent()`.

## Ordering

Non-glossary types:

1. `featured` DESC
2. `featuredOrder` ASC
3. `publishedAt` DESC
4. `title` ASC

Glossary:

- alphabetical by `title` / term

## Public card DTO

`PublicResourceCard` exposes listing metadata only:

- id, type, slug, title, description, deck, href
- featured, featuredOnResources, featuredOrder
- readingTime, heroImagePath, heroImageAlt, publishedAt
- glossary acronym / shortDefinition when relevant

It excludes payload body, draft/admin fields, and revision data.

## Related resources

Detail pages resolve related guides, comparisons, and glossary terms from published DB loaders — not static catalogs.

Archived or missing related slugs are skipped.

## Revalidation

`revalidateCmsResource()` already invalidates:

- `/resources`
- subtype archive routes (`/guides`, `/compare`, …)
- detail `href`
- sitemap tag/path

## Static helpers

Functions such as `getPublishedGuides()` in `data/*` remain for bootstrap/dev and STATIC/PRE_IMPORT fallback only. Public DATABASE-mode surfaces should call `loadPublished*` from `phase3-public`.
