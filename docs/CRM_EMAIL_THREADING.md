# CRM Email Threading

## Outbound

On send, CRM stores:

- `providerMessageId` — transport return value
- `internetMessageId` — normalized RFC Message-ID

## Inbound

Parser extracts:

- `internetMessageId`
- `inReplyToMessageId`
- `referencesHeader`

## Matching

**EXACT_THREAD** — header chain matches outbound CRM email  
**EXACT_EMAIL** — known Contact sender, no thread proof  
**UNMATCHED** — unknown sender or no Contact

Unrelated email from known Contact is stored but not linked to arbitrary outbound messages.

## Threads

`CrmEmailThread` groups related messages when exact thread match creates/extends a conversation.
