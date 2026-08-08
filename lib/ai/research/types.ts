export type ResearchResult = {
  url: string;
  title?: string;
  publisher?: string;
  snippet?: string;
  sourceTypeHint?:
    | "PRIMARY"
    | "OFFICIAL"
    | "RESEARCH"
    | "INDUSTRY"
    | "COMMUNITY"
    | "COMPETITOR"
    | "USER_SUPPLIED";
};

export type ResearchSearchOptions = {
  query: string;
  maxResults?: number;
  signal?: AbortSignal;
};

/**
 * Separate from AIProvider — web research must not be coupled to one search API.
 */
export interface ResearchProvider {
  readonly id: string;
  isConfigured(): boolean;
  search(options: ResearchSearchOptions): Promise<ResearchResult[]>;
}

export class ResearchProviderNotConfiguredError extends Error {
  constructor(providerId = "research") {
    super(
      `Research provider "${providerId}" is not configured. Add source URLs manually or set a research API key.`,
    );
    this.name = "ResearchProviderNotConfiguredError";
  }
}
