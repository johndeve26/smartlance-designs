# CRM Contact CSV Import (V3.3)

Admin → CRM → Contacts → **Import CSV**

## Workflow

1. **Upload** — `.csv` only, max 5 MB, max 5,000 data rows (`CRM_CSV_IMPORT_MAX_ROWS`).
2. **Map columns** — auto-suggested aliases; internal fields (id, emailStatus, ownerId, etc.) are not mappable.
3. **Preview** — server validates every row; **no CRM mutations**.
4. **Review** — summary counts, first 50 preview rows, duplicate-file warning when SHA-256 matches a prior completed import.
5. **Import** — client re-uploads the same file; hash must match preview.
6. **Results** — counts, import history, optional rejected-rows CSV.

Routes:

- `/admin/crm/contacts/import`
- `/admin/crm/imports`
- `/admin/crm/imports/[id]`

## Limits

| Constant | Value |
|----------|-------|
| `CRM_CSV_IMPORT_MAX_BYTES` | 5 MB |
| `CRM_CSV_IMPORT_MAX_ROWS` | 5,000 |
| `CRM_CSV_IMPORT_BATCH_SIZE` | 100 |
| `CRM_CSV_IMPORT_PREVIEW_ROWS` | 50 |
| `CRM_CSV_IMPORT_MAX_CELL_LENGTH` | 8,000 |

## Mappable fields

First/last/display name, email, phone, job title, company name/website/domain, lifecycle, notes, source detail.

## Import options

- **Existing contacts:** Skip (default) or update empty fields only.
- **Companies:** optional create missing companies (domain match first, then name).
- **Leads:** optional, default OFF; explicit status + temperature when enabled.
- **Source:** import-level `OUTBOUND` (default) + source detail (e.g. list name).
- **Owner:** import-level assignment only — CSV cannot set owner.

## Safety

- **Suppression always wins** — import never sets `emailStatus` from CSV; existing opt-out/unsubscribe/bounce states persist.
- **No Subscribers** — CRM import does not create Audience Subscriber records.
- **No email send** — import is data ingestion only.
- **No sequence enrollment** — enroll via Segments deliberately after review.
- **No raw CSV storage** — only filename, SHA-256 hash, mapping, options, summary, bounded issue snapshots.

## Source attribution

Contacts receive `source = OUTBOUND` (or configured import source) and `sourceDetail = "CSV import: {fileName}"` unless overridden at import level.

## Audit

`crm_contact_import_completed` / `crm_contact_import_failed` with safe summary metadata (no full CSV/PII).

## Permissions

Requires `manage_crm` for upload, preview, import, and rejected-row download. View history with `view_crm`.

## Error report

Download rejected rows from import detail when invalid rows exist. Includes row number, error code, message, and mapped columns with formula-injection escaping.
