# Project Delivery Readiness

Factual gates on `AgencyProject`:

- `requireOnboarding` — completed onboarding exists
- Required client requirements — all required `ACCEPTED` / `NOT_NEEDED`
- `requireSignedContract` — project contract status `SIGNED`
- `requireDeposit` — deposit installment invoice `PAID` (confirmed billing facts only)
- `requireInternalKickoff` — `internalKickoffCompletedAt` set

Overall: **Ready for delivery** or **Not ready** — no opaque score.

**Completing onboarding or satisfying readiness does not start the project.** Admin uses existing V1 `startAgencyProject`.

See `lib/onboarding/readiness.ts` and `ProjectReadinessPanel`.
