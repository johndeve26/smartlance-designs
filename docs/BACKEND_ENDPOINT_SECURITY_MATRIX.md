# Backend Endpoint Security Matrix

Every server entry point in the application. Verified by source review during the backend audit.

Legend: **Auth** = requires an authenticated admin session · **Perm** = capability required · **Origin** = same-origin/CSRF protection · **RL** = rate limited · **PII** = handles personal data.

---

## HTTP route handlers (`app/**/route.ts`)

| Method | Path | Auth | Perm | Validation | Origin | RL | DB write | External call | PII | Side effect | Tested |
|---|---|---|---|---|---|---|---|---|---|---|---|
| POST | `/api/contact` | No — public | — | Zod `contactFormSchema` | N/A (public JSON API) | Yes, per IP hash | Yes — `Enquiry` | Resend / webhook | Yes | Persist + notify | Yes |
| POST | `/api/website-review` | No — public | — | Zod `websiteReviewSchema` | N/A | Yes, per IP hash | Yes — `Enquiry` | Resend / webhook | Yes | Persist + notify | Yes |
| GET | `/api/admin/media` | Yes | `manage_media` | Zod query schema (added BE-08) | Session cookie | No | No | No | No | Read only | Partial |
| GET | `/api/media/[...key]` | No | — | Path traversal guards | N/A | No | No | No | No | Reads local file | Yes |
| GET | `/api/internal/redirect-lookup` | No — header gated | — | Path prefix check | `x-internal-redirect` header | No | No | No | No | Read only | No |
| GET | `/indexnow-key.txt` | No — public by design | — | N/A | N/A | No | No | No | No | Serves verification key | Yes |

**Notes**

- `/api/media/[...key]` returns 404 in production unless `MEDIA_ALLOW_LOCAL_IN_PRODUCTION=1`. It is a development adapter.
- `/api/internal/redirect-lookup` is called by the proxy. Its header gate is not a secret, but it exposes only redirect destinations, which are observable anyway by following the redirect.
- Public form endpoints are CSRF-irrelevant: they are unauthenticated and carry no ambient authority.
- Both public POST endpoints persist before notifying, so an email outage cannot lose an enquiry.

---

## Server Actions (`"use server"`)

115 exported actions across 11 modules. Every one requires an authenticated session except the two auth entry points, and every mutating module calls `assertSameOrigin()`.

| Module | Actions | Auth | Perm | Origin | Notes |
|---|---|---|---|---|---|
| `auth-actions.ts` | 2 | Public by necessity | — | Yes | `loginAction`, `logoutAction`. Login is rate limited per account and per source address; the rejection path performs equivalent Argon2 work so timing does not reveal account existence. |
| `user-actions.ts` | 3 | Yes | `manage_users` (SUPER_ADMIN only) | Yes | Role parser restricted to four known values. Last-Super-Admin guard runs under `Serializable` isolation. |
| `content-actions.ts` | 19 | Yes | `edit_draft` / `publish` / `slug_redirect` / `preview` | Yes | No publish path accepts `edit_draft`. |
| `bulk-content-actions.ts` | 10 | Yes | `publish` / `edit_draft` | Yes | `bulkPublishAction` and `bulkArchiveAction` are thin wrappers over the guarded `bulkContentStatusAction`. |
| `phase3-actions.ts` | 19 | Yes | `edit_draft` / `publish` / `verify_testimonial` | Yes | Insights, Work, Resources, Industries, Testimonials. |
| `phase4-actions.ts` | 13 | Yes | `manage_media` / `manage_navigation` / `manage_redirects` / `manage_settings` / `settings_critical` | Yes | Manual redirects run loop detection. |
| `enquiry-actions.ts` | 6 | Yes | `view_enquiries` / `manage_enquiries` / `export_enquiries` / `enquiry_destructive` | Yes | PII. Export is capped, CSV-escaped, and audited. |
| `ai-writer-actions.ts` | 25 | Yes | `use_ai_writer` / `manage_ai_settings` | Yes | External LLM calls. |
| `ai-provider-actions.ts` | 3 | Yes | `manage_ai_settings` | Yes | Keys encrypted before storage; only last-4 returned. |
| `ai-content-assistant-actions.ts` | 4 | Yes | `use_ai_writer` + `edit_draft` | Yes (added BE-04) | Decision payload Zod-validated (BE-07). Entity resolved server-side from the proposal row. |
| `topic-intelligence-actions.ts` | 11 | Yes | `use_ai_writer` | Yes | External research calls, now timeout-bounded. |

**No Server Action is intentionally public other than `loginAction` and `logoutAction`.**

---

## Authorization model

Four roles, 23 capabilities. Capability sets are defined once in `lib/admin/rbac.ts` and enforced server-side via `requireAdminUser(capability)`; UI filtering is cosmetic only.

| Capability | SUPER_ADMIN | EDITOR | CONTENT_MANAGER | REVIEWER |
|---|---|---|---|---|
| `edit_draft` | Yes | Yes | Yes | No |
| `publish` | Yes | Yes | No | No |
| `preview` | Yes | Yes | Yes | Yes |
| `manage_users` | Yes | No | No | No |
| `slug_redirect` | Yes | Yes | No | No |
| `verify_testimonial` | Yes | Yes | No | No |
| `manage_media` | Yes | Yes | Yes | No |
| `media_permanent_delete` | Yes | No | No | No |
| `manage_navigation` | Yes | Yes | Yes | No |
| `manage_redirects` | Yes | Yes | No | No |
| `manage_settings` | Yes | Yes | No | No |
| `settings_critical` | Yes | No | No | No |
| `manage_seo` | Yes | Yes | Yes | No |
| `view_enquiries` | Yes | Yes | No | No |
| `manage_enquiries` | Yes | Yes | No | No |
| `export_enquiries` | Yes | No | No | No |
| `enquiry_destructive` | Yes | No | No | No |
| `use_ai_writer` | Yes | Yes | Yes | No |
| `manage_ai_settings` | Yes | Yes | No | No |
| `approve_ai_cms` | Yes | Yes | Yes | No |
| `run_link_health` | Yes | Yes | No | No |
| `view_audit` | Yes | Yes | Limited | Limited |
| `view_system` | Yes | Yes | Yes | Yes |

The four capabilities that matter most for containment — `manage_users`, `media_permanent_delete`, `settings_critical`, `enquiry_destructive` — are exclusive to `SUPER_ADMIN`. An Editor cannot become an Admin.

---

## Other server surfaces

| Surface | Path | Protection |
|---|---|---|
| Proxy auth gate | `proxy.ts` | Presence check on the session cookie, plus `Cache-Control: no-store` and `X-Robots-Tag: noindex` on all `/admin` responses. **Not** the authorization boundary — every admin page and action independently calls `requireAdminUser`. |
| Draft preview | `/admin/preview/[entity]/[id]` | Session **or** HMAC token bound to entity type and ID, 2-hour TTL, constant-time comparison, `robots: noindex`. |
| Sitemap / robots | `app/sitemap.ts`, `app/robots.ts` | Published content only. |

**Inbound webhooks: none. Cron endpoints: none. Payment endpoints: none.** Nothing external can trigger a state change without an authenticated session, other than the two public enquiry forms.
