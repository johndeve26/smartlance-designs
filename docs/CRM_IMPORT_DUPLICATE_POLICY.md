# CRM Import Duplicate Policy

Deterministic rules — no fuzzy merge, no AI scoring.

## Within CSV

- Duplicate **normalized email** in the same file: first valid row is the candidate; later rows are `DUPLICATE_IN_FILE` (skipped on import).
- Same name or phone without matching email is **not** auto-merged.

## Existing CRM contacts

**Primary match:** normalized email only.

| Strategy | Behavior |
|----------|----------|
| Skip existing (default) | No mutation; reported as skipped |
| Update empty fields only | Fill blank fields only; never overwrite populated values |
| Archived match | Skipped by default (`EXISTING_ARCHIVED` warning) |

Email on an existing contact is never changed from CSV.

## Companies

Match order:

1. Normalized domain (from website or domain column)
2. Exact normalized company name

Within-file deduplication uses an in-memory cache. Conflicting name/domain pairs are flagged, not silently merged.

## Concurrent imports

Unique constraint on `emailNormalized` is authoritative. Race on create → skipped/conflict, not full import failure.

## Re-import

Matching file hash shows a warning but does not block. Contact-level dedupe still applies per strategy.

## Phone duplicates

Exact normalized phone may surface as a **warning** only; phone is not authoritative for merge.
