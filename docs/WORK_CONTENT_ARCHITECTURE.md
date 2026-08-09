# Work content architecture

## Source of truth

| Surface | Authority |
| --- | --- |
| Homepage Work hero + selected cards | Published `WorkProject` columns |
| `/work` listing | Published `WorkProject` columns |
| `/work/[slug]` detail | Published `WorkProject` columns + `caseStudyContent` JSON |
| Admin editor | Effective fields = published ⊕ `draftJson` |
| Preview | Effective fields (draft overlay) |
| Typed `data/portfolio.ts` | STATIC / PRE-IMPORT fallback only |
| Typed `data/case-study-narratives.ts` | STATIC / PRE-IMPORT / migration fallback only |

## Field ownership

- **Listing/card:** `name`, `shortDescription`, `coverImagePath`, `servicesLabels`, `featured`, `displayOrder`
- **Detail hero:** `heroStatement`, `heroEyebrow`, `heroSupportingCopy`, `heroImagePath`, `externalLinkLabel`
- **Website narrative columns:** `challenges`, `approachSteps`, `solutionPoints`, `highlights`, `platformContext`, `outcomeHeading`
- **Product / structured sections:** `caseStudyContent` (versioned JSON) + `caseStudyKind`
- **SEO:** `seoTitle`, `seoDescription`, `og*`, `noIndex`, `canonicalOverride` (not duplicated inside JSON)
- **Relationships:** `industryIds` (via `IndustryWork`), `relatedServiceHrefs`, `relatedWorkSlugs`
- **Private proof:** `approvedProjectFacts`, `approvedForAI` — never public

## Legacy narrative

When `caseStudyContent` is set on a published row, `usesDbCaseStudyContent` is true and `resolveCaseStudyContent()` does not read `case-study-narratives.ts`.

After import marker `phase3-work-case-study`, migrated projects must not depend on narrative files in DATABASE mode.
