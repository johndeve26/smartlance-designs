# CRM Email Tracking Privacy

## Data minimization

Stored for engagement productivity:

- Email ID (internal)
- Link destination (pre-validated at send)
- Event timestamp
- Classification (UNKNOWN / POSSIBLE_AUTOMATED / LIKELY_HUMAN)
- Hashed user-agent and IP fingerprint (optional, truncated)

Not stored:

- Raw permanent IP addresses
- Device fingerprints
- Cross-site tracking cookies
- Contact email in public URLs

## Public endpoints

- `/t/o/*` — open pixel (no CRM data returned)
- `/t/c/*` — click redirect (opaque token only)

Invalid tokens return safe 404 without revealing whether a contact exists.

## Disable globally

Turn off both toggles in CRM Outreach settings.

## Privacy policy

**MANUAL LEGAL/COPY REVIEW REQUIRED** — verify public privacy page describes email engagement if required for your jurisdiction.

## Deletion

Engagement events and tracked links cascade-delete with `CrmEmail`.
