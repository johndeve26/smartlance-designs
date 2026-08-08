# Admin Permissions

Server enforces every mutation. Never trust the client UI.

## Roles

| Role | Intent |
| --- | --- |
| `SUPER_ADMIN` | Full control including user management |
| `EDITOR` | Edit drafts, publish, slug+redirect |
| `CONTENT_MANAGER` | Edit drafts + preview; no publish / slug change |
| `REVIEWER` | Preview + limited audit; no edits |

## Capability matrix (Phase 1–5)

| Capability | SUPER_ADMIN | EDITOR | CONTENT_MANAGER | REVIEWER |
| --- | --- | --- | --- | --- |
| Login / dashboard | yes | yes | yes | yes |
| Edit draft content | yes | yes | yes | no |
| Publish / unpublish | yes | yes | no | no |
| Preview drafts | yes | yes | yes | yes |
| Manage Admin users | yes | no | no | no |
| Slug change + redirect | yes | yes | no | no |
| View audit log | yes | yes | limited | limited |
| Verify testimonials | yes | yes | no | no |
| Manage media | yes | yes | yes | no |
| Permanent media delete | yes | no | no | no |
| Manage navigation | yes | yes | yes (draft) | no |
| Manage redirects | yes | yes | no | no |
| Manage settings | yes | yes | no | no |
| Critical settings (host/forms/pricing) | yes | no | no | no |
| SEO ops / managed pages | yes | yes | yes | no |
| Run link health | yes | yes | no | no |
| View system status | yes | yes | yes | yes |
| View enquiries (PII) | yes | yes | no | no |
| Manage enquiries (status/notes/spam/retry) | yes | yes | no | no |
| Export enquiries CSV | yes | no | no | no |
| Anonymize / permanently delete enquiries | yes | no | no | no |
| Use AI Writer (generate/edit projects) | yes | yes | yes | no |
| Manage AI settings / brand voice | yes | yes | no | no |
| Approve AI project for CMS | yes | yes | yes | no |

**Enquiries:** personal contact data is restricted to Super Admin and Editor. Content Manager and Reviewer have no enquiry PII access by default.

**AI Writer:** never grants publish. Creating Insight drafts still requires `edit_draft`. Reviewers can view System Status AI provider labels but cannot run generation.

**AI Content Assistants (Service / Solution / Platform / Industry / Work / Testimonial / Guide / Comparison / Checklist / Glossary / Template / Tool / Homepage):** require **both** `use_ai_writer` and `edit_draft`. AI cannot exceed CMS edit rights. Accepted proposals write drafts/revisions only — publish remains separate (`publish` for Homepage publish). Checklist/Template/Tool technical IDs and Tool scoring are protected. Topic Intelligence commercial, Work, Homepage, and resource-expand handoffs open the CMS assistant; they do not grant publish.

**Limited audit:** content entity types only — not user-management events.

**Testimonials:** public render requires `verified=true` **and** `PUBLISHED`. Unverified cannot be published.

## Implementation

- Capability helpers: `lib/admin/rbac.ts` (`can`, `assertCan`)
- Session gate: `requireAdminUser(capability?)` in `lib/admin/session.ts`
- Actions call `assertSameOrigin()` then `requireAdminUser(...)` before repository writes
- Disabled users cannot authenticate; disabling a user revokes all sessions

## Bootstrap

```bash
ADMIN_BOOTSTRAP_EMAIL=...
ADMIN_BOOTSTRAP_PASSWORD=...   # min 12 chars
npm run admin:bootstrap
```

Creates the first `SUPER_ADMIN` only when zero admin users exist. There is **no** `/admin/register`.
