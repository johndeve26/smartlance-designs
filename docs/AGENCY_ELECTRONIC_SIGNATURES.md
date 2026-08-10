# Electronic Signatures

## What the client provides

- Explicit consent (unchecked by default; consent text snapshotted)
- Typed full legal name (signature representation)
- Optional title

## What the server determines

- Signer identity (portal session / admin session)
- Current contract version
- Whether signing is allowed (status, expiry, void)
- Document `contentHash` at sign time
- `signedAt` (server timestamp)

## Signature record

`AgencyContractSignature` stores:

- Signer identity snapshots (name, email)
- Typed signature name
- Consent text and version
- `contractContentHash`
- Optional hashed IP / user agent (supporting evidence only)

One signature per `(contractVersionId, signerId)`.

## Multi-signer

Required signers must all sign for `SIGNED` status. Partial progress uses `PARTIALLY_SIGNED`. Parallel signing is supported in V2.1.

## Evidence boundaries

| Evidence | Meaning |
|----------|---------|
| Typed name | User-entered signature representation |
| Content hash | Snapshot integrity — not a legal signature |
| IP hash | Supporting technical evidence — not identity proof |

Do **not** label records as "legally certified" unless an external qualified provider supplies certification.

## UI labels

Use **Electronic Signature Record** or **Signature Record**, not "Legally Certified Certificate."

## PDF

Deferred to V2.1.1 unless existing PDF tooling is integrated. Authoritative record is the canonical web snapshot.
