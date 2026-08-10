# Onboarding Reminders

## Default: manual

`reminderMode` on onboarding defaults to `MANUAL`. Admin sends reminders from onboarding detail.

## Automatic (opt-in)

Set `reminderMode = AUTOMATIC` to enable scheduler:

`POST /api/internal/agency-onboarding-scheduler` with `Authorization: Bearer $AGENCY_ONBOARDING_SCHEDULER_SECRET`

## Limits

- Max 3 automatic reminders per onboarding (`ONBOARDING_MAX_AUTOMATIC_REMINDERS`)
- 3-day interval between automatic sends
- Dedupe via unique `dedupeKey` on `AgencyOnboardingReminder`
- No reminders for `COMPLETED` / `CANCELLED` onboarding

## Email content

Factual only — project name, remaining item count, portal link. No private answers or file URLs in email.
