# Media Reference Contract

Content records store **stable references**. Runtime code resolves how those references are served.

## Supported reference types

| Type | Example | Classification | Notes |
| --- | --- | --- | --- |
| Static public path | `/images/projects/padeya/hero.webp` | `VALID_STATIC` | Served from `public/` or mapped via `MEDIA_PUBLIC_BASE_URL` |
| Managed upload path | `/uploads/20260101/file.webp` or CDN-prefixed URL | `VALID_MANAGED` | Backed by `MediaAsset` + object storage |
| External URL | `https://example.com/image.webp` | `EXTERNAL_URL` | Allowed only where content intentionally stores absolute URLs |
| Invalid | `../../secret`, `javascript:…`, `file:…` | `INVALID` | Rejected by normalization |

## Approved static roots

Site-relative paths must stay under:

- `/images/…`
- `/og/…`

These map to `public/images/` and `public/og/`. Paths outside approved roots or containing `..` are rejected.

## Storage keys for static assets

Indexed static files use:

- `sourceType = STATIC_EXISTING`
- `storageProvider = static`
- `storageKey = static:<normalized-public-path>`
- `publicUrl = <normalized-public-path>` (typically `/images/...`)

Do **not** store machine-specific filesystem paths (`/Users/...`, `C:\...`) in CMS content.

## Resolution

Use `resolvePublicMediaReference(ref)` for browser-facing URLs.

Use `normalizePublicMediaPath(ref)` when comparing or indexing references.

Use `mediaReferencesMatch(contentRef, assetPublicUrl)` when matching content to `MediaAsset.publicUrl` (handles CDN prefix variants).

## Precedence

- Do not mass-rewrite working URLs merely for uniformity.
- Do not fabricate alt text during sync.
- Existing human-authored alt/caption on `MediaAsset` is preserved.
- Missing alt may be reported; it is not AI-generated in Phase 5.

## Case study JSON

Structured `caseStudyContent` may reference images in:

- `gallery[].src`
- `productFeatures[].image.src`

These references follow the same contract and are included in usage/delete scans.

## What this contract does not do

- It does not imply that a static file creates content.
- It does not migrate binaries to R2.
- It does not delete orphaned rows automatically.

See also: [MEDIA_SYNC_OPERATIONS.md](./MEDIA_SYNC_OPERATIONS.md), [MEDIA_ARCHITECTURE.md](./MEDIA_ARCHITECTURE.md).
