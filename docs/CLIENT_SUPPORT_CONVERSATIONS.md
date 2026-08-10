# Client Support Conversations

## Messages

`AgencySupportMessage` with `authorType`: CLIENT | SMARTLANCE.

- Client-visible messages only in portal
- Internal notes use `clientVisible: false`
- No realtime chat, typing indicators, or sockets

## Client actions

| Action | When |
|--------|------|
| Reply | OPEN, IN_PROGRESS, WAITING_ON_CLIENT, RESOLVED (reopen policy) |
| Confirm resolved | RESOLVED → CLOSED |
| Still need help | RESOLVED → OPEN |

Initial request description is immutable; follow-up goes in messages.

## Notifications

Transactional email on: confirmation, Smartlance reply, waiting-on-client, resolution.

## Security

Messages rendered safely (no raw HTML). Bounded length. Rate limits on submit/reply.
