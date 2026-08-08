# Phase 4 Completion

Site operations control center for Media, Navigation, Redirects, Settings, SEO health, Link health, and System status — built on Phases 1–3 without redesigning public UI.

## MEDIA

- Storage abstraction: `MediaStorageProvider` with local (dev) + S3-compatible adapters
- `MediaAsset` model + usage tracking + archive/delete safety
- `/admin/media` grid, upload, detail, MediaPicker for OG/brand fields
- Static existing assets registered (not moved); SVG uploads blocked
- Formats: JPEG, PNG, WebP, AVIF, GIF

## NAVIGATION

- `NavigationMenu` by controlled `NavigationMenuKey` with draft/publish JSON items
- Import from `data/navigation.ts`; public `SiteHeader`/`SiteFooter` read published DB with code fallback
- Validation: unsafe schemes, unpublished destinations, redirect warnings
- Header CTA + footer groups managed; no mega-menu designer

## REDIRECTS

- `/admin/redirects` on existing `Redirect` model + `origin` (SLUG_CHANGE / LEGACY_MIGRATION / MANUAL)
- Loop detection, chain test tool, prefer disable over delete
- Slug-change workflow unchanged (`upsertSlugRedirect`)

## SITE SETTINGS

- Expanded `SiteSettings`; public via `getPublicSettings()`
- Contact/social/SEO defaults/analytics IDs/form toggles/public pricing/canonical host
- Secrets never shown; env status labels only
- Brand colors remain code-managed

## SEO

- Inventory + deterministic issues (no score)
- `ManagedPage` for known code-backed routes

## LINK HEALTH

- On-demand runs with stored summary/issues

## SYSTEM

- `/admin/system` configuration status panel

## MIGRATION

```bash
npx prisma migrate deploy
npm run content:import:phase4
```

Marker: `ContentImportMarker` id=`phase4`. Re-run skips unless `--force` (explicit warning).

## QA

- Vitest includes Phase 4 media/url/rbac/storage tests
- Run: `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`

## Deferred to Phase 5

Contact / Free Website Review enquiry management, CRM, newsletter, booking, cost-calculation Admin UIs.
