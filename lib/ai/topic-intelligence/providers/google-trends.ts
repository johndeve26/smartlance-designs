import type { TopicSignalProvider, TopicSignalSearchOptions } from "@/lib/ai/topic-intelligence/providers/types";
import type { NormalizedTopicSignal } from "@/lib/ai/topic-intelligence/types";

/**
 * Google Trends — only when a legitimate official API credential exists.
 * Never scrapes undocumented Google endpoints. Never invents popularity.
 *
 * Env (feature-gated): GOOGLE_TRENDS_API_KEY
 * Until official access is wired, this provider remains unconfigured.
 */
export class GoogleTrendsSignalProvider implements TopicSignalProvider {
  readonly id = "google_trends";
  readonly label = "Google Trends";
  readonly capabilities = ["TRENDS"] as const;

  private apiKey() {
    return process.env.GOOGLE_TRENDS_API_KEY?.trim() || "";
  }

  isConfigured(): boolean {
    // Official adapter not implemented yet — key alone is insufficient without a real API contract.
    // Keep false to avoid fabricating trend metrics.
    return false && Boolean(this.apiKey());
  }

  async search(_options: TopicSignalSearchOptions): Promise<NormalizedTopicSignal[]> {
    void _options;
    return [];
  }
}
