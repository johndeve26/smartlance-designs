# Cloudflare R2 for Smartlance media

Binary media (blog images, uploads) should live on Cloudflare R2, not Vercel Blob or Neon.

## Status

Local `.env.local` already uses S3-compatible R2:

- `MEDIA_STORAGE_PROVIDER=s3`
- `MEDIA_S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com`
- `MEDIA_S3_BUCKET=smartlance-designs`
- `MEDIA_S3_REGION=auto`
- Access key + secret configured

So **Phase 3 for local/dev is already satisfied**. Mirror the same keys on **Vercel project env** for production.

## Checklist (production Vercel)

1. Cloudflare → R2 → bucket (e.g. `smartlance-designs`) + public access / custom domain if needed.
2. Create R2 API token (Object Read & Write).
3. In Vercel → Project → Settings → Environment Variables:

```bash
MEDIA_STORAGE_PROVIDER=s3
MEDIA_S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
MEDIA_S3_BUCKET=smartlance-designs
MEDIA_S3_REGION=auto
MEDIA_S3_ACCESS_KEY_ID=...
MEDIA_S3_SECRET_ACCESS_KEY=...
# Optional public base URL if you use a custom domain:
# MEDIA_PUBLIC_BASE_URL=https://media.smartlancedesigns.com
```

4. Redeploy.
5. Upload a test image in Admin Media and confirm the public URL is on R2/CDN.

## Notes

- CRM contacts/leads/blog **posts** stay in Postgres.
- Do not put large media on Vercel Hobby Blob (1 GB cap).
- Agency uploads may use `AGENCY_S3_*` if configured separately; same R2 account/bucket pattern works.
