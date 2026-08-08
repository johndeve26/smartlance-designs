# Database Integrity and Performance Audit

PostgreSQL via Prisma. Schema is 1789 lines across 15 applied migrations. `npx prisma validate` passes.

No destructive operation was performed. No migration was created or applied. No data was read from production.

---

## Schema integrity

**Migration health.** Fifteen migrations from `20260807200000_init` through `20260808220000_ai_content_assistants_phase_e`, applied in order with a `migration_lock.toml` present. No failed or partially applied migration markers. Schema fields were spot-checked against migration SQL and no drift was found — including `SiteSettings.extras`, which is covered.

**Constraints.** Critical invariants are enforced by the database, not just by application checks:

| Constraint | Table | Why it matters |
|---|---|---|
| Unique `slug` (and `href` where present) | Service, Solution, Platform, Insight, WorkProject, Industry, Testimonial | A check-then-insert race cannot produce duplicate public URLs; the second insert fails. |
| Unique `(type, slug)` | CmsResource | Resource slugs are scoped per kind, so a Guide and a Checklist may share a slug. |
| Unique `email` | AdminUser | Prevents duplicate admin identities. |
| Unique `tokenHash` | AdminSession | Session lookup is a single unique read. |
| Unique `sourcePath` | Redirect | One authoritative destination per source; makes `upsert` safe. |
| Unique `reference` | Enquiry | Customer-facing reference cannot collide. |
| Unique `(entityType, entityId, revision)` | ContentRevision | Concurrent publishes collide loudly instead of silently overwriting a revision. |
| Unique `(placement, entityType, entityId)` | Curated placements | One placement entry per entity. |

**Enums.** `ContentStatus`, `RedirectStatus`, `RedirectOrigin`, `MediaAssetStatus`, `MediaSourceType`, `EnquiryStatus`, `EnquiryType`, `NotificationStatus`, `AdminRole`, `AdminUserStatus` are all database enums, so an invalid value cannot be stored.

**Nullability.** No inconsistency found between application assumptions and column nullability. Enquiry PII columns are nullable specifically so anonymisation can null them without deleting the row — that is intentional, not a modelling error.

---

## Transactions

**Finding: publishing is not atomic. This is the single highest-value database improvement available.**

There is no `prisma.$transaction` in `lib/` other than the last-Super-Admin guard added by this audit. Every publish follows the same shape:

```
await prisma.<entity>.update({ status: "PUBLISHED", publishedAt, updatedById })
await createContentRevision(...)
await writeAuditLog(...)
revalidate...(...)
```

If step one succeeds and a later step throws, the entity is published with no revision and/or no audit entry.

**Actual severity is moderate, not severe.** The published state is a single-row update, so the content itself is never half-written — a reader can never observe a partially published entity. What can be lost is bookkeeping: the revision snapshot and the audit trail.

**Recommendation.** Wrap promotion, revision creation, and the audit write in one `prisma.$transaction`, keeping `revalidate*` outside it (cache invalidation must not hold a database transaction open, and must not run if the transaction rolls back). This touches roughly eight repositories and should be a separate, reviewed change with its own tests rather than an incidental audit edit.

**Secondary race.** `createContentRevision` reads `max(revision)` and then inserts. Two simultaneous publishes of the same entity collide on the unique constraint and the second throws. That is a safe failure mode — no corruption — but it will surface as an error to the second editor.

---

## Deletion behavior

| Relation | Behavior | Assessment |
|---|---|---|
| `Enquiry` → `EnquiryNote` | Notes deleted on anonymise | Correct — notes are the most likely place for stray PII. |
| `AdminUser` → content authorship | Retained | Correct — deleting a user should not erase content history. |
| `AIContentRun` → `AIContentProposal` | Referenced by `runId` | Runs are retained for provenance. |
| `Redirect` | Status-flagged `DISABLED` rather than deleted (after BE-03) | Preserves history and makes the change auditable. |

Enquiries support both anonymisation (preferred — retains the record, clears PII) and hard delete (Super Admin only, audited). The anonymisation path was checked and it clears every PII column and removes notes.

---

## Query patterns and pagination

Every list query is bounded. `?pageSize=1000000` cannot produce an unbounded scan.

| Query | Bound |
|---|---|
| `listEnquiries` | `min(pageSize, 100)`, `page ≥ 1` |
| `listMediaAssets` | `min(pageSize, 100)`, `page ≥ 1` |
| `listRedirects` | `min(limit, 200)` |
| `listPendingProposals` | `take: 10` |
| `exportEnquiriesCsv` | `take: 2000` |

The media API additionally validates page and pageSize at the HTTP boundary now (BE-08), so malformed input returns 400 rather than relying solely on downstream clamping.

**Ordering is stable** — every paginated query orders by a concrete column (`submittedAt`, `createdAt`, `updatedAt`) rather than relying on insertion order.

