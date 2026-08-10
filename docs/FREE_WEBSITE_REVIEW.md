# Free Website Review

Public route: `/free-website-review`

## Flow

1. User enters URL, optional business name, goals, focus note
2. `POST /api/prospect/reviews` creates `AgencyWebsiteReview`
3. Background pipeline: crawl → deterministic evidence → AI analysis
4. Result at `/free-website-review/[id]` (noindex)

## Crawl limits

- Max 5 pages (homepage + up to 4 same-origin)
- SSRF checks on every redirect via `lib/ai/ssrf.ts`
- 2MB/page, 30s timeout

## Evidence

Deterministic observations stored in `AgencyWebsiteReviewEvidence` before AI runs.

## No fake scores

Uses direction labels (Strong foundation, Focused improvements, etc.) not numeric SEO scores.

## Legacy human review

Form at `#human-review` still submits `Enquiry` for manual follow-up.

See `FREE_WEBSITE_REVIEW_AI.md` and `WEBSITE_REVIEW_EVIDENCE.md`.
