# CRM Sales Inbox (V4)

The Sales Inbox answers one question: **what conversations require human attention?**

## Routes

| Route | Purpose |
|-------|---------|
| `/admin/crm/inbox` | Thread list with workflow views (default: Needs reply) |
| `/admin/crm/inbox/threads/[threadId]` | Full conversation + reply composer + context |
| `/admin/crm/inbox/messages/[messageId]` | Unmatched/review message handling (V3 preserved) |

## Views

- **Needs reply** — verified human inbound after latest outbound; sorted oldest waiting first
- **Waiting on contact** — latest meaningful message was outbound from Smartlance
- **Snoozed** — intentionally hidden until `snoozedUntil`
- **Needs review** — unmatched inbound messages + `NEEDS_REVIEW` threads
- **Closed** — no current inbox action required
- **All** — every linked conversation thread

## Inbox row fields

Contact, company, subject/snippet, workflow status, assigned owner, lead status/temperature, last activity, waiting duration.

Engagement icons (open/click/reply) are compact indicators only — they do not drive workflow.

## Read state

Per-user read tracking via `CrmEmailThreadUserState`. Opening a thread marks it read for that admin user. Read ≠ replied; `NEEDS_REPLY` persists until a human replies or changes workflow.

## Permissions

- `view_crm` — read inbox and threads
- `send_crm_email` — reply composer and drafts
- `manage_crm` — assign, snooze, close/reopen, quick CRM actions

All mutations require `assertSameOrigin()`.

## Nav badge

CRM Inbox nav shows count of **Needs reply threads + unmatched review messages** (bounded DB count).

## Contact 360

Contact detail shows **Conversations** section linking to inbox threads with status, owner, snippet, and last activity.

## Follow-up tasks (V4.0.1)

From thread sidebar: **Create follow-up task** with title, due date, assignee, priority, optional notes.

- `taskType = FOLLOW_UP` — separate from `REPLY_REQUIRED`
- Links `emailThreadId`, `contactId`, `leadId`, `dealId` from thread context
- Assignee default: thread owner → contact owner → current admin
- Does **not** change workflow status, send email, or mutate Lead state
- Multiple follow-up tasks allowed (unlike reply-required idempotency)

Bad Timing quick action optionally creates a follow-up with explicit future due date.

## SENT_UNCONFIRMED (V4.0.1)

When thread reply transport is ambiguous (`result.ambiguous`):

- `CrmEmail.deliveryStatus = SENT_UNCONFIRMED`
- Thread → `NEEDS_REVIEW` (not definitive `WAITING_ON_CONTACT`)
- Reply-required task stays **open** with delivery uncertainty note
- Operator resolves via **Mark as sent (no resend)** → `SENT` + `WAITING_ON_CONTACT` + task complete
- No automatic resend

Failed send (`FAILED`) keeps `NEEDS_REPLY`.

## Latest-message precedence

Race recovery uses `recomputeThreadWorkflowFromMessages()`:

- Order by `receivedAt` / `sentAt` (not `thread.updatedAt`)
- Tie-break: `createdAt` desc, then `id` desc
- Verified inbound overrides closed/snoozed via `markThreadNeedsReply`


Bounce/complaint tracking, deliverability dashboards, push notifications.
