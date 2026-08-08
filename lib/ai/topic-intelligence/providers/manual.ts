import { isSafeHttpUrl } from "@/lib/ai/safety";
import type { TopicSignalProvider, TopicSignalSearchOptions } from "@/lib/ai/topic-intelligence/providers/types";
import type { NormalizedTopicSignal } from "@/lib/ai/topic-intelligence/types";

/**
 * Converts Admin seeds / pasted URLs into normalized signals (no external API).
 */
export class ManualSignalProvider implements TopicSignalProvider {
  readonly id = "manual";
  readonly label = "Manual / user seed";
  readonly capabilities = ["MANUAL"] as const;

  isConfigured(): boolean {
    return true;
  }

  async search(options: TopicSignalSearchOptions): Promise<NormalizedTopicSignal[]> {
    const q = options.query.trim();
    if (!q) return [];

    const signals: NormalizedTopicSignal[] = [
      {
        provider: this.id,
        type: "USER_SEED",
        title: q.slice(0, 300),
        summary: "Admin-supplied discovery seed.",
        market: options.market,
        language: "en",
        sourceAuthorityType: "PRIMARY",
        freshness: "HYBRID",
        topics: [q.slice(0, 80)],
        provenance: {
          capability: "MANUAL",
          label: "User suggestion",
        },
      },
    ];

    if (isSafeHttpUrl(q)) {
      let domain: string | undefined;
      try {
        domain = new URL(q).hostname;
      } catch {
        domain = undefined;
      }
      signals.push({
        provider: this.id,
        type: "RESEARCH",
        title: `Source URL: ${domain || q}`,
        summary: "Admin-supplied source URL for discovery.",
        sourceUrl: q,
        sourceDomain: domain,
        market: options.market,
        language: "en",
        sourceAuthorityType: "INDUSTRY",
        freshness: "HYBRID",
        provenance: {
          capability: "MANUAL",
          label: "User source URL",
        },
      });
    }

    return signals.slice(0, options.maxResults ?? 8);
  }
}
