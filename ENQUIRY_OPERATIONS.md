# Enquiry Operations

Phase 5 manages **Contact** and **Free Website Review** submissions.

## Status meanings

| Status | Meaning |
| --- | --- |
| NEW | Received, not yet reviewed |
| REVIEWING | Being assessed |
| REPLIED | Response handled outside Admin (manual mark) |
| QUALIFIED | Relevant for a real project (manual) |
| CLOSED | No further action required |
| SPAM | Unwanted / automated / irrelevant |

There is no AI qualification or lead scoring.

## Delivery principle

1. Validate + abuse checks  
2. Persist to PostgreSQL  
3. Attempt notification (Resend and/or webhook)  
4. Record `notificationStatus` (`NOT_ATTEMPTED` / `SENT` / `FAILED`)  
5. Public success = **DB persistence succeeded**

If email fails after persistence, the visitor is **not** asked to resubmit. Admin shows the failure and can **Retry notification**.

If DB persistence fails, the public form must **not** claim success.

## Admin routes

- `/admin/enquiries` — all
- `/admin/enquiries/contact` (+ `[id]`)
- `/admin/enquiries/reviews` (+ `[id]`)

## Notes

Append-only private notes. Never emailed to visitors. Excluded from default CSV export.

## Spam

Mark spam / restore. Honeypot `_gotcha` still pretends success without storing.

## Privacy actions (Super Admin)

- Anonymize (clears PII + notes; keeps reference/type/timestamps)
- Permanent delete
- CSV export (audited; formula-safe)

## Form disable

Site Settings `contactFormEnabled` / `freeReviewFormEnabled` — disabled forms reject POST with fallback contact email.