**Search inputs.** Admin search uses Prisma `contains` with `mode: "insensitive"`, which is parameterised. No regex is applied to attacker-controlled strings, so there is no ReDoS exposure on this path.

---

## Indexes

The schema declares **104 `@@index` entries**. Access patterns are well covered, and **no new index is recommended or was added**.

| Access pattern | Covered by |
|---|---|
| Public page by slug | Unique index on `slug` |
| Session lookup | Unique index on `tokenHash` (`AdminSession`) |
| Session pruning by expiry | `@@index([expiresAt])` |
| Redirect lookup on every matched request | Unique index on `sourcePath` |
| Content lists filtered by status, ordered by publish date | `@@index([status])`, `@@index([publishedAt])` per content table |
| Audit log by entity | `@@index([entityType, entityId])` |
| Audit log by time / actor / action | Separate `@@index([createdAt])`, `([actorId])`, `([action])` |
| Content revisions by entity | `@@index([entityType, entityId])` |
| Media lists | `@@index([status, createdAt])` composite |
| Resources by kind and status | `@@index([type, status])` composite |

**Over-indexing observation.** Several small catalogue tables carry four or more single-column indexes — for example `Industry` indexes `status`, `group`, `displayOrder`, and `hasVerifiedProjectExperience` on a table with a few dozen rows, where Postgres will sequential-scan regardless. This costs a little write throughput and storage but nothing operationally meaningful at this scale. It is recorded rather than changed, since dropping indexes is a migration and this audit added none.

**Audit-log note.** `createdAt` and `(entityType, entityId)` are separate indexes rather than one composite. A query filtering by entity *and* ordering by time uses one index and sorts the remainder. Fine at current volume; a composite `(entityType, entityId, createdAt)` would be the right move if the audit log becomes large and entity-scoped views feel slow.

The one query shape without dedicated index support is the enquiry free-text search, which ORs `contains` across seven columns. At current enquiry volume a sequential scan is fine. If enquiry volume reaches six figures, replace it with a Postgres full-text index rather than adding seven separate indexes.

---

## Growth risks

Tables that grow monotonically and need eventual retention decisions:

| Table | Driver | Current mitigation | Recommendation |
|---|---|---|---|
| `AdminSession` | One row per login, 14-day TTL | Expiry enforced at read; revoked rows retained | Add a periodic prune of rows past `expiresAt`. Rows are small; not urgent. |
| `AuditLog` | Every admin mutation | Indexed and paginated | Retain indefinitely for now — it is security history and should not be deleted casually. Revisit at multi-year scale. |
| `AIContentRun` / `AIContentProposal` | One row per generation, plus JSON payloads | Bounded per-entity queries | Watch `payloadJson` size. Consider archiving runs older than a year once volume justifies it. |
| `ContentRevision` | One row per save and publish, full snapshots | Bounded queries | The largest growth driver by bytes, since each row is a full entity snapshot. Consider capping retained revisions per entity. |
| `Enquiry` | One row per submission | Anonymisation available | Define a retention period for PII and apply anonymisation on schedule. |

None of these is an immediate problem. All common queries against them remain indexed and paginated.

---

## JSON fields

`pageContent`, `draftJson`, `payload`, `payloadJson`, `currentSnapshotJson`, and audit `metadata` are Prisma `Json` columns.

**Validated at use:** Solution `pageContent` passes through `is*SolutionContent` type guards before rendering. AI structured output is schema-validated before it reaches Prisma.

**Not size-bounded:** no explicit cap exists on JSON column size. Practical bounds come from upstream limits — AI output is token-capped, and the proposal decision array is now capped at 200 entries. A determined admin could still store a very large `pageContent`. Low risk given the trust level required; recorded rather than fixed.

---

## Connection management

`lib/db.ts` uses the standard Prisma singleton guarded against hot-reload duplication in development, so the dev server does not accumulate clients. `DATABASE_URL` is required in production by `validateServerEnv`, and `DIRECT_URL` is available for migrations. `hasDatabaseUrl()` guards let read paths degrade gracefully rather than throw when the database is unconfigured.

---

## Seed and script safety

`scripts/` contains import and verification utilities. `scripts/import-phase3-content.ts` is the only place in the repository using `prisma.$transaction`, which is appropriate for a bulk import.

No script creates default admin credentials or demo users. Admin bootstrap reads `ADMIN_BOOTSTRAP_EMAIL` and `ADMIN_BOOTSTRAP_PASSWORD` from the environment rather than shipping a predictable default, so there is no known-credential exposure after setup.

**Recommendation:** import and mutation scripts have no explicit production guard. They must be pointed at a database by `DATABASE_URL`, so an operator with the production URL in their shell could run one by accident. Adding an explicit environment confirmation to the mutating scripts would be a cheap safety improvement. Not changed here, because altering script behaviour was out of scope for a read-only database audit.
