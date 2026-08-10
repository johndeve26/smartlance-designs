# UI Legacy Migration Tracker

Last updated: V1.2 pass (Aug 2026)

## Summary

| Metric | V1.1 (before) | V1.2 (after) |
|--------|--------------:|-------------:|
| `admin-card` in `app/admin/**/page.tsx` | 48 | **0** |
| `admin-card` in `components/**/*.tsx` (active usage) | 31 | **0** (1 comment in AdminPanel.tsx) |
| `admin-card` total `.tsx` references | 79 | **1** (comment only) |
| Admin pages using `AdminListPage` | 6 | **37** |

**Verdict:** `SMARTLANCE UX/UI REDESIGN V1.2 COMPLETE — ADMIN EXPERIENCE VISUALLY UNIFIED`

Minor legacy class usage (`admin-btn`, `admin-input`) remains in some embedded form components and 5 CMS editor pages — visual only via shared CSS tokens; no operational page shells use `admin-card`.

---

## Phase A — CRM / Sales ✅

| Module | Pages | Status |
|--------|------:|--------|
| CRM overview | 1 | ✅ AdminStatGrid + AdminSection |
| Contacts list | 1 | ✅ AdminListPage + DataTable |
| Contact detail | 1 | ✅ AdminDetailHeader + AdminPanel sections |
| Contact new | 1 | ✅ AdminPanel form |
| Contact edit | 1 | ✅ Migrated |
| Contact import | 1 | ✅ Workflow wizard with AdminPanel |
| Companies list/detail/new | 3 | ✅ |
| Leads list/detail | 2 | ✅ |
| Deals list/detail | 2 | ✅ |
| Sales Inbox | 1 | ✅ Workflow layout preserved |
| Inbox thread/message detail | 2 | ✅ |
| Tasks | 1 | ✅ |
| Sequences list/detail | 2 | ✅ |
| Segments list/detail | 2 | ✅ |
| Imports list/detail | 2 | ✅ |
| Outreach | 1 | ✅ |
| Email templates | 1 | ✅ |
| Properties settings | 2 | ✅ |

**CRM migrated:** 24 / 24 operational pages

---

## Phase B — Agency Delivery ✅

| Module | Status |
|--------|--------|
| Agency hub | ✅ |
| Projects list/detail/new | ✅ |
| Onboarding list/detail | ✅ |
| Onboarding templates | ✅ |
| Change requests list/detail | ✅ |
| Agency templates | ✅ |

**Agency delivery migrated:** 15 / 15

---

## Phase C — Commercial ✅

| Module | Status |
|--------|--------|
| Proposals list/detail/new | ✅ |
| Contracts list/detail/new | ✅ |
| Contract templates | ✅ |
| Billing landing | ✅ |
| Invoices list/detail/new | ✅ |
| Payments | ✅ |
| Retainers | ✅ |

**Commercial migrated:** 12 / 12

---

## Phase D — Client Success ✅

| Module | Status |
|--------|--------|
| Managed websites list/detail/new | ✅ |
| Support list/detail | ✅ |

**Client success migrated:** 5 / 5

---

## Phase E — CMS / Content ✅

| Module | Status |
|--------|--------|
| Services list | ✅ (V1.1) |
| Blog / Insights list | ✅ (V1.1) |
| Work list | ✅ (V1.1) |
| Industries list | ✅ (V1.1) |
| Platforms list/detail | ✅ |
| Solutions list/detail | ✅ |
| Resources hub + type lists | ✅ |
| Testimonials list/detail | ✅ |
| Homepage editor | ✅ |
| Content audit | ✅ |
| Enquiries | ✅ |
| Audience | ✅ |

**Content migrated:** all list pages; detail editors use AdminPanel two-column layout

---

## Phase F — Marketing / System ✅

| Module | Status |
|--------|--------|
| SEO | ✅ |
| Redirects | ✅ |
| Navigation | ✅ |
| Media list/detail | ✅ |
| Users | ✅ (V1.1) |
| Email | ✅ PageHeader + AdminPanel panels |
| Audit log | ✅ (V1.1) |
| Settings | ✅ sectioned AdminPanel |
| AI Writer (~11 routes) | ✅ PageHeader + AdminPanel |
| Admin login | ✅ design-system form |

---

## Shared components migrated

- All `components/admin/agency/*` panels → AdminPanel
- CRM panels (ContactListFilters, ContactCsvImportWizard, PropertyDefinitions, etc.) → AdminPanel
- InboundMailboxSettingsPanel → AdminPanel
- LoginForm → Button + Input + Alert

## Deprecated components (unchanged)

- `CrmSubNavBar` — returns null; imports removed from pages
- `AgencySubNavBar` — returns null; imports removed from pages

## Legacy CSS retained (low usage)

`.admin-btn`, `.admin-input`, `.admin-field` in `components/admin/admin.css` — still referenced by ~68 component files (mostly embedded server-action forms in CMS detail editors). Safe to remove in a future cleanup pass when those forms migrate to shared Input/Button.

---

## Exit criteria

- [x] CRM operational pages migrated
- [x] Agency delivery pages migrated
- [x] Commercial flow pages migrated
- [x] Client success pages migrated
- [x] CMS list pages migrated
- [x] System pages migrated
- [x] Zero `admin-card` in active admin page routes
- [x] Full regression pass (vitest, tsc, build, prisma validate)

---

## Next cleanup (optional, post-V1.2)

1. Migrate remaining `admin-btn` / `admin-input` in CMS detail form components to shared Button/Input
2. Remove `.admin-card` CSS rule when comment-only reference remains
3. Delete deprecated CrmSubNavBar / AgencySubNavBar files after confirming zero imports
