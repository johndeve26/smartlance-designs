# Media Architecture

## Source of truth

| Layer | Authority |
| --- | --- |
| Public content | Database records (published snapshots) |
| Media binaries | Static `public/` files and/or managed object storage |
| Media index | `MediaAsset` rows (metadata + reference target) |

A file existing under `public/images/` does **not** create or publish content. A `MediaAsset` row does **not** imply published usage.

## Storage abstraction

All uploads go through `MediaStorageProvider` (`lib/media/types.ts`):

- `upload()`
- `delete()`
- `getPublicUrl()`
- `getMetadata()`

Implementations live in `lib/media/storage.ts`:

| Provider | When | Notes |
| --- | --- | --- |
| `local` | Development default (`MEDIA_STORAGE_PROVIDER=local`) | Writes under `storage/media/`, served via `/api/media/...`. Rejected in production unless `MEDIA_ALLOW_LOCAL_IN_PRODUCTION=1`. |
| `s3` | Production (`MEDIA_STORAGE_PROVIDER=s3` / `r2` / `s3-compatible`) | S3-compatible API (Cloudflare R2, AWS S3, etc.). |

Business logic never imports a vendor SDK directly — only the adapter.

Static repository assets (`STATIC_EXISTING`) keep site-relative URLs such as `/images/projects/...` and are not deleted from disk when metadata rows are removed.

## Reference contract

See [MEDIA_REFERENCE_CONTRACT.md](./MEDIA_REFERENCE_CONTRACT.md).

Key modules:

- `lib/media/reference.ts` — normalize, classify, resolve, match
- `lib/media/urls.ts` — CDN/public base mapping
- `lib/media/content-references.ts` — extract refs from structured content
- `lib/media/usage.ts` — reference scan for delete protection

## MediaAsset model

`MediaAsset` tracks metadata:

- Uploaded assets: object storage key under `uploads/…`
- Static assets: `storageKey = static:/images/...`, `sourceType = STATIC_EXISTING`, `storageProvider = static`

Matching for sync uses `storageKey`, not display title or alt text.

## Static discovery

`lib/media/static-discovery.ts` scans approved public roots:

- `public/images/**`
- `public/og/**`

Uses extension allowlisting and safe dimension reads (no generic untrusted upload sniffing path). SVG is discoverable for inventory but not accepted on upload boundary.

## Inventory

`lib/media/inventory.ts` — read-only audit:

- static files discovered
- `MediaAsset` rows
- content references across CMS entities
- orphaned rows, duplicate storage keys, missing sources, unresolved references

Classifications include: `VALID_STATIC`, `VALID_MANAGED`, `EXTERNAL_URL`, `INVALID`, `UNKNOWN`.

## Static sync (Phase 5)

`lib/media/sync-static.ts` — `syncStaticMediaAssets()`

Indexes static repository assets into `MediaAsset`. Idempotent upsert; no auto-delete.

Operations guide: [MEDIA_SYNC_OPERATIONS.md](./MEDIA_SYNC_OPERATIONS.md)

## Validation (upload boundary)

`lib/media/validation.ts`:

- Allowed uploads: JPEG, PNG, WebP, AVIF, GIF
- SVG uploads: **not allowed**
- Checks extension, sniffed magic bytes, optional reported MIME, size limit
- Captures width/height via hardened image-size path (no HEIF/mif1-as-AVIF regression)

## Usage / delete safety

`findMediaUsages()` scans homepage (incl. draft), settings, work (incl. `caseStudyContent` + draft), insights, testimonials, services, solutions, platforms, industries, CMS resources, managed pages, and asset references.

- Published usage → ordinary permanent delete blocked
- Draft-only usage → delete blocked unless forced
- Archive preferred for retirement from pickers
- Permanent delete: Super Admin (`media_permanent_delete`)
- Static files are never deleted from disk — only metadata rows

## Public resolution

Public DTOs expose resolved URL/path and alt/dimensions where useful — not storage credentials or private metadata.

`resolvePublicMediaReference()` and `resolveMediaUrl()` map stable stored paths to browser URLs, including optional `MEDIA_PUBLIC_BASE_URL`.

## R2 migration (unchanged)

`npm run media:migrate:r2` copies managed objects to remote storage. It is **not** invoked by static sync.

Phase 5 preserves R2 adapter types/contracts used by the migration script.

## Next.js images

`MEDIA_PUBLIC_BASE_URL` feeds Next Image `remotePatterns`. Do not add wildcard host patterns.

## Related imports

- `npm run content:import:phase4` — registers known brand/project/blog/OG assets idempotently (legacy import path)
- `npm run media:sync:static` — Phase 5 repository static indexing
