# Client Success Architecture

Client Success V1 extends Client Portal V2 with post-launch ongoing client relationship features.

## Core concepts

| Concept | Purpose |
|---------|---------|
| **Managed Website** | Ongoing client asset after project delivery |
| **Agency Project** | Historical delivery record — separate from managed website |
| **Website Care** | Factual maintenance/care events and plan status |
| **Support Request** | Client help channel — not automatically a change request |

## Boundaries

- Same company ≠ website access (explicit grants required)
- Website access independent from project, billing, and document access
- No fake monitoring — availability only shown when `statusSource` is authoritative
- No credentials or infrastructure secrets in client DTOs
- Support status transitions are server-authoritative

## Layers

```
Portal pages → lib/portal/{websites,support}.ts → lib/client-success/* → Prisma
```

## Portal routes

- `/portal/websites` — My Websites
- `/portal/websites/[id]` — Website hub (Overview / Care / Support tabs)
- `/portal/support` — Support list
- `/portal/support/new` — New request
- `/portal/support/[id]` — Request detail + conversation

## Integration

- **Home**: Your Websites section (up to 4)
- **Attention**: `SUPPORT_WAITING_ON_CLIENT` when client can respond
- **Timeline**: completed care events, support created/resolved (not noise)

## Internal (minimal)

- `/admin/agency/websites` — create/manage websites, care events, access
- `/admin/agency/support` — reply, waiting-on-client, resolve, link change request

## Deferred

Analytics/reporting, uptime SaaS, AI support, password vault, SLA engine, live chat.
