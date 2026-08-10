# Onboarding Questionnaires

## Structure

Snapshotted `AgencyOnboardingSection` + `AgencyOnboardingQuestion` + `AgencyOnboardingResponse`.

## Field types

`SHORT_TEXT`, `LONG_TEXT`, `EMAIL`, `PHONE`, `URL`, `NUMBER`, `DATE`, `SINGLE_SELECT`, `MULTI_SELECT`, `BOOLEAN`, `FILE_REQUEST`.

Server validates all responses (`lib/onboarding/responses.ts`). Browser does not determine type/required/options.

## Partial save

Clients save individual answers via portal actions. Final submission requires all required items.

## Review

Response review statuses: `PENDING`, `ACCEPTED`, `NEEDS_CLARIFICATION`. Required items count toward completion only when **accepted** (files always require acceptance).

Stale review protection uses `expectedUpdatedAt` optimistic checks.
