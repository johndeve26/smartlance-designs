# Disaster recovery

Operational recovery for Smartlance Admin Manager. Prefer restore + controlled redeploy over ad-hoc production table edits.

## 1. Database loss / corruption

1. Stop writes / pause deploys if possible.
2. Restore from Neon (or host) backup / PITR to a **new** database or verified restore point.
3. Point `DATABASE_URL` / `DIRECT_URL` at the restored DB.
4. Run `npx prisma migrate deploy` only if restore is behind migrations.
5. Verify: Admin users, content counts, redirects, settings, enquiries, audit.
6. Media objects are **not** in the DB — verify storage separately.

**Restore test:** Periodically restore a non-production copy and confirm those entities. A backup never restored is incomplete.

## 2. Bad migration

1. Stop further deploy commands.
2. Inspect `_prisma_migrations` and application errors.
3. Do not repeatedly `migrate deploy` / `migrate reset`.
4. Prefer restore to pre-migration backup, fix migration in a branch, redeploy carefully.
5. Manual SQL only with a verified procedure and backup.

## 3. Media storage outage

- Public pages using absolute media URLs may show broken images; CMS text still serves.
- Admin uploads should fail clearly (`isMediaStorageConfigured` / provider errors).
- Recovery: restore storage / DNS / credentials; re-upload missing objects if no versioning.
- **Risk:** If storage has no versioning/replication, deleted objects may be unrecoverable — flag this for ops.

## 4. Email provider outage

- Enquiries still persist (Phase 5). Admin shows FAILED notification; retry later.
- Do not tell visitors to resubmit if DB succeeded.
- System Status should show configured vs recent failures.

## 5. Admin lockout

1. If sessions expired: login normally.
2. If all passwords lost but DB intact: use a **secure offline** password reset against `AdminUser.passwordHash` (argon2id via a one-off script run by an authorized operator) — there is no public register route.
3. `npm run admin:bootstrap` **does not** reset existing admins (skips when any user exists).
4. Ensure at least one active Super Admin remains (enforced on demote/disable).

## 6. Bad navigation / settings publish

1. Restore prior revision if available in Admin.
2. Re-publish verified nav/settings.
3. Confirm public header/footer/contact after revalidation.

## 7. Bad content publish / accidental unpublish

1. Revision restore → publish.
2. Confirm public route + sitemap + related links.
3. Link Health for broken relations.

## 8. Bad slug change

1. Confirm 301 from old path exists and points to new canonical (prefer single hop).
2. If loop: disable offending redirect in Admin Redirects.
3. Revalidate affected paths.

## 9. Redirect loop

1. Identify source via Admin redirect test / proxy behavior.
2. Disable loop edges.
3. Prefer direct canonical destinations for internal links.

## 10. DB vs media inconsistency

- DB `MediaAsset` whose object is missing: do not auto-delete; re-upload or archive intentionally.
- Orphan storage objects: review manually; no automatic wipe.

## Privacy requests (enquiries)

1. Authorized role finds enquiry in Admin (search email/reference).
2. Export only if legitimately required (Super Admin).
3. Anonymize or permanently delete per policy; audit without storing deleted PII payloads.
