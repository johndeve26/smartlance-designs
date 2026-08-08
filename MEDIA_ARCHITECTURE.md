# Media Architecture

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

## Production env

```bash
MEDIA_STORAGE_PROVIDER=s3
MEDIA_S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com   # optional for AWS
MEDIA_S3_REGION=auto
MEDIA_S3_BUCKET=your-bucket
MEDIA_S3_ACCESS_KEY_ID=...
MEDIA_S3_SECRET_ACCESS_KEY=...
MEDIA_PUBLIC_BASE_URL=https://media.example.com
MEDIA_S3_FORCE_PATH_STYLE=1   # often needed for R2/MinIO
MEDIA_MAX_UPLOAD_MB=8
```

`MEDIA_PUBLIC_BASE_URL` is also used to whitelist Next Image `remotePatterns`.

## Validation

`lib/media/validation.ts`:

- Allowed: JPEG, PNG, WebP, AVIF, GIF
- SVG: **not allowed**
- Checks extension, sniffed magic bytes, optional reported MIME, size limit
- Captures width/height via `image-size`

## Model

`MediaAsset` tracks metadata. Existing site files are registered as `STATIC_EXISTING` with `storageKey = static:<publicUrl>` and keep their original `/images/...` URLs. New uploads use object storage keys under `uploads/YYYYMMDD/...`.

## Usage / delete safety

`findMediaUsages()` scans homepage, settings, work, insights, managed pages, and `AssetReference`.

- Used by published content → ordinary permanent delete blocked
- Archive preferred for retirement from pickers
- Permanent delete: Super Admin (`media_permanent_delete`)
- Static files are never deleted from disk — only metadata rows

## Import

`npm run content:import:phase4` registers known brand, project, blog, and OG assets idempotently.
