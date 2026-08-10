# Client Success Access Control

## Invariants

1. Portal authentication required
2. Explicit website grant required (same company alone insufficient)
3. Support visibility scoped to authorized websites
4. Revocation is immediate across all surfaces

## Authority functions

**Website** (`lib/client-success/website-access.ts`):

- `websiteRoleCanView`
- `websiteRoleCanSubmitSupport`
- `websiteRoleCanRespondSupport`

**Support** (`lib/client-success/support.ts`):

- `portalSupportCanView` / `assertSupportView`
- `assertSupportReply`

## Independence

| Grant | Does NOT grant |
|-------|----------------|
| Website access | Billing, contracts, proposals, project history |
| Project access | Website access |
| Billing access | Website access |

## File access

`canAccessAgencyFile` extended for support attachments via website grant or submitter relationship.
