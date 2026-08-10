# Client Requirements (Onboarding Integration)

V3 **extends** `AgencyClientRequirement` — no parallel requirement table.

## Additive fields

`onboardingId`, `onboardingSectionId`, `sourceTemplateKey`, `required`, `assignedContactId`, review notes, `accessMetadataJson`.

## Statuses

Extended: `SUBMITTED`, `UNDER_REVIEW`, `NEEDS_CLARIFICATION` (plus existing `REQUESTED`, `RECEIVED`, `ACCEPTED`, `NOT_NEEDED`).

Completion counts `ACCEPTED` and `NOT_NEEDED` for required items.

## Dedupe

Template instantiation uses `sourceTemplateKey` per onboarding. Existing project requirements with the same key are linked, not duplicated.

## ACCESS type

Invitation/collaborator workflow only — **no password fields**. `assertNoSecretFields` blocks credential-like metadata keys.
