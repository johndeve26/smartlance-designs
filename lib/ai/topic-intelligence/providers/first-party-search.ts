import type { TopicSignalProvider, TopicSignalSearchOptions } from "@/lib/ai/topic-intelligence/providers/types";
import type { NormalizedTopicSignal } from "@/lib/ai/topic-intelligence/types";

/**
 * Future Search Console / first-party search adapter.
 * Never fabricates impressions, CTR, or query volume.
 *
 * Env (future): GOOGLE_SEARCH_CONSOLE_CONNECTED=true + OAuth tokens managed elsewhere.
 */
export class FirstPartySearchSignalProvider implements TopicSignalProvider {
  readonly id = "search_console";
  readonly label = "Search Console (first-party)";
  readonly capabilities = ["FIRST_PARTY_SEARCH"] as const;

  isConfigured(): boolean {
    return process.env.GOOGLE_SEARCH_CONSOLE_CONNECTED === "true";
  }

  async search(_options: TopicSignalSearchOptions): Promise<NormalizedTopicSignal[]> {
    void _options;
    // Not connected / not implemented — return empty rather than inventing metrics.
    return [];
  }
}
