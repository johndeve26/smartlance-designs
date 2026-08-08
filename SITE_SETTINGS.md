# Site Settings

## Source of truth

After Phase 4 import, PostgreSQL `SiteSettings` (id=`site`) is authoritative for public contact, social, SEO defaults, analytics public IDs, form toggles, and public pricing visibility.

Typed fallbacks in `lib/site.ts` / `fallbackPublicSiteSettings()` remain only for uninitialized DB.

Public reads: `getPublicSettings()` (`lib/repositories/siteSettingsRepository.ts`) with cache tag `site-settings`.

Admin writes: `updateSiteSettings()` → Zod validation → revision snapshot → audit → `revalidateSiteSettings()`.

## Groups in Admin (`/admin/settings`)

- General
- Contact
- Brand (logo assets via MediaPicker; **brand colors stay code-managed**)
- Social (verified Instagram only seeded)
- SEO defaults
- Analytics public IDs
- Forms (enable/disable Super Admin)
- Advanced (canonical host, public pricing — Super Admin)

## Env vs DB

| Kind | Where |
| --- | --- |
| Public contact email/phone, Instagram URL, GA/GTM/Clarity IDs, form copy | DB |
| `DATABASE_URL`, auth secrets, Resend/webhook keys, S3 secrets | Environment only — Admin shows Configured / Not configured |

## Permissions

- `manage_settings`: Editor+
- `settings_critical`: Super Admin (canonical host, disable forms, enable public pricing, permanent redirect delete)

## Forms and Phase 5

- `contactFormEnabled` / `freeReviewFormEnabled` gate public POST handlers and public page fallback UI.
- Provider credentials remain env secrets; Admin System distinguishes **Configured** vs delivery failures.
- Enquiry retention durations are **not** invented in Site Settings — Super Admin uses anonymize/delete manually (`ENQUIRY_PRIVACY.md`).
