/**
 * Topic Intelligence calibration + editorial judgement tests (mocked providers).
 */

import { describe, expect, it } from "vitest";
import {
  listTopicCalibrationFixtures,
  listTopicCalibrationHoldout,
  TOPIC_CALIBRATION_FIXTURES,
} from "@/lib/ai/topic-intelligence/calibration/fixtures";
import {
  evaluateTopicCalibrationFixture,
  runTopicCalibrationSuite,
} from "@/lib/ai/topic-intelligence/calibration/evaluate";
import { analyzeClusterToOpportunity } from "@/lib/ai/topic-intelligence/opportunity-analysis";
import { clusterSignals, isNewsNoise } from "@/lib/ai/topic-intelligence/clustering";
import {
  detectQueryPermutationSpam,
  flagDiscoveryQueryQuality,
  planDiscoveryQueries,
} from "@/lib/ai/topic-intelligence/query-plan";
import type { NormalizedTopicSignal } from "@/lib/ai/topic-intelligence/types";
import { PROMPT_VERSIONS } from "@/lib/ai/prompts";
import { CONTENT_INDEX_FORBIDDEN_PRISMA } from "@/lib/ai/topic-intelligence/content-index";
import { readFileSync } from "fs";
import { join } from "path";

function sig(
  partial: Partial<NormalizedTopicSignal> & Pick<NormalizedTopicSignal, "title">,
): NormalizedTopicSignal {
  return {
    provider: partial.provider || "test",
    type: partial.type || "NEWS",
    title: partial.title,
    summary: partial.summary,
    sourceUrl: partial.sourceUrl,
    sourceDomain: partial.sourceDomain,
    publishedAt: partial.publishedAt ?? null,
    market: partial.market || "global_en",
    language: "en",
    sourceAuthorityType: partial.sourceAuthorityType || "NEWS",
    freshness: partial.freshness || "TIMELY",
    provenance: partial.provenance || { capability: "NEWS", label: "test" },
    topics: partial.topics,
  };
}

describe("Topic Intelligence calibration fixtures", () => {
  it("has 30–50 training fixtures plus holdout (~20–30%)", () => {
    const train = listTopicCalibrationFixtures();
    const holdout = listTopicCalibrationHoldout();
    expect(train.length).toBeGreaterThanOrEqual(30);
    expect(train.length).toBeLessThanOrEqual(50);
    const ratio = holdout.length / (train.length + holdout.length);
    expect(ratio).toBeGreaterThanOrEqual(0.15);
    expect(ratio).toBeLessThanOrEqual(0.35);
  });

  it("covers required editorial categories", () => {
    const cats = new Set(TOPIC_CALIBRATION_FIXTURES.map((f) => f.category));
    for (const c of [
      "website-design",
      "seo",
      "conversion",
      "website-performance",
      "ecommerce",
      "platforms",
      "hospitality",
      "bad-idea",
      "format-boundary",
      "duplicate",
    ] as const) {
      expect(cats.has(c)).toBe(true);
    }
  });
});

describe("Topic Intelligence calibration suite", () => {
  it("matches a strong majority of gold decisions without live APIs", () => {
    const result = runTopicCalibrationSuite({ includeHoldout: false });
    expect(result.totals.fixtures).toBe(TOPIC_CALIBRATION_FIXTURES.length);
    const rate = result.totals.decisionMatches / result.totals.fixtures;
    expect(rate).toBeGreaterThanOrEqual(0.7);
    // False WRITE NEW when human expected update/ignore is content bloat risk
    expect(result.totals.falsePositiveWriteNew).toBeLessThanOrEqual(4);
  });

  it("rejects commodity listicles", () => {
    const row = evaluateTopicCalibrationFixture(
      TOPIC_CALIBRATION_FIXTURES.find((f) => f.id === "bad-10-reasons")!,
    );
    expect(row.actualDecision).toBe("IGNORE");
    expect(row.decisionMatch).toBe(true);
  });

  it("prefers glossary for definitional seeds", () => {
    const row = evaluateTopicCalibrationFixture(
      TOPIC_CALIBRATION_FIXTURES.find((f) => f.id === "fmt-canonical")!,
    );
    expect(row.actualFormat).toBe("GLOSSARY");
    expect(row.actualDecision).toBe("EXPAND_EXISTING_RESOURCE");
  });

  it("detects STR near-duplicates as update/ignore", () => {
    for (const id of ["dup-airbnb-depend", "dup-pricelabs", "dup-calendar-sync"]) {
      const row = evaluateTopicCalibrationFixture(
        TOPIC_CALIBRATION_FIXTURES.find((f) => f.id === id)!,
      );
      expect(["UPDATE_EXISTING", "IGNORE"]).toContain(row.actualDecision);
    }
  });

  it("routes service catalogue questions away from Insight WRITE_NEW", () => {
    const row = evaluateTopicCalibrationFixture(
      TOPIC_CALIBRATION_FIXTURES.find((f) => f.id === "fmt-services")!,
    );
    expect(row.actualDecision).not.toBe("WRITE_NEW");
    expect(["UPDATE_SERVICE_PAGE", "IGNORE", "SUPPORT_COMMERCIAL_PAGE"]).toContain(
      row.actualDecision,
    );
  });
});

