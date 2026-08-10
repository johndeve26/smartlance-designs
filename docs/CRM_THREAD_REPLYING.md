# CRM Thread Replying (V4)

## Composer location

Thread detail page (`/admin/crm/inbox/threads/[threadId]`) — bottom of message list.

Fields: body (required), optional template insertion via existing personalization, Send + Save draft.

## Origin

Outbound replies persist `origin: THREAD_REPLY` on `CrmEmail`.

## Threading headers

When replying to latest inbound:

- **In-Reply-To**: latest inbound `internetMessageId` (angle brackets stripped for storage, wrapped for transport)
- **References**: conservative chain from inbound references + in-reply-to (max 20 IDs)
- **Message-ID**: generated per outbound (`crm-{uuid}@{domain}`), persisted before send
- **Subject**: `normalizeReplySubject()` — single `Re:` prefix, no stacking

Header values are constructed from validated stored data only (`escapeHeaderFragment`) — no raw newline injection.

## Recipient

Default: verified Contact email from thread association. Reply blocked if thread has no linked contact.

## Drafts

- `CrmEmail.deliveryStatus = DRAFT`
- One active draft per thread + admin user (`createdById`)
- Drafts never trigger `EMAIL_SENT` activity or workflow transitions

## Send idempotency

Optional `clientRequestId` on send — duplicate requests return existing outbound record.

## SENT_UNCONFIRMED (V4.0.1)

Ambiguous transport → `SENT_UNCONFIRMED` on `CrmEmail`, thread `NEEDS_REVIEW`.

Does **not** call `markThreadWaitingOnContact` or complete reply task.

Operator resolution: `resolveAmbiguousThreadReply()` marks `SENT` and then transitions workflow.

## Failure handling

Transport failure:

- Email record → `FAILED`
- Thread workflow **unchanged** (stays `NEEDS_REPLY`)
- Error surfaced to admin; draft/body preserved

## SENT_UNCONFIRMED

Conservative: workflow only transitions on confirmed successful send per existing outbound policy.

## Templates

Reuse `renderOutreachEmail()` variable resolution. Unresolved required variables block send. Template insertion does not replace thread subject.

## Transport

Reuses shared `sendTransactionalEmail()` — SMTP and Resend paths pass threading headers where supported.

## Attachments

Deferred in V4 unless end-to-end support already exists.
