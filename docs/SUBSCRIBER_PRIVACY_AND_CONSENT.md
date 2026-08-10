# Subscriber privacy and consent

## PII

Subscriber records contain:

- Name (optional)
- Email
- Source attribution
- Consent text/version and timestamps

## Consent

Stored at signup:

- `consentText` — disclosure shown on form
- `consentVersion` — `audience-consent-v1`
- `consentAt` — timestamp

Contact/Review opt-in uses the same consent model when checkbox is selected.

## Separation from enquiries

Submitting a Contact or Website Review form is **not** marketing consent unless
the optional checkbox is checked.

Enquiry persistence is independent: subscriber failures never roll back enquiries.

## Admin visibility

Only roles with `view_audience` may access subscriber emails in Admin.

Admin DTOs never include:

- `confirmationTokenHash`
- `unsubscribeTokenHash`

## Public privacy

No public API lists subscribers or confirms whether an email exists.

## Unsubscribe vs deletion

Unsubscribe retains minimal record to prevent accidental re-messaging without
new consent. Full privacy deletion should follow existing site privacy tooling
when extended for Audience records.

## Utility pages

`/subscribe/confirm` and `/unsubscribe` are `noindex` and excluded from sitemap
intent (utility routes, not landing pages).
