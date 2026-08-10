# Contract Security

## Access control

- **Admin:** RBAC capabilities `view_contracts`, `manage_contracts`, `send_contracts`, `sign_contracts`, `manage_contract_templates`
- **Portal:** Explicit `AgencyContractClientAccess` + signer relation
- Same-company contact without contract access: **denied**
- Proposal access alone: **insufficient**
- Project access alone: **insufficient**

## Mutations

Admin actions use `assertSameOrigin()` + RBAC. Portal actions use existing portal session/CSRF protection.

## Tamper protection

- Browser does not submit authoritative contract body or hash
- Signer `contactId` / `portalUserId` from session, not form fields
- `signedAt` server-generated

## XSS

Contract content and correction comments render as sanitized/plain text. Template variables are escaped on merge.

## Privacy

- No public contract routes
- Portal remains `noindex`
- Signed contracts stay private after project completion
- Portal DTO excludes internal notes, audit data, CRM internals

## Rate limiting

Reuse existing infrastructure for signing attempts and invite resend.

## Void vs sign race

Signing uses row lock (`FOR UPDATE`) and status checks. Voided contracts reject new signatures.

## Access revocation

Revoking `AgencyContractClientAccess` prevents future views/signing even with an active portal session.
