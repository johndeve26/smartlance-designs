# Homepage editorial sections (Phase 4)

## Insights

| Mode | Source |
| --- | --- |
| DATABASE | `listHomepageInsights(3)` — published only, featured-first, `publishedAt` desc, slug tie-break |
| STATIC/PRE_IMPORT | `getLatestPosts(3)` from markdown |
| Fail closed | Empty section (hidden) |

No `curatedInsightIds` field exists on HomepageContent. Insight curation was not added in Phase 4; latest-published selection matches current homepage intent without new Admin UI.

Draft safety: Insights are child entities — Homepage shows each Insight's **published snapshot** only. Unpublished Insight drafts never leak.

## Testimonials

| Mode | Source |
| --- | --- |
| DATABASE | `curatedTestimonialIds` from **published** HomepageContent → `listCuratedHomepageTestimonials()` |
| STATIC/PRE_IMPORT | Typed IDs from curation or `homepageTestimonialIds` |
| Fail closed | Empty section |

Eligibility: `status = PUBLISHED` and `verified = true`. Invalid curation references are skipped (no random substitution, no typed resurrection).

Quote display: public `quote` uses `displayExcerpt` when set, otherwise approved `quote`. `originalQuote` and verification notes are never public.

Work relation: `projectSlug` only when linked Work is published.

## Homepage draft safety

Public `/` reads published HomepageContent columns only (Phase 1). Changing `curatedTestimonialIds` in Homepage draft does not affect live testimonials until Homepage publish.

Preview uses effective Homepage fields via existing preview architecture.

## Revalidation

- Insight publish/archive → `revalidateInsight()` also revalidates `/`
- Testimonial publish/unpublish/verify → `revalidateTestimonials()` revalidates `/`
- Homepage publish → existing `revalidateHomepage()`

## Loaders

- `lib/home/editorial.ts` — `loadHomepageInsights()`, `loadHomepageTestimonials()`, `loadHomepageEditorialSections()`
- Authority: `lib/content/content-source.ts` (`resolveCmsContentRuntime`)
