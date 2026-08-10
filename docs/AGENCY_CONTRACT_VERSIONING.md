# Contract Versioning

## Model

`AgencyContractVersion` stores title, content, `contentHash`, `resolvedVariables`, `publishedAt`, and proposal acceptance references.

## Sent immutability

Once `publishedAt` is set (contract sent to signers), the version **cannot be edited**. Any change requires a new version.

## Signed immutability

Fully signed versions are permanent historical snapshots. Never rewrite or delete them in normal admin flows.

## New version flow

1. Admin creates new version (copies prior content/signers as pending)
2. Contract returns to `DRAFT`
3. Admin edits draft
4. Admin sends — new version is published; prior version is superseded

## Superseded versions

Old versions remain readable. Sign actions on superseded versions are rejected. Signatures on V1 do **not** apply to V2.

## Content hash

`contentHash` is SHA-256 over normalized content plus contract ID, version number, acceptance ID, scope hash, and resolved variables. It is integrity evidence, not a digital signature.

See `lib/contracts/content-hash.ts` for normalization rules.
