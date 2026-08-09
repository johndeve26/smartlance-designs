# Work draft publishing

## Previous behavior (Phase 2 limitation)

`saveWorkDraft()` set `status: DRAFT` on published rows, immediately removing them from public Homepage, `/work`, detail, adjacent, and related surfaces.

## Current behavior (Phase 3)

Published columns remain the public snapshot. Unpublished edits live in:

- `draftJson`
- `draftUpdatedAt`
- `draftUpdatedById`

`effectiveWorkFields(row)` = published fields merged with `draftJson`.

### Save draft

- **Published row:** updates draft overlay only; `status` unchanged.
- **New row:** creates `DRAFT` row with bootstrap columns + `draftJson`.

### Preview

Uses `getWorkForPreview()` → effective fields projected through `toPublicProject()`.

### Publish

Single transaction (Work-scoped):

1. Optional homepage hero uniqueness (`featuredHomepage`)
2. Promote effective fields to published columns
3. Replace industry links from draft `industryIds`
4. Slug change + redirect when previously published
5. Clear draft overlay
6. Set `status: PUBLISHED`

On failure, published snapshot remains; draft is retained for retry.

### Discard draft

Clears `draftJson` only. Published columns untouched.

### Revisions

- Draft save → revision snapshot `{ kind: "draft", draft, published }`
- Publish → full published row snapshot

### Slug changes

- Draft slug edits do not affect public URLs until publish.
- `changeWorkSlugAction` still applies immediately to published columns (legacy admin path). Prefer editing slug in draft + publish for safe promotion.

### Revalidation

- Draft save: admin paths only (no public revalidation required)
- Publish: `/`, `/work`, `/work/[slug]` via existing `revalidateWork()`
