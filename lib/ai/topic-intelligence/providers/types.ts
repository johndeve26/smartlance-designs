import type { NormalizedTopicSignal, TopicSignalCapability } from "@/lib/ai/topic-intelligence/types";

export type TopicSignalSearchOptions = {
  query: string;
  market?: string;
  maxResults?: number;
  signal?: AbortSignal;
  /** When true, skip short-lived caches */
  forceRefresh?: boolean;
  /** Source pack keywords / domains when applicable */
  pack?: {
    keywords?: string[];
    officialDomains?: string[];
    rssFeeds?: string[];
    newsQueries?: string[];
    excludedDomains?: string[];
  };
};

export interface TopicSignalProvider {
  readonly id: string;
  readonly label: string;
  readonly capabilities: readonly TopicSignalCapability[];
  isConfigured(): boolean;
  search(options: TopicSignalSearchOptions): Promise<NormalizedTopicSignal[]>;
}

export class TopicSignalProviderNotConfiguredError extends Error {
  constructor(public readonly providerId: string) {
    super(`Topic signal provider "${providerId}" is not configured.`);
    this.name = "TopicSignalProviderNotConfiguredError";
  }
}

export class TopicSignalProviderUnavailableError extends Error {
  constructor(
    public readonly providerId: string,
    message: string,
  ) {
    super(message);
    this.name = "TopicSignalProviderUnavailableError";
  }
}
