# Onboarding Files & Access

## Private files

Reuses `AgencyProjectFile` + private storage (`lib/agency/files.ts`, `lib/agency/private-storage.ts`).

`AgencyOnboardingFileSubmission` links uploads to onboarding questions/requirements. Authorization: portal session + project access + onboarding belongs to project.

## File policy

Existing V1 MIME/size/extension restrictions apply. Uploading does not auto-accept — admin review required.

## Access requests

`AgencyClientRequirement` type `ACCESS` with safe metadata:

- `serviceName`, `accessType`, `accountIdentifier`, `instructions`, `inviteEmail`, `clientNote`
- Client marks "I've sent the invitation" — no secret collection in forms

## Visibility

Internal review notes are admin-only. Portal DTOs exclude `internalNotes` on onboarding.
