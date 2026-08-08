# AI Writer Security Review

## Release blockers (must remain false)

- [ ] AI can auto-publish
- [ ] Enquiry / EnquiryNote / passwords enter AI context
- [ ] Fake/invented sources accepted
- [ ] Unsupported statistics pass approval without override
- [ ] `javascript:` / private IP URLs accepted
- [ ] Research SSRF (localhost, 169.254.169.254, private ranges, redirect-to-private)
- [ ] AI bypasses Insight `edit_draft` / publish RBAC
- [ ] Long jobs silently disappear without durable run status
- [ ] CMS handoff overwrites newer human edits without warning
- [ ] Provider secrets shown in full in Admin / System Status / logs

## Controls implemented

- Admin-managed provider API keys encrypted at rest (AES-256-GCM); UI shows last 4 only; never ciphertext/plaintext in responses
- Encryption master key is env-only (`AI_SECRETS_ENCRYPTION_KEY` or `ADMIN_SESSION_SECRET`); rotating requires re-entering provider keys
- Env fallback keys still supported when Admin key is empty
- `sandboxUntrustedText` for research/draft DATA framing
- SSRF: `lib/ai/ssrf.ts` (scheme, private IP, userinfo, redirect checks, size/timeout)
- Claim evidence strength DIRECT/PARTIAL/CONTEXTUAL/INSUFFICIENT
- Hard blockers for fake Smartlance metrics/certs; checklist required for approval
- Reviewer cannot `use_ai_writer`; provider keys & settings require `manage_ai_settings`
- Provider base URL overrides are Admin-editable only with `manage_ai_settings`; audited on change
- Key set/clear and provider assignment audited (no secret material in audit metadata)

## Privilege boundary

AI may: read published site knowledge, read/write AI project data.  
AI may not: publish, delete CMS, manage users, read enquiries, change Site Settings secrets, export PII.
