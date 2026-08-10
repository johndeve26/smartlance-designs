# Smartlance Backup & Restore Runbook

**Last verified:** 2026-08-10  
**Method proven on:** Local PostgreSQL (`smartlance_test` → `smartlance_restore_verify`)

---

## Scope

This runbook covers **PostgreSQL** backup and restore. Object storage (Cloudflare R2 / S3) is **separate** — restoring a database does not restore private agency files unless storage is backed up independently.

---

## When to backup

- Before `prisma migrate deploy` on any environment with non-disposable data
- Before major releases
- On a schedule aligned with RPO (recommended: daily automated + pre-deploy manual)

---

## PostgreSQL backup

### Standard dump (recommended)

```bash
pg_dump "$DATABASE_URL" --no-owner --no-acl -f smartlance_backup_$(date +%Y%m%d_%H%M%S).sql
```

For Neon / managed Postgres, prefer provider snapshots in addition to logical dumps.

### Verify dump

```bash
wc -c smartlance_backup_*.sql
head -20 smartlance_backup_*.sql   # should show PostgreSQL dump header
```

---

## PostgreSQL restore

**Never restore over production in place for verification.** Use a disposable database.

```bash
# Create empty target DB (local example)
createdb smartlance_restore_verify

# Restore
psql "$RESTORE_DATABASE_URL" -v ON_ERROR_STOP=1 -f smartlance_backup_YYYYMMDD.sql
```

---

## Post-restore validation

1. **Prisma migrate status** — should match source (no pending if source was current):

   ```bash
   DATABASE_URL="$RESTORE_DATABASE_URL" npx prisma migrate status
   ```

2. **Representative row checks** (adjust IDs as needed):

   ```sql
   SELECT COUNT(*) FROM "CrmContact";
   SELECT COUNT(*) FROM "AgencyInvoice";
   SELECT COUNT(*) FROM "AgencyProject";
   SELECT migration_name FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 1;
   ```

3. **Money integrity** — spot-check invoice/payment minor units:

   ```sql
   SELECT id, "totalMinor", "balanceMinor", currency FROM "AgencyInvoice" LIMIT 5;
   ```

4. **JSON snapshots** — compare onboarding/proposal snapshot fields on known records if critical.

5. **Counter continuity** — after restore, create a new invoice/project in a **non-production** clone and confirm human-readable numbers do not collide.

6. **Application smoke** — start app against restore DB; load Admin, Portal, one billing record.

---

## Verified restore evidence (2026-08-10)

| Item | Value |
|------|-------|
| Source | `smartlance_test` @ localhost:5555 |
| Target | `smartlance_restore_verify` (new DB) |
| Dump size | ~759 KB |
| CrmContact count | 17 |
| AgencyInvoice count | 13 |
| AgencyProject count | 4 |
| Latest migration | `20260813100000_prospect_experience_v1` |

---

## Object storage (R2 / S3)

| Topic | Guidance |
|-------|----------|
| Private agency files | Stored under `MEDIA_S3_*` / `AGENCY_S3_*` keys — not in PostgreSQL blobs |
| DB restore alone | Metadata restored; files must exist at `storageKey` or downloads fail |
| Backup policy | Enable R2/S3 versioning and lifecycle rules per operator policy |
| Cross-region | Document bucket region; restore DR plan separately |

---

## Production go-live checklist

1. Take provider snapshot + logical dump immediately before migrate deploy.
2. Run migrate deploy (not `db push`, not `migrate reset`).
3. Smoke test critical routes.
4. Confirm scheduler secrets and webhooks still point to production URLs.
5. Keep backup artifact for rollback window per ops policy.

---

## Rollback

- **Schema rollback:** Prefer forward-fix migration; do not delete applied migrations from shared DBs.
- **Data rollback:** Restore snapshot/dump to a new instance and switch `DATABASE_URL` (downtime window required).
