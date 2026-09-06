# Database topology (current)

Smartlance uses portable PostgreSQL (`pg` + Prisma). No Neon-specific SDK.

## Active setup

| Environment | Database |
|-------------|----------|
| Local (`npm run dev`) | Postgres.app → `localhost:5432/smartlance` |
| Production (Vercel) | **Neon** via `DATABASE_URL` / `DIRECT_URL` in the Vercel project |

VPS self-hosting was considered and **dropped**. Prefer Vercel for the app and Neon for Postgres.

## Local cutover notes

- `.env.local` uses localhost; Neon URLs may still exist as `NEON_DATABASE_URL` / `NEON_DIRECT_URL` for dumps only.
- If a Neon dump failed earlier, local data may be seed-only until you restore:
  ```bash
  ./scripts/db/dump-from-neon.sh
  ./scripts/db/restore-to-local.sh
  ```

## Production

See [`docs/VERCEL_PRODUCTION.md`](VERCEL_PRODUCTION.md).

## Media

Cloudflare R2 (optional polish later): [`docs/CLOUDFLARE_R2_MEDIA.md`](CLOUDFLARE_R2_MEDIA.md).
