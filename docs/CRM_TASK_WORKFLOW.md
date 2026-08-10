# CRM Task Workflow — Sales Inbox (V4)

## Follow-up tasks (V4.0.1)

| Type | Idempotency | Purpose |
|------|-------------|---------|
| `REPLY_REQUIRED` | One active per thread | Contact replied — human must respond |
| `FOLLOW_UP` | Multiple allowed | Scheduled future CRM work |

Follow-up creation from thread sidebar uses `createThreadFollowUpTask()`.

Does not alter conversation workflow, send email, or change Lead/Deal state.

## Reply-required vs follow-up

One active `REPLY_REQUIRED` task per thread — not one per inbound message.

### Schema

- `CrmTask.emailThreadId` — explicit thread relation
- `CrmTask.taskType` — `REPLY_REQUIRED` | `FOLLOW_UP` | `GENERAL`
- Index: `[emailThreadId, status, taskType]`

### Idempotency

`upsertReplyRequiredTask()` in `lib/crm/inbox/reply-tasks.ts`:

- Finds open `REPLY_REQUIRED` task for thread
- Updates due/context if exists
- Creates new task only if none open
- **Does not** use description text as identity

### On verified inbound

- Upsert reply task
- Assignee: thread owner → contact owner → sync actor

### On successful human reply

- `completeReplyRequiredTask()` — completes open `REPLY_REQUIRED` only
- Other tasks (follow-up, general) untouched

### On subsequent inbound

- Reopens/updates the single reply task (not a new duplicate)

### Follow-up tasks

Explicit human action creates normal `CrmTask` with optional due date.

**Snooze ≠ follow-up task** — snooze controls inbox visibility; tasks control required work.

### Close with open reply task

Closing a thread does not auto-complete unrelated tasks. Admin may complete reply task explicitly when closing if desired (future UX enhancement).

## Permissions

Task creation/completion follows existing CRM task ownership and `manage_crm` / `send_crm_email` boundaries.
