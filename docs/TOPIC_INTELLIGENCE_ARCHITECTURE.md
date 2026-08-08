# Topic Intelligence Architecture

Topic Intelligence is the **discovery layer** in front of the Smartlance AI Editorial Studio.

It answers: **what should we consider writing about?**  
Article research still answers: **what information do we need to write this article?**

## Flow

```
Signals → Discovery → Clustering → Existing-content check
→ Opportunity analysis → Human selection → Create AI Editorial Project
→ Existing workflow (cannibalization → research → brief → … → Insight DRAFT)
```

Nothing discovered is automatically written or published.

## Core models

| Model | Role |
|---|---|
| `TopicSeed` | Admin suggestions (not article titles) |
| `TopicDiscoveryRun` | Durable scan job (`QUEUED`/`RUNNING`/`SUCCEEDED`/`FAILED`) |
| `TopicSignal` | Normalized external/internal evidence (headline/summary/URL only) |
| `EditorialOpportunity` | Reviewed candidate with recommendation + dimensions |
| `TopicSourcePack` | Trusted domains/feeds/keywords |
| `TopicWatchlist` | Monitored themes + optional pack |
| `TopicStrategySettings` | Priority/paused themes + default market |

## Providers

Capability-based registry (`lib/ai/topic-intelligence/providers`):

- `WEB_SEARCH` — Tavily (reuses existing research client)
- `NEWS` — one dedicated provider (NewsAPI preferred, else GNews)
- `RSS` — hardened SSRF-safe fetch
- `TRENDS` — Google Trends stub (no unofficial scraping; never invent popularity)
- `FIRST_PARTY_SEARCH` — Search Console stub (never fabricate metrics)
- `MANUAL` — user seeds

## Internal analysis

- Content index: metadata only (no full article bodies; no Enquiry/PII)
- Commercial coverage map + content balance (counts, not quotas)
- Opportunity dimensions are separate badges — **no 0–100 SEO score**

## Security

- External text sandboxed as untrusted data
- RSS/news URLs via `safeFetchText` / `assertPublicHttpUrl`
- Env secrets only for API keys
- Human override cannot bypass unsafe URLs / PII boundaries
