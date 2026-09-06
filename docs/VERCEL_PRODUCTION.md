# Vercel production (no VPS)

Target architecture **for now**:

| Layer | Where |
|-------|--------|
| Next.js app | **Vercel** |
| Postgres (blog, CRM, contacts, leads, email) | **Neon** (or Vercel Postgres — same family) |
| Images / media | Keep current S3/R2 env if already set; **Cloudflare R2 polish later** |
| Local development | **Postgres.app → `localhost/smartlance`** (`.env.local`) |

Vercel does **not** store your CRM/blog rows on its free disk. Those always live in Postgres. “Everything on Vercel” means the **app** is on Vercel; the **database** is a managed Postgres URL in Vercel env vars (Neon).

## Abandoned

- Self-hosted Postgres on a **VPS** (not using that path).
- Scripts under `scripts/db/vps-provision-postgres.sh` are optional/reference only.

## Local vs production

- **Local** [`.env.local`](../.env.local): `DATABASE_URL` → `localhost` (already done).
- **Vercel dashboard** env: `DATABASE_URL` / `DIRECT_URL` → **Neon** pooled + direct URLs (your existing Neon project).
- Changing `.env.local` never updates Vercel. You must set env in the Vercel project UI (or `vercel env`).

## Vercel checklist

1. Project linked to `johndeve26/smartlance-designs` (Git deploy on `main`).
2. Environment variables (Production + Preview as needed):
   - `DATABASE_URL` — Neon **pooled** URL (`…-pooler…neon.tech…`)
   - `DIRECT_URL` — Neon **direct** URL (migrations)
   - `ADMIN_SESSION_SECRET`
   - `NEXT_PUBLIC_SITE_URL=https://your-production-domain`
   - Email / media keys as already used in production
3. After env changes: **Redeploy**.
4. Run migrations once against production if needed:
   ```bash
   DIRECT_URL="$NEON_DIRECT" DATABASE_URL="$NEON_POOLED" npx prisma migrate deploy
   ```
   (Use production secrets; never point this at localhost by mistake.)

## Cloudflare images

Deferred until the site is stable on Vercel. Existing `MEDIA_STORAGE_PROVIDER=s3` + R2 endpoint can stay; no change required for this pass.

## Neon wake tip

If admin/CRM fails with connection errors, open the [Neon console](https://console.neon.tech) and wake the project, then redeploy or retry. Localhost development stays unaffected.
