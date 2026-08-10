# CRM Outreach Analytics

## Engagement metrics (V3.2)

### Unique contact metrics

- **Contacts with detected open** — distinct contacts with ≥1 open detection on outbound email
- **Contacts with detected click** — distinct contacts with ≥1 click detection
- **Approx. detected open rate** — contacts with open / contacts sent (labeled approximate)
- **Detected click rate** — contacts with click / contacts sent

### Event metrics

- **Total open detections** — raw OPEN_DETECTED events (includes repeats outside dedupe window)
- **Total link click detections** — raw LINK_CLICKED events
- **Possible automated clicks** — events classified POSSIBLE_AUTOMATED

### Reply metrics (unchanged)

- **Verified replies (inbound)** — EXACT_THREAD inbound, not automated
- **Manual replies recorded** — admin-marked; separate from verified

## Denominators

Rates use **unique contacts with sent outbound email** as denominator.

## No auto-qualification

Engagement metrics do not change Lead status, temperature, or create Deals.
