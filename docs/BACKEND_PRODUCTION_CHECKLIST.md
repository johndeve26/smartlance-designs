# Backend Production Checklist

Operational checks that code cannot verify. Nothing here was performed by the backend audit — each item needs a human with production access.

Status column: mark `[ ]` unverified, `[x]` verified with a date and who checked.

---

## 1. Database

- [ ] **Automated backups are enabled** and the retention window is known.
- [ ] **A restore has actually been performed** into a scratch database. An untested backup is not a backup.
- [ ] Backup restore time is known and acceptable.
- [ ] `DATABASE_URL` points at production; `DIRECT_URL` is set if the pooler does not support migrations.
- [ ] Connection pool limits are appropriate for the number of serverless instances.
- [ ] **If the database ever moves off Neon**, note that Node 24 treats `sslmode=require` as `verify-full`. A host using self-signed or private-CA certificates will fail to connect with the same connection string that works today. Setting `sslmode=verify-full` explicitly documents the effective behavior.
- [ ] **Before any future migration:** take a fresh backup, review the SQL for destructive statements, and prefer additive changes.

The audit performed no migration and created none. The schema is valid and 15 migrations are applied cleanly.

---

## 2. Secrets and environment

- [ ] `ADMIN_SESSION_SECRET` is **≥32 random characters**. Production start-up fails without it, so verify it is present rather than assuming.
- [ ] `AI_SECRETS_ENCRYPTION_KEY` is **set explicitly**, not inherited from `ADMIN_SESSION_SECRET`.

  > This one matters more than it looks. Provider API keys are AES-256-GCM encrypted with key material derived from `AI_SECRETS_ENCRYPTION_KEY`, falling back to `ADMIN_SESSION_SECRET`. If you ever rotate the session secret while relying on that fallback, every stored provider key silently becomes undecryptable and the system quietly falls back to environment keys. Setting a dedicated key decouples the two rotations.

- [ ] `ADMIN_PREVIEW_SECRET` is set (optional — falls back to the session secret, which is acceptable).
- [ ] `NEXT_PUBLIC_SITE_URL` is the real production origin. Start-up rejects localhost and `vercel.app`.
- [ ] `ADMIN_BOOTSTRAP_EMAIL` and `ADMIN_BOOTSTRAP_PASSWORD` are **removed** from the environment after the first Super Admin exists.
- [ ] `ALLOW_FORM_LOG_FALLBACK` is **not** set in production.
- [ ] `NEXT_PUBLIC_SHOW_DRAFT_CONTENT` is **not** `true`. Start-up rejects it.
- [ ] `MEDIA_ALLOW_LOCAL_IN_PRODUCTION` is **not** set.

**Rotation plan.** Rotating `ADMIN_SESSION_SECRET` invalidates every active session — all admins must log in again. If `AI_SECRETS_ENCRYPTION_KEY` is not set separately, rotation also destroys stored provider keys and they must be re-entered.

---

## 3. Object storage

- [ ] `MEDIA_STORAGE_PROVIDER=s3`. Start-up rejects local storage in production, but confirm the S3 credentials actually work by uploading through the Admin UI.
- [ ] The bucket is **not publicly listable**. Objects may be public-read; the bucket index must not be.
- [ ] `MEDIA_S3_ACCESS_KEY_ID` / `MEDIA_S3_SECRET_ACCESS_KEY` are scoped to this bucket only, with no wildcard account access.
- [ ] `MEDIA_MAX_UPLOAD_MB` is set intentionally (defaults to 8, hard-capped at 25).
- [ ] Confirm `/api/media/[...key]` returns 404 in production — it is a development-only adapter.

---

## 4. Email and notifications

- [ ] `RESEND_API_KEY` is set, **or** a webhook URL is configured.
- [ ] `CONTACT_TO_EMAIL` / `CONTACT_FROM_EMAIL` are set, or the equivalents in Site Settings.
- [ ] The sending domain passes **SPF and DKIM** — otherwise notifications land in spam and enquiries look lost even though they are stored.
- [ ] Submit one real test enquiry and confirm the email arrives.
- [ ] Confirm the enquiry appears in Admin **even if** the email fails. This is guaranteed by design — persistence happens before notification — but verify it once.

