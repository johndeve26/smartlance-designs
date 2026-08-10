# CRM Email and Suppression

## Transport

CRM uses the shared email stack (`lib/email`): Admin SMTP → env SMTP → Resend. No second SMTP implementation inside CRM.

## Manual send only (V1)

- From contact detail when `send_crm_email` capability and transport configured
- Subject + body; optional template variables: `{{firstName}}`, `{{companyName}}`, `{{senderName}}`
- Optional follow-up task after send (explicit days input)
- No sequences, bulk send, open/click tracking

## Server-side block

Send rejected when `emailStatus` is:

DO_NOT_EMAIL, UNSUBSCRIBED, BOUNCED, COMPLAINED, INVALID, SUPPRESSED

## Storage

Successful sends create `CrmEmail` + `EMAIL_SENT` activity. Bodies stored in `CrmEmail`, not activity metadata.

## Subscriber relationship

Marketing unsubscribe on a shared email may set CRM `UNSUBSCRIBED`. This reflects marketing consent — legitimate one-to-one service email policy should be reviewed operationally before overriding manually.

## Deferred V2

Automated sequences, inbox sync, reply tracking, campaign sending.
