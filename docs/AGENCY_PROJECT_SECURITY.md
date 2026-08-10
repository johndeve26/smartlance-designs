# Agency Project Security

## Admin RBAC

Capabilities:

- `view_projects` — list and read projects
- `manage_projects` — create, edit, status, tasks, deliverables, portal invites
- `manage_project_templates` — template CRUD and archive

Granted to `SUPER_ADMIN` and `EDITOR`.

## Portal isolation

Portal auth is completely separate from admin capabilities. Portal users cannot access `/admin/*`.

## Private files

Project files use `AgencyProjectFile` with private storage keys under `agency/private/` prefix.

- **Development:** local filesystem (`AGENCY_PRIVATE_STORAGE_DRIVER=local`)
- **Production:** S3-compatible private bucket required; startup validation fails without it

Access via `/api/agency/files/[id]`:

1. Authenticate admin (`view_projects`) or portal session
2. Verify explicit `AgencyProjectClientAccess`
3. Stream (local) or redirect to short-lived signed S3 URL (10 min TTL)

Upload restrictions: max 50 MB, blocked HTML/JS/executables, safe Content-Disposition headers, `X-Content-Type-Options: nosniff`.

Never expose storage keys or permanent public URLs to clients.

## Credential safety

Client requirements of type `ACCESS` must **not** store passwords or hosting credentials in plaintext. V1 directs credential sharing through secure external channels.

## Input validation

All mutations validated with Zod schemas in `lib/agency/schema.ts`. Admin actions use `assertSameOrigin()`.

## XSS

Comments, updates, review text rendered as plain/sanitized text — no raw HTML.

## SSRF

External deliverable URLs are link-only — never fetched server-side.

## SEO

Portal routes and project assets are not indexed.

## Error pages

Portal "not found" and "no access" return the same response shape — no information leakage about project existence.

## Audit

Significant admin actions logged: project created, status changed, template changed, portal access granted/revoked, admin deliverable override.

No file contents or secrets in audit metadata.

## Data retention

Project business records are separate from marketing subscriber data. Privacy tooling should not incorrectly delete active project records when handling marketing opt-outs.
