# Agency Deliverables & Approvals

## Deliverable model

`AgencyDeliverable` belongs to a project (optional milestone). Status flow:

```
DRAFT → READY_FOR_REVIEW → APPROVED
                        ↘ CHANGES_REQUESTED → (new version) → READY_FOR_REVIEW
ARCHIVED
```

## Versioning

`AgencyDeliverableVersion` — one-to-many from deliverable:

- `versionNumber` (unique per deliverable)
- Optional `AgencyProjectFile` (private storage)
- Optional `externalUrl` (HTTPS link — displayed only, never server-fetched)

Previous versions and review history are preserved.

## Review records

`AgencyDeliverableReview` stores factual decisions:

- `APPROVED` or `CHANGES_REQUESTED`
- Reviewer identity: `reviewerContactId` and/or `reviewerPortalUserId`
- `isAdminOverride` for internal approval (not client approval)
- Comment on changes requested

Historical reviews are never overwritten.

## Client approval (portal)

Authenticated portal users with explicit project access can:

1. **Approve** — creates review record, sets deliverable `APPROVED`
2. **Request changes** — requires comment, sets `CHANGES_REQUESTED`

Approval confirmation is required. Clients cannot unapprove historical versions; new versions start a new review cycle.

## Internal vs client review

- Task status `REVIEW` = internal team review
- Deliverable `READY_FOR_REVIEW` = client-facing review queue

These are separate concepts.

## Notifications

Transactional emails (when configured): deliverable ready for review, client approved, changes requested. DB mutations persist even if email fails.