---

## 5. AI and research providers

- [ ] Provider keys are entered through Admin (encrypted at rest) rather than environment variables where possible.
- [ ] Connection test passes for each enabled provider.
- [ ] Spend limits or billing alerts are configured **at the provider**. The application caps tokens and concurrency but has no hard spend ceiling.
- [ ] `TAVILY_API_KEY` is set if live research is expected; otherwise research runs in manual-source mode.
- [ ] Confirm no provider key appears in any client-side response. Verified in code — only the last four characters are exposed.

---

## 6. Rate limiting and edge

- [ ] **Decide whether per-instance rate limiting is sufficient.** The limiter is in-process, so on serverless the effective limit is roughly `configured_limit × instance_count`.
- [ ] If not sufficient, add Cloudflare (or platform) rate limiting in front of:
  - `/admin/login` — brute force
  - `/api/contact` and `/api/website-review` — spam
- [ ] Confirm the proxy sets `X-Forwarded-For` consistently. The application trusts the leftmost entry for rate-limit bucketing only, never for authorization.

---

## 7. Monitoring and observability

- [ ] **Error alerting exists.** There is currently no Sentry-equivalent, so failures are visible only in runtime logs and nothing pages anyone.
- [ ] Someone owns reviewing failures for: database errors, provider failures, email delivery failures, unexpected 500s.
- [ ] Set up an alert on enquiry notification failures. `notificationStatus: "FAILED"` is recorded on the row and `countNotificationFailures()` already exists to surface it.
- [ ] Confirm hosting execution timeouts are long enough for AI research runs, which are the longest operations in the system.

---

## 8. Security posture

- [ ] Review admin accounts. Remove anyone who no longer needs access.
- [ ] Confirm **at least two active Super Admins** exist. The last-Super-Admin guard prevents lockout, but a second account is the practical safety net.
- [ ] Confirm security headers are served as expected in production.
- [ ] Confirm `/admin` responses carry `Cache-Control: no-store` and `X-Robots-Tag: noindex` — set by the proxy.
- [ ] Confirm the sitemap contains no draft or admin URLs.

---

## 9. Dependencies

- [ ] `npm audit` reviewed. Current state: **one high-severity advisory in `image-size` with no upstream fix** (infinite loops in ICNS, JXL, and HEIF parsers).
- [ ] **Track `image-size` for a patched release** and upgrade when one ships.

  > Reachability was mitigated in BE-09: HEIF's generic `mif1` brand was being accepted as AVIF, which let a crafted file reach the vulnerable parser. Only the true AVIF major brands are accepted now, and ICNS and JXL never passed magic-byte sniffing. Exploitation also required an authenticated admin with `manage_media`.

- [ ] Do not run `npm audit fix --force`. It will attempt breaking major upgrades.

---

## 10. Not applicable

Confirmed absent from this codebase — nothing to check.

- Inbound webhooks
- Cron or scheduled job endpoints
- Payment processing
- Custom CORS configuration (same-origin only)
- Self-service password reset

---

## Post-deploy smoke test

1. Log in to `/admin`; confirm the session persists across a refresh.
2. Log out; confirm the session is rejected afterwards.
3. Save a homepage draft; confirm the **public homepage is unchanged**.
4. Open the draft preview; confirm it shows the draft.
5. Publish; confirm the public homepage updates.
6. Submit a contact enquiry; confirm it appears in Admin and the notification arrives.
7. Rename a published Service slug; confirm the old URL redirects and the **new URL loads without a redirect loop** (BE-03).
8. Generate and apply an AI proposal; confirm it lands on the draft and does **not** publish.
9. Upload an image; confirm a `.svg` and a mismatched-extension file are both rejected.
10. As a non-Super-Admin, confirm `/admin/users` is inaccessible.