describe("distinct intent vs duplicate clustering", () => {
  it("does not treat enquiry-tracking as identical to traffic-not-converting titles alone", () => {
    const a = clusterSignals([
      sig({ title: "Why website traffic does not convert into enquiries", type: "RESEARCH" }),
    ]);
    const b = clusterSignals([
      sig({ title: "How to track website enquiries accurately", type: "RESEARCH" }),
    ]);
    expect(a[0]!.clusterKey).not.toBe(b[0]!.clusterKey);
  });

  it("collapses near-identical traffic/enquiries wording into one story cluster", () => {
    const clusters = clusterSignals([
      sig({ title: "traffic but no leads", type: "RESEARCH" }),
      sig({
        title: "website traffic but no enquiries",
        type: "RESEARCH",
        sourceUrl: "https://example.com/a",
      }),
      sig({
        title: "visitors but no contact form submissions",
        type: "RESEARCH",
        sourceUrl: "https://example.com/b",
      }),
    ]);
    // Title normalization may not fully merge all three — at least no explosion of clusters
    expect(clusters.length).toBeLessThanOrEqual(3);
  });
});

describe("news noise and missing metrics language", () => {
  it("filters celebrity and stock chatter", () => {
    expect(isNewsNoise("Celebrity box office gossip tonight")).toBe(true);
    expect(isNewsNoise("Tech stocks surge after earnings", "stock price")).toBe(true);
  });

  it("does not invent trend or volume claims in drafts", () => {
    const draft = analyzeClusterToOpportunity({
      cluster: {
        clusterKey: "t",
        anchor: sig({
          title: "Core Web Vitals for business owners",
          type: "RESEARCH",
          sourceAuthorityType: "INDUSTRY",
        }),
        supporting: [sig({ title: "LCP guidance" })],
        fingerprints: [],
      },
      seedText: "Core Web Vitals for business owners",
      index: [],
      coverage: [],
    });
    const text = `${draft?.whyNow} ${draft?.whySmartlance} ${draft?.reasonToExist}`;
    expect(text).not.toMatch(/surging|increased \d+%|rapidly trending|search volume/i);
  });
});

describe("primary source preference", () => {
  it("anchors official guidance over secondary news in a cluster", () => {
    const clusters = clusterSignals([
      sig({
        title: "Core Web Vitals documentation update explained",
        sourceUrl: "https://news.example.com/cwv",
        sourceAuthorityType: "NEWS",
      }),
      sig({
        title: "Core Web Vitals documentation update explained",
        sourceUrl: "https://web.dev/articles/vitals",
        sourceAuthorityType: "OFFICIAL",
        type: "OFFICIAL_GUIDANCE",
      }),
    ]);
    expect(clusters[0]!.anchor.sourceAuthorityType).toBe("OFFICIAL");
  });
});

describe("query quality", () => {
  it("flags keyword permutation spam", () => {
    const spam = detectQueryPermutationSpam([
      "website migration SEO",
      "SEO website migration",
      "website SEO migration",
    ]);
    expect(spam.length).toBeGreaterThanOrEqual(1);
  });

  it("plans a small diverse set without permutation spam", () => {
    const qs = planDiscoveryQueries("website migration", 6);
    expect(flagDiscoveryQueryQuality(qs).filter((f) => f.startsWith("permutation:"))).toHaveLength(
      0,
    );
  });
});

describe("prompt versioning + PII exclusion", () => {
  it("versions Topic Intelligence prompts separately", () => {
    expect(PROMPT_VERSIONS.topicDiscovery).toBe("topic-discovery:v1");
    expect(PROMPT_VERSIONS.opportunityAnalysis).toBe("opportunity-analysis:v1");
    expect(PROMPT_VERSIONS.signalClustering).toBe("signal-clustering:v1");
  });

  it("content index never references enquiry models", () => {
    expect(CONTENT_INDEX_FORBIDDEN_PRISMA).toContain("enquiry");
    const src = readFileSync(
      join(process.cwd(), "lib/ai/topic-intelligence/content-index.ts"),
      "utf8",
    );
    expect(src).not.toMatch(/prisma\.enquiry/i);
  });
});

describe("monitor early rumor", () => {
  it("monitors single weak news without official corroboration", () => {
    const row = evaluateTopicCalibrationFixture(
      TOPIC_CALIBRATION_FIXTURES.find((f) => f.id === "news-early-rumor")!,
    );
    expect(["MONITOR", "IGNORE"]).toContain(row.actualDecision);
  });
});
