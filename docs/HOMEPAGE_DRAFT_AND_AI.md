# Homepage Draft & AI

## Old behavior

Admin **Save** wrote directly to live `HomepageContent` columns and called `revalidateHomepage()`. There was no draft/publish boundary. AI could not safely assist without risking live overwrite.

## New architecture

| Layer | Storage | Who reads |
| --- | --- | --- |
| Published (live) | Column fields on `HomepageContent` | Public `/` via `getHomepageContent()` |
| Draft | `draftJson` (+ `draftUpdatedAt`, `draftUpdatedById`) | Admin editor, AI apply, preview |
| Preview | `effectiveHomepageFields` (draft overlays published) | `/admin/preview/homepage/home` |

```
Edit → Save draft → Preview → Publish (human)
AI proposal → Accept fields → Apply to draft → Preview → Publish (human)
```

## Migration

Additive columns only. Existing live copy, sections, curated IDs, SEO, and visibility are preserved as the published version. No regeneration.

## Editor UX

- Status: **Draft changes** vs **No unpublished changes**  
- Buttons: **Save draft**, **Preview**, **Publish**, **Discard draft**  
- Unsaved form changes ≠ CMS draft  

## Publish / discard

- `publishHomepage` — requires `publish`; copies effective draft → live columns; clears draft; revision + audit; revalidates  
- `discardHomepageDraft` — clears draft; live unchanged  
- AI cannot call publish  

## Rollback

Publish and draft saves create `ContentRevision` snapshots (`kind: "draft"` for drafts). Restore uses existing revision infrastructure where available — no separate AI rollback.

## Revalidation

| Action | Public revalidate |
| --- | --- |
| Save draft | No |
| AI apply | No |
| Discard draft | No |
| Publish | Yes (`revalidateHomepage`) |

## Homepage Copy Assistant

- Proposes allowlisted copy/SEO/curation suggestions  
- Applies to **draft only**  
- Blocks unsupported trust claims  
- Suggests real Services / Work / verified Testimonials only  
- Does not redesign layout, invent proof, or change sitemap routes  

## SEO

AI may propose title / description / OG text. Cannot set `noIndex` or `canonicalOverride` via assistant allowlist.

## Sitemap

Homepage AI does not change route structure or sitemap entries.
