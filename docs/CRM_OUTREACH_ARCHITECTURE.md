# CRM Outreach Architecture

V2 adds **Segments** and **Sequences** on top of CRM Foundation V1.

## Components

| Module | Purpose |
|--------|---------|
| `CrmSegment` | Saved, versioned filter JSON → dynamic contact sets |
| `CrmSequence` | Draft/Active/Paused outreach workflow |
| `CrmSequenceStep` | EMAIL, WAIT, TASK steps with delays |
| `CrmSequenceEnrollment` | Per-contact progress through a sequence |
| `CrmSequenceExecution` | Durable, idempotent step execution records |
| `CrmOutreachSettings` | Daily limits, send windows, footers |

## Scheduler reliability (V2.1)

The scheduler is **concurrency-safe** and **database-idempotent** — not exactly-once SMTP delivery.

| Guarantee | Detail |
|-----------|--------|
| One active claim | Atomic `PENDING → PROCESSING` with claim lease |
| Idempotent executions | Unique `(enrollmentId, stepId)` |
| Pre-send revalidation | Suppression, archive, pause, deal won, lead state rechecked before transport |
| Stale recovery | Expired `claimExpiresAt` reverts to `PENDING` or marks `AMBIGUOUS` if provider ID exists |
| Ambiguous window | SMTP success + DB finalization failure → `SENT_UNCONFIRMED` / `AMBIGUOUS` — **no auto-resend** |

SMTP transport generally cannot guarantee exactly-once recipient delivery. Provider acceptance proves at-most provider acceptance, not inbox delivery.

Integration tests: `TEST_DATABASE_URL=... npm run test:crm:integration`

## Versioning policy

- ACTIVE sequences cannot have structural step edits
- Enrollments record `sequenceVersion` at enrollment time
- Email subject/body snapshotted on execution records

## Separation

- Segments ≠ Subscribers
- Sequences ≠ marketing campaigns
- Enrollment is always deliberate (contact or reviewed segment batch)

See also: `CRM_SEQUENCES.md`, `CRM_SUPPRESSION_POLICY.md`, `CRM_OUTREACH_OPERATIONS.md`
