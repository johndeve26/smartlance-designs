# Onboarding Templates

## Models

- `AgencyOnboardingTemplate` — name, service type, status, optional `systemKey`
- `AgencyOnboardingTemplateVersion` — immutable published content
- `AgencyOnboardingTemplateSection`, `AgencyOnboardingTemplateQuestion`, `AgencyOnboardingTemplateRequirement`

## Versioning

Edits create new versions. `currentVersionId` points at the active version. **Project onboarding snapshots** the version at creation — later template edits never mutate active onboarding.

## Starter installation

Explicit **Install starter onboarding templates** on `/admin/agency/onboarding-templates`:

- Idempotent via stable `systemKey` (`onboarding-website-design`, etc.)
- Edited starters are not overwritten
- Page render does not write to the database

## Project templates

`AgencyProjectTemplate` (delivery) and `AgencyOnboardingTemplate` (client intake) remain separate systems.
