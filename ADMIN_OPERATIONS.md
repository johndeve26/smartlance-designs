# Admin Operations

## First-time setup

1. Provision a Neon (or Postgres) database.
2. Copy `.env.example` → `.env.local` and set:

```bash
DATABASE_URL=...          # pooled
DIRECT_URL=...            # optional direct for migrations
ADMIN_SESSION_SECRET=...  # long random
ADMIN_BOOTSTRAP_EMAIL=...
ADMIN_BOOTSTRAP_PASSWORD=...  # ≥ 12 characters
```

3. Apply schema and seed:

```bash
npx prisma migrate deploy
npm run admin:bootstrap
npm run db:seed                 # Phase 1–2 catalogue
npm run content:import:phase3   # Phase 3 one-time import
npm run content:import:phase4   # Phase 4 media/nav/settings/managed pages
```

4. Start the app (`npm run dev`) and sign in at `/admin/login`.

## Day-to-day

| Task | Where |
| --- | --- |
| Edit homepage hero/sections/SEO | `/admin/homepage` |
| Create/edit services | `/admin/services` |
| Edit solutions (incl. pageContent JSON) | `/admin/solutions/[id]` |
| Edit platforms | `/admin/platforms/[id]` |
| Industries | `/admin/industries` |
| Work / case studies | `/admin/work` |
| Testimonials (verify then publish) | `/admin/testimonials` |
| Insights (blog) | `/admin/insights` |
| Resources dashboard | `/admin/resources` |
| AI Editorial Studio | `/admin/ai-writer` |
| AI settings / brand voice / source policy | `/admin/ai-writer/settings` · `brand-voice` · `source-policy` |
| Media library / upload | `/admin/media` |
| Header / footer navigation | `/admin/navigation` |
| Redirects | `/admin/redirects` |
| Site settings | `/admin/settings` |
| SEO inventory | `/admin/seo` |
| Link health | `/admin/link-health` |
| System status | `/admin/system` |
| Enquiries (all / contact / reviews) | `/admin/enquiries` |
| Publish / unpublish | Editor actions on each record (Editor+) |
| Preview draft | `/admin/preview/...` |
| Manage admins | `/admin/users` (Super Admin) |
| Investigate changes | `/admin/audit-log` |

### Phase 5 enquiry notes

- Public success = **database persistence** succeeded (see `ENQUIRY_OPERATIONS.md`).
- Notification failure does **not** delete the enquiry; retry from detail.
- Export / anonymize / permanent delete: Super Admin only.
- No CRM, email composer, or lead scoring.

### Phase 3 editorial notes

- **Insights:** keep original publish dates; body is Markdown.
- **Testimonials:** mark verified (Editor+) before publish.
- **Work results:** leave empty unless verified — no invented metrics.
- **Checklist/Template/Tool:** edit labels/copy; do not rename technical IDs.
- **Comparison:** no winner/stars/ratings fields.

## Build notes

- `npm run build` runs `prisma generate` then `next build`.
- Production runtime **requires** `DATABASE_URL` and seeded/published content for migrated pages.
- Without `DATABASE_URL`, public list helpers return empty arrays so generate/build can proceed, but detail pages 404 until the DB is configured and seeded.

## Scheduled maintenance

- `npm run admin:prune-sessions` — mark/delete expired Admin sessions (safe recurring job)

## Form delivery status

Dashboard / System show notification as **Configured** when Resend or webhook env is set (presence only — not a live send guarantee). Enquiry **persistence** health is separate (PostgreSQL). Unresolved notification failures in the last 24h are listed on System.

## Security checklist

- Never commit real `.env` secrets
- Admin routes send `Cache-Control: no-store` and robots noindex
- Rotate `ADMIN_SESSION_SECRET` only with a plan to invalidate sessions (users must re-login)
- Prefer Server Actions over public POST APIs for admin mutations

## QA commands

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build   # needs credentials for a full content build
```

Manual smoke: `/` → `/services` → one service → `/solutions` → one solution → `/platforms` → one platform → admin login → draft → preview → publish → confirm public + audit row.
