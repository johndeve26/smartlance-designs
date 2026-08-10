# Agency Client Onboarding Architecture (V3)

## Boundaries

| Concept | Role |
|---------|------|
| **Project** | What Smartlance delivers |
| **Onboarding** | Information/assets/access collected before/during initial delivery setup |
| **Client Requirement** | Operational item the client must provide (reuses `AgencyClientRequirement`) |
| **Project Task** | Internal Smartlance work — not questionnaire answers |

Onboarding completion does **not** auto-start the project, change contract status, or create invoices.

## Status lifecycle

`NOT_STARTED` → `IN_PROGRESS` → `WAITING_ON_CLIENT` / `UNDER_REVIEW` → `COMPLETED` (admin) or `CANCELLED`.

Centralized transitions live in `lib/onboarding/onboarding.ts` (`startOnboarding`, `submitOnboardingForReview`, `completeOnboarding`, `recalculateOnboardingState`, etc.).

## One active onboarding per project

Enforced in `startOnboarding` transaction + partial unique index on `AgencyProjectOnboarding(projectId)` where status ∉ `{COMPLETED,CANCELLED}`.

## Admin routes

- `/admin/agency/onboarding` — list
- `/admin/agency/onboarding/[id]` — detail + review
- `/admin/agency/onboarding-templates` — templates (no get-time seeding)
- Project detail — start onboarding + delivery readiness

## Portal routes

- `/portal/projects/[projectId]/onboarding` — client workspace (requires explicit project access)
- Portal home aggregates onboarding attention items

## Security

- RBAC: `view_onboarding`, `manage_onboarding`, `manage_onboarding_templates`
- Portal: session + `AgencyProjectClientAccess`; same-company without project access denied
- No public onboarding links; no plaintext credential fields on ACCESS requirements
