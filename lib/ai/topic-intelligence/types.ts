/**
 * Topic Intelligence — shared types (provider-agnostic).
 * Never invent search volume, trend %, or SEO opportunity scores.
 */

import type {
  TopicContentFormat,
  TopicFreshnessClass,
  TopicRecommendation,
  TopicSignalType,
  TopicSourceAuthority,
} from "@prisma/client";

export type TopicSignalCapability =
  | "WEB_SEARCH"
  | "NEWS"
  | "TRENDS"
  | "RSS"
  | "FIRST_PARTY_SEARCH"
  | "INDUSTRY_SOURCE"
  | "MANUAL";

export type NormalizedTopicSignal = {
  provider: string;
  type: TopicSignalType;
  title: string;
  summary?: string;
  sourceUrl?: string;
  sourceDomain?: string;
  publishedAt?: Date | null;
  market?: string;
  language?: string;
  entities?: string[];
  topics?: string[];
  rawProviderId?: string;
  sourceAuthorityType: TopicSourceAuthority;
  freshness: TopicFreshnessClass;
  provenance: {
    capability: TopicSignalCapability;
    label: string;
    note?: string;
  };
};

export type ContentIndexRecord = {
  id: string;
  title: string;
  slug: string;
  path: string;
  type:
    | "Insight"
    | "Service"
    | "Solution"
    | "Platform"
    | "Industry"
    | "Work"
    | "Guide"
    | "Comparison"
    | "Checklist"
    | "Glossary"
    | "Template"
    | "Tool"
    | "CmsResource";
  topics: string[];
  intent?: string;
  summary: string;
  publishedAt?: string | null;
  updatedAt?: string | null;
};

export type CoverageRow = {
  entityType: "Service" | "Solution" | "Platform" | "Industry";
  id: string;
  title: string;
  path: string;
  slugOrHref: string;
  insightCount: number;
  resourceCount: number;
  workCount: number;
  recentInsightCount: number;
  gapLevel: "strong" | "moderate" | "weak" | "none";
  relatedTopics: string[];
};

export type OpportunityDimensions = {
  audienceRelevance: "high" | "medium" | "low" | "unknown";
  businessRelevance: "high" | "medium" | "low" | "unknown";
  distinctIntent: "yes" | "partial" | "no" | "unknown";
  uniqueSmartlanceValue: "high" | "medium" | "low" | "unknown";
  sourceQuality: "high" | "medium" | "low" | "unknown";
  timeliness: "high" | "medium" | "low" | "unknown";
  evergreenValue: "high" | "medium" | "low" | "unknown";
  commercialSupport: "high" | "medium" | "low" | "unknown";
  contentGapValue: "high" | "medium" | "low" | "unknown";
  cannibalizationRisk: "high" | "medium" | "low" | "unknown";
  evidenceReadiness: "high" | "medium" | "low" | "unknown";
};

export type AnalyzedOpportunityDraft = {
  workingTitle: string;
  coreTopic: string;
  question?: string;
  recommendation: TopicRecommendation;
  intent?: string;
  audience?: string;
  market?: string;
  timeliness: TopicFreshnessClass;
  evergreenPotential: boolean;
  commercialRelationship?: string;
  uniqueValue?: string;
  reasonToExist?: string;
  whyNow?: string;
  whySmartlance?: string;
  existingContent: ContentIndexRecord[];
  suggestedServices: string[];
  suggestedSolutions: string[];
  suggestedPlatforms: string[];
  suggestedResources: string[];
  suggestedFormat: TopicContentFormat;
  suggestedCta?: string;
  dimensions: OpportunityDimensions;
  badge: string;
  higherFactualReview: boolean;
  mergeKey: string;
  signalTitles: string[];
};

export const DISCOVERY_MARKETS = [
  { id: "global_en", label: "Global English" },
  { id: "us", label: "United States" },
  { id: "uk", label: "United Kingdom" },
  { id: "eu", label: "Europe — General" },
  { id: "ca", label: "Canada" },
  { id: "au", label: "Australia" },
] as const;

export function fingerprintSignal(input: {
  title: string;
  sourceUrl?: string | null;
  publishedAt?: Date | null;
  provider: string;
}): string {
  const url = (input.sourceUrl || "").trim().toLowerCase().replace(/\/$/, "");
  if (url) return `url:${url.slice(0, 240)}`;
  const day = input.publishedAt
    ? input.publishedAt.toISOString().slice(0, 10)
    : "nodate";
  const title = input.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .slice(0, 120);
  return `t:${input.provider}:${day}:${title}`;
}

export function clusterKeyForSignal(signal: NormalizedTopicSignal): string {
  const base = (signal.topics?.[0] || signal.title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${signal.type.toLowerCase()}:${base || "general"}`;
}

export function mergeKeyForOpportunity(topic: string, market?: string | null): string {
  const t = topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
  return `${market || "global_en"}:${t}`;
}
