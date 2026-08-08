# Production release checklist

Operator checklist before/after production cutover. Check boxes in your run tracker.

## AUTH

- [ ] Login works; logout revokes DB session
- [ ] Disabled user cannot use existing session
- [ ] Last Super Admin cannot be demoted/disabled
- [ ] Rate limit on failed logins
- [ ] Cookies HttpOnly + Secure (prod) + SameSite=Lax

## CMS / PUBLISHING

- [ ] Draft not on public/sitemap
- [ ] Preview requires auth/token; noindex
- [ ] Publish/unpublish/revision restore works for a sample family
- [ ] Slug change creates 301

## MEDIA

- [ ] Production uses S3-compatible storage (not local)
- [ ] Upload rejects SVG / fake MIME / oversized
- [ ] In-use delete blocked or confirmed
- [ ] Storage failure does not leave silent success

## NAVIGATION / SETTINGS / REDIRECTS

- [ ] Header/footer match Admin published menus
- [ ] Contact details from Site Settings
- [ ] No redirect loops on critical paths
- [ ] Sample legacy blog redirect resolves

## SEO / LINK HEALTH

- [ ] Canonical host = production host (no localhost/preview)
- [ ] Sitemap has no `/admin`, drafts, or enquiries
- [ ] Robots/preview noindex strategy understood
- [ ] Link Health critical broken/unpublished destinations reviewed

## FORMS / ENQUIRIES

- [ ] One Contact test: DB + Admin + notification
- [ ] One Review test: same
- [ ] Notification failure leaves record FAILED (no visitor resubmit)
- [ ] Enquiry RBAC: Content Manager/Reviewer cannot view PII
- [ ] Export Super Admin only; formula-safe

## AI EDITORIAL STUDIO

- [ ] `OPENAI_API_KEY` (or `AI_PROVIDER_API_KEY`) set if generation is required
- [ ] System Status shows AI / Research Configured or Not Configured (no secrets)
- [ ] Sample project: research → brief → draft → fact check → Approve → Insight DRAFT only
- [ ] Confirm AI Writer cannot publish without existing publish RBAC
- [ ] Reviewer cannot use AI Writer generation
- [ ] Mock golden evaluation suite green (`/admin/ai-writer/evaluations` or Vitest)
- [ ] SSRF: private/metadata URLs rejected
- [ ] Claim Ledger blocks unsupported stats / fake Smartlance claims
- [ ] Controlled 3–5 project pilot completed before routine publishing (`AI_WRITER_PILOT_REPORT.md`)
- [ ] Verdict remains READY WITH EDITORIAL CONDITIONS until pilot done

## PRIVACY / LEGAL

- [ ] Technical privacy controls verified
- [ ] **HUMAN REVIEW REQUIRED** — Privacy Statement legacy sections
- [ ] **HUMAN REVIEW REQUIRED** — Terms / Accessibility Statement if still legacy
- [ ] Retention duration not invented — policy decision pending if needed

## BACKUP / RECOVERY

- [ ] DB backup/PITR verified in provider console
- [ ] Media backup/versioning status documented
- [ ] Non-prod restore test performed or scheduled
- [ ] `DISASTER_RECOVERY.md` reviewed by operator

## DEPLOYMENT

- [ ] Env validated (`ENVIRONMENT.md`)
- [ ] `npx prisma migrate deploy` succeeded
- [ ] No one-time import `--force` on this deploy
- [ ] `npm run smoke:public` against production base URL
- [ ] System Status shows no false healthy for DB/media/email
