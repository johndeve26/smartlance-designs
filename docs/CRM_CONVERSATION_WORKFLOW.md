# CRM Conversation Workflow (V4)

Conversation workflow is **separate from Lead/Deal business state**.

## Workflow states

| State | Meaning |
|-------|---------|
| `NEEDS_REPLY` | Verified human inbound exists after latest outbound human reply |
| `WAITING_ON_CONTACT` | Latest meaningful message was outbound from Smartlance |
| `SNOOZED` | Hidden from active views until `snoozedUntil` |
| `CLOSED` | No current inbox action required |
| `NEEDS_REVIEW` | Unmatched/review threads (V3 preserved) |

## State transitions

### Verified human inbound (exact thread, not automated)

- `workflowStatus` → `NEEDS_REPLY`
- Clear snooze and closed state
- Update `lastInboundAt`, `lastActivityAt`, `needsReplySince`
- Upsert one `REPLY_REQUIRED` task per thread
- **Does not** change Lead status, temperature, or create Deal
- Stops active sequences (V3 behavior preserved)

### Human outbound reply (THREAD_REPLY origin)

- After confirmed send → `WAITING_ON_CONTACT`
- Complete active `REPLY_REQUIRED` task
- **Does not** change Lead/Deal state

### Sequence/manual outbound without prior human conversation

- Does not enter human workflow until verified reply arrives

### Automated / OOO inbound

- Does **not** become `NEEDS_REPLY` by default (V3 policy)

### Close / reopen

- Close is inbox-only — does not close Lead or Deal
- Manual reopen chooses `NEEDS_REPLY` or `WAITING_ON_CONTACT` from timestamps
- Verified inbound on closed thread → auto-reopen to `NEEDS_REPLY`

### Snooze

- Sets `SNOOZED` + `snoozedUntil`
- Verified inbound clears snooze immediately → `NEEDS_REPLY`
- Expired snoozes normalized lazily on inbox queries via `normalizeExpiredSnoozes()`

### SENT_UNCONFIRMED outbound (thread reply)

- Thread → `NEEDS_REVIEW`
- Reply-required task remains open (context updated)
- Operator **Mark as sent (no resend)** → confirmed `SENT` → `WAITING_ON_CONTACT`

### Snooze presets (V4.0.1)

Later today, Tomorrow, 3 days, 1 week, Custom (future date required).

## Precedence / races

1. Verified human inbound overrides `CLOSED` and `SNOOZED`
2. Latest meaningful human message direction wins when deriving state:
   - Latest inbound → `NEEDS_REPLY`
   - Latest outbound → `WAITING_ON_CONTACT`
3. Manual `CLOSED` persists until reopen or new verified inbound
4. Failed/ambiguous send does **not** set `WAITING_ON_CONTACT`

## Assignment

- `assignedToId` on `CrmEmailThread`
- Defaults to Contact owner on first actionable inbound if unassigned
- Filters: assigned to me, unassigned, specific owner

## Backfill (migration)

Existing threads derive workflow from latest human inbound/outbound messages with a **90-day cutoff**. Older threads → `CLOSED`. Conservative — does not resurrect ancient inbound as urgent work.

## Central service

All workflow mutations go through `lib/crm/inbox/workflow.ts`:

- `markThreadNeedsReply()`
- `markThreadWaitingOnContact()`
- `snoozeThread()` / `closeThread()` / `reopenThread()` / `assignThread()`
- `handleInboundThreadWorkflow()` — called from inbound reply handler

Do not mutate `workflowStatus` directly from routes/actions.
