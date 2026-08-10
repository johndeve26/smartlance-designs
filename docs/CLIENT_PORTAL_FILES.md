# Client Portal Files

## Route

`/portal/files` — global file library with search and filters.

## Data source

`getPortalFiles()` in `lib/portal/files.ts`.

## Sources aggregated

| Source | Label |
|--------|-------|
| Deliverable versions | “Delivered by Smartlance” |
| Onboarding submissions | “Uploaded by you” |
| Change request files | “Uploaded by you” |

Superseded onboarding files hidden by default (`supersededAt: null`).

## DTO (client-safe)

```typescript
{
  id, name, mimeType, byteSize,
  projectId, projectName, category,
  uploadedByLabel, uploadedAt,
  sourceType, downloadHref,
  isDeliveredByAgency
}
```

Never exposes: `storageKey`, bucket, internal paths.

## Categories

Brand Assets, Content, Images, Documents, Deliverables, Other — inferred from filename/MIME.

## Filters

- Search (`q`)
- Project (`projectId`)
- Category

## Authorization

Every download goes through `/api/agency/files/[id]` with session authorization.

## Upload

No global arbitrary upload. Upload only through supported flows (onboarding, requirements) with project context.
