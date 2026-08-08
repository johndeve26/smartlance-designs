import type {
  AnalyzedOpportunityDraft,
  ContentIndexRecord,
  OpportunityDimensions,
} from "@/lib/ai/topic-intelligence/types";
import { mergeKeyForOpportunity } from "@/lib/ai/topic-intelligence/types";
import type { SignalCluster } from "@/lib/ai/topic-intelligence/clustering";
import { isNewsNoise } from "@/lib/ai/topic-intelligence/clustering";
import { findOverlappingContent, isStrongContentCannibalization } from "@/lib/ai/topic-intelligence/content-index";
import type { CoverageRow } from "@/lib/ai/topic-intelligence/types";

const LEGAL_RE =
  /\b(gdpr|privacy law|accessibility law|ada |wcag|consumer protection|regulation|compliance)\b/i;

const DEFINITION_RE =
  /^(what is|define|definition of|meaning of)\b/i;

const CHECKLIST_RE = /\bchecklist\b/i;

const COMPARISON_RE = /\b(vs\.?|versus)\b/i;

const SERVICE_CATALOGUE_RE =
  /\b(what services (does|do)|services (does|do) smartlance|smartlance offer)\b/i;

/** Commodity / listicle / hype patterns — usually IGNORE (not permanent priority rules). */
const COMMODITY_RE =
  /\b(10 reasons|every business needs|why websites? are important|top\s*\d+|ultimate guide|best website ever|you cannot ignore|trends you (must|cannot)|how ai will change everything)\b/i;

const YEAR_BAIT_RE = /\b(in|for)\s+20\d{2}\b/i;

function dim(
  partial: Partial<OpportunityDimensions>,
): OpportunityDimensions {
  return {
    audienceRelevance: "unknown",
    businessRelevance: "unknown",
    distinctIntent: "unknown",
    uniqueSmartlanceValue: "unknown",
    sourceQuality: "unknown",
    timeliness: "unknown",
    evergreenValue: "unknown",
    commercialSupport: "unknown",
    contentGapValue: "unknown",
    cannibalizationRisk: "unknown",
    evidenceReadiness: "unknown",
    ...partial,
  };
}

/**
 * Heuristic opportunity analysis — no invented scores or trend percentages.
 * Used for production fallback and unit tests (no paid API).
 */
export function analyzeClusterToOpportunity(input: {
  cluster: SignalCluster;
  seedText: string;
  market?: string;
  index: ContentIndexRecord[];
  coverage: CoverageRow[];
}): AnalyzedOpportunityDraft | null {
  const { cluster, seedText, market, index, coverage } = input;
  const anchor = cluster.anchor;
  const title = anchor.title;
  const summary = anchor.summary || "";

  if (isNewsNoise(title, summary)) {
    return {
      workingTitle: title.slice(0, 120),
      coreTopic: seedText || title,
      recommendation: "IGNORE",
      intent: "unrelated",
      audience: "n/a",
      market: market || "global_en",
      timeliness: "TIMELY",
      evergreenPotential: false,
      reasonToExist: "Irrelevant to Smartlance audience (noise filter).",
      whyNow: "Not applicable — noise/unrelated headline.",
      whySmartlance: "No clear business reader relevance.",
      existingContent: [],
      suggestedServices: [],
      suggestedSolutions: [],
      suggestedPlatforms: [],
      suggestedResources: [],
      suggestedFormat: "INSIGHT",
      dimensions: dim({
        audienceRelevance: "low",
        businessRelevance: "low",
        evidenceReadiness: "low",
      }),
      badge: "Reject",
      higherFactualReview: false,
      mergeKey: mergeKeyForOpportunity(title, market),
      signalTitles: [anchor.title, ...cluster.supporting.map((s) => s.title)].slice(0, 8),
    };
  }

  const haystack = `${seedText} ${title} ${summary}`;

  // Commodity / listicle / empty hype — ignore before inventing Insights
  if (COMMODITY_RE.test(haystack) || (YEAR_BAIT_RE.test(haystack) && /important|ultimate|best|top\s*\d+/i.test(haystack))) {
    return makeDraft({
      workingTitle: title.slice(0, 120),
      coreTopic: seedText || title,
      recommendation: "IGNORE",
      suggestedFormat: "INSIGHT",
      existingContent: [],
      market,
      whyNow: "Commodity/listicle or hype framing — no clear distinctive reader need.",
      whySmartlance:
        "Generic “every business / ultimate / top N / year-stamped importance” topics do not add Smartlance editorial value.",
      badge: "Reject",
      higherFactualReview: false,
      signalTitles: [anchor.title],
      dimensions: dim({
        audienceRelevance: "low",
        businessRelevance: "low",
        uniqueSmartlanceValue: "low",
        contentGapValue: "low",
      }),
    });
  }

  // Competitor-only coverage without other evidence → monitor, not auto write
  const onlyCompetitor =
    anchor.sourceAuthorityType === "COMPETITOR" &&
    cluster.supporting.every((s) => s.sourceAuthorityType === "COMPETITOR");
  if (onlyCompetitor && anchor.type === "COMPETITOR_COVERAGE") {
    return {
      workingTitle: `Monitor: ${title}`.slice(0, 120),
      coreTopic: seedText || title,
      recommendation: "MONITOR",
      market: market || "global_en",
      timeliness: "TIMELY",
      evergreenPotential: false,
      whyNow: "Competitor coverage observed; not sufficient alone to justify a new Insight.",
      whySmartlance: "Needs Smartlance angle and audience relevance before writing.",
      existingContent: [],
      suggestedServices: [],
      suggestedSolutions: [],
      suggestedPlatforms: [],
      suggestedResources: [],
      suggestedFormat: "INSIGHT",
      dimensions: dim({
        uniqueSmartlanceValue: "unknown",
        evidenceReadiness: "low",
        cannibalizationRisk: "unknown",
      }),
      badge: "Monitor",
      higherFactualReview: false,
      mergeKey: mergeKeyForOpportunity(title, market),
      signalTitles: [anchor.title],
    };
  }

  // Service catalogue / “what do we offer” → commercial page, not Insight
  if (SERVICE_CATALOGUE_RE.test(haystack)) {
    return makeDraft({
      workingTitle: "Update service catalogue / Services overview",
      coreTopic: seedText || title,
      recommendation: "UPDATE_SERVICE_PAGE",
      suggestedFormat: "SERVICE_UPDATE",
      existingContent: [],
      market,
      whyNow: "This is a service-catalogue question, not an Insight opportunity.",
      whySmartlance: "Prefer Services/commercial pages over a blog-style answer.",
      badge: "Update existing",
      higherFactualReview: false,
      signalTitles: [anchor.title],
      dimensions: dim({
        distinctIntent: "no",
        cannibalizationRisk: "high",
        commercialSupport: "high",
        contentGapValue: "low",
      }),
    });
  }

  const query = `${seedText} ${title}`.trim();
  const overlap = findOverlappingContent(index, query, 8);
  const strongInsightOverlap = overlap.filter(
    (o) =>
      o.type === "Insight" &&
      o.overlapScore >= 8 &&
      isStrongContentCannibalization(o, seedText, title),
  );
  const serviceOverlap = overlap.filter((o) => o.type === "Service" && o.overlapScore >= 6);
  const solutionOverlap = overlap.filter((o) => o.type === "Solution" && o.overlapScore >= 6);
  const platformOverlap = overlap.filter((o) => o.type === "Platform" && o.overlapScore >= 6);
  const industryOverlap = overlap.filter((o) => o.type === "Industry" && o.overlapScore >= 6);
  const resourceOverlap = overlap.filter((o) =>
    ["Guide", "Comparison", "Checklist", "Glossary", "Template", "Tool"].includes(o.type),
  );
  const glossaryHit = resourceOverlap.find((o) => o.type === "Glossary" && o.overlapScore >= 8);

  const weakCoverage = coverage.filter((c) => c.gapLevel === "none" || c.gapLevel === "weak");
  const relatedWeak = weakCoverage.filter((c) =>
    query.toLowerCase().split(/\s+/).some((t) => t.length > 3 && c.title.toLowerCase().includes(t)),
  );

  const higherFactualReview = LEGAL_RE.test(`${title} ${summary} ${seedText}`);
  const evidenceCount = 1 + cluster.supporting.length;
  const hasOfficial = [anchor, ...cluster.supporting].some(
    (s) => s.sourceAuthorityType === "OFFICIAL" || s.sourceAuthorityType === "PRIMARY",
  );

  // Definitional → Glossary preference
  if (DEFINITION_RE.test(seedText) || DEFINITION_RE.test(title)) {
    if (glossaryHit) {
      return makeDraft({
        workingTitle: `Expand glossary: ${glossaryHit.title}`,
        coreTopic: seedText || title,
        recommendation: "EXPAND_EXISTING_RESOURCE",
        suggestedFormat: "GLOSSARY",
        existingContent: overlap,
        market,
        whyNow: "Definitional intent is already served or best served by Glossary.",
        whySmartlance: "Keep Insights for deeper diagnostic/decision content.",
        badge: "Update existing",
        higherFactualReview,
        signalTitles: [anchor.title],
        dimensions: dim({
          distinctIntent: "no",
          cannibalizationRisk: "high",
          contentGapValue: "low",
        }),
      });
    }
    return makeDraft({
      workingTitle: `Glossary: ${seedText || title}`.slice(0, 120),
      coreTopic: seedText || title,
      recommendation: "EXPAND_EXISTING_RESOURCE",
      suggestedFormat: "GLOSSARY",
      existingContent: overlap,
      market,
      whyNow: "Simple definitional need.",
      whySmartlance: "Glossary is the right format; avoid a long Insight for a definition.",
      badge: "Needs angle",
      higherFactualReview,
      signalTitles: [anchor.title],
      dimensions: dim({ contentGapValue: "medium", distinctIntent: "yes" }),
    });
  }

  if (CHECKLIST_RE.test(seedText) || CHECKLIST_RE.test(title)) {
    const checklist = resourceOverlap.find((o) => o.type === "Checklist");
    if (checklist) {
      return makeDraft({
        workingTitle: `Refresh checklist: ${checklist.title}`,
        coreTopic: seedText || title,
        recommendation: "EXPAND_EXISTING_RESOURCE",
        suggestedFormat: "CHECKLIST",
        existingContent: overlap,
        market,
        whyNow: "Checklist intent maps to existing Resource format.",
        whySmartlance: "Expand checklist rather than another Insight.",
        badge: "Update existing",
        higherFactualReview,
        signalTitles: [anchor.title],
        dimensions: dim({ cannibalizationRisk: "medium" }),
      });
    }
  }

  // Comparison intent → prefer existing Comparison resource
  if (COMPARISON_RE.test(seedText) || COMPARISON_RE.test(title)) {
    const comparison = resourceOverlap.find(
      (o) => o.type === "Comparison" && o.overlapScore >= 6,
    );
    if (comparison) {
      return makeDraft({
        workingTitle: `Refresh comparison: ${comparison.title}`,
        coreTopic: seedText || title,
        recommendation: "EXPAND_EXISTING_RESOURCE",
        suggestedFormat: "COMPARISON",
        existingContent: overlap,
        market,
        whyNow: "Comparison intent is already served by an existing Comparison resource.",
        whySmartlance:
          "Update the Comparison when facts/platforms change; avoid a near-duplicate Insight.",
        suggestedResources: [comparison.path],
        suggestedPlatforms: platformOverlap.map((s) => s.slug),
        badge: "Update existing",
        higherFactualReview,
        signalTitles: [anchor.title],
        dimensions: dim({
          distinctIntent: "no",
          cannibalizationRisk: "high",
          contentGapValue: "low",
        }),
      });
    }
    // No existing comparison — still prefer Comparison format over default Insight
    return makeDraft({
      workingTitle: deeperAngleTitle(seedText || title).slice(0, 120),
      coreTopic: seedText || title,
      recommendation: platformOverlap.length || serviceOverlap.length
        ? "SUPPORT_COMMERCIAL_PAGE"
        : "WRITE_NEW",
      suggestedFormat: "COMPARISON",
      existingContent: overlap,
      market,
      whyNow: "Decision intent is comparison-shaped; Comparison format fits better than a generic Insight.",
      whySmartlance:
        "Platform/service decision content should compare trade-offs clearly and support Platform pages where relevant.",
      commercialRelationship: platformOverlap[0]?.path || serviceOverlap[0]?.path,
      suggestedServices: serviceOverlap.map((s) => s.path),
      suggestedPlatforms: platformOverlap.map((s) => s.slug),
      badge: "Needs angle",
      higherFactualReview,
      signalTitles: [anchor.title, ...cluster.supporting.map((s) => s.title)].slice(0, 8),
      dimensions: dim({
        distinctIntent: "yes",
        contentGapValue: "medium",
        commercialSupport: platformOverlap.length ? "high" : "medium",
      }),
    });
  }

  // Strong Insight overlap → update / ignore
  if (strongInsightOverlap.length >= 1) {
    const top = strongInsightOverlap[0]!;
    const isTimely =
      anchor.freshness === "TIMELY" ||
      anchor.type === "NEWS" ||
      anchor.type === "PRODUCT_UPDATE" ||
      anchor.type === "OFFICIAL_GUIDANCE";
    if (isTimely && evidenceCount >= 1) {
      return makeDraft({
        workingTitle: `Refresh: ${top.title}`.slice(0, 120),
        coreTopic: seedText || top.title,
        question: `What changed that requires updating “${top.title}”?`,
        recommendation: "UPDATE_EXISTING",
        suggestedFormat: "INSIGHT",
        existingContent: overlap,
        market,
        whyNow: hasOfficial
          ? "Official/primary guidance or product updates may stale existing coverage."
          : "New signals relate to an existing Insight that already owns this intent.",
        whySmartlance: "Refresh is often more valuable than a new URL.",
        commercialRelationship: relatedWeak[0]
          ? `Supports ${relatedWeak[0].title}`
          : serviceOverlap[0]?.path,
        suggestedServices: serviceOverlap.map((s) => s.path),
        suggestedSolutions: solutionOverlap.map((s) => s.slug),
        suggestedPlatforms: platformOverlap.map((s) => s.slug),
        suggestedResources: resourceOverlap.map((s) => s.path),
        badge: "Update existing",
        higherFactualReview,
        signalTitles: [anchor.title, ...cluster.supporting.map((s) => s.title)].slice(0, 8),
        dimensions: dim({
          cannibalizationRisk: "high",
          distinctIntent: "no",
          evidenceReadiness: hasOfficial ? "high" : "medium",
          timeliness: "high",
        }),
        timeliness: "TIMELY",
        evergreenPotential: false,
      });
    }
    return makeDraft({
      workingTitle: title.slice(0, 120),
      coreTopic: seedText || title,
      recommendation: "IGNORE",
      suggestedFormat: "INSIGHT",
      existingContent: overlap,
      market,
      whyNow: "Existing Insight already covers substantially the same intent.",
      whySmartlance: "Avoid duplicate Insights.",
      badge: "Reject",
      higherFactualReview,
      signalTitles: [anchor.title],
      dimensions: dim({ cannibalizationRisk: "high", distinctIntent: "no" }),
    });
  }

  // Restates Service page only
  if (serviceOverlap.length && !strongInsightOverlap.length && overlap[0]?.type === "Service" && overlap[0].overlapScore >= 10) {
    const svc = serviceOverlap[0]!;
    // Prefer deeper support angle when coverage is weak
    if (relatedWeak.some((c) => c.path === svc.path) || relatedWeak.length) {
      return makeDraft({
        workingTitle: deeperAngleTitle(seedText || svc.title),
        coreTopic: seedText || svc.title,
        recommendation: "SUPPORT_COMMERCIAL_PAGE",
        suggestedFormat: "INSIGHT",
        existingContent: overlap,
        market,
        whyNow: "Commercial page exists; editorial depth around it is weaker.",
        whySmartlance: "Deeper diagnostic/decision Insight supports commercial authority without duplicating the Service page.",
        commercialRelationship: svc.path,
        suggestedServices: [svc.path],
        suggestedSolutions: solutionOverlap.map((s) => s.slug),
        suggestedPlatforms: platformOverlap.map((s) => s.slug),
        suggestedCta: svc.path,
        badge: "Strong opportunity",
        higherFactualReview,
        signalTitles: [anchor.title, ...cluster.supporting.map((s) => s.title)].slice(0, 8),
        dimensions: dim({
          commercialSupport: "high",
          contentGapValue: "high",
          distinctIntent: "partial",
          cannibalizationRisk: "medium",
        }),
      });
    }
    return makeDraft({
      workingTitle: `Update service page: ${svc.title}`,
      coreTopic: seedText || svc.title,
      recommendation: "UPDATE_SERVICE_PAGE",
      suggestedFormat: "SERVICE_UPDATE",
      existingContent: overlap,
      market,
      whyNow: "Need appears to be missing information on the Service page itself.",
      whySmartlance: "Prefer updating the Service over a duplicative Insight.",
      commercialRelationship: svc.path,
      suggestedServices: [svc.path],
      badge: "Update existing",
      higherFactualReview,
      signalTitles: [anchor.title],
      dimensions: dim({ commercialSupport: "high", cannibalizationRisk: "high" }),
    });
  }

  if (platformOverlap.length && (anchor.type === "PRODUCT_UPDATE" || /release|changelog|update/i.test(title))) {
    const p = platformOverlap[0]!;
    return makeDraft({
      workingTitle: `Platform update impact: ${p.title}`.slice(0, 120),
      coreTopic: seedText || title,
      recommendation: evidenceCount >= 2 ? "SUPPORT_COMMERCIAL_PAGE" : "UPDATE_PLATFORM_PAGE",
      suggestedFormat: evidenceCount >= 2 ? "INSIGHT" : "PLATFORM_UPDATE",
      existingContent: overlap,
      market,
      whyNow: "Platform/product change detected.",
      whySmartlance: "Assess whether Platform page refresh or supporting Insight is better.",
      commercialRelationship: p.path,
      suggestedPlatforms: [p.slug],
      badge: evidenceCount >= 2 ? "Needs angle" : "Update existing",
      higherFactualReview,
      signalTitles: [anchor.title, ...cluster.supporting.map((s) => s.title)].slice(0, 8),
      dimensions: dim({
        timeliness: "high",
        evidenceReadiness: hasOfficial ? "high" : "medium",
      }),
      timeliness: "TIMELY",
      evergreenPotential: false,
    });
  }

  // Solution page update when problem/diagnostic intent overlaps a Solution strongly
  if (
    solutionOverlap.length &&
    (/symptom|cause|diagnos|not generating|not ranking|slow website|outdated|conversion|leads|migrat/i.test(
      `${title} ${seedText}`,
    ) ||
      anchor.type === "QUESTION")
  ) {
    const sol = solutionOverlap[0]!;
    return makeDraft({
      workingTitle: `Update solution page: ${sol.title}`.slice(0, 120),
      coreTopic: seedText || sol.title,
      recommendation: "UPDATE_SOLUTION_PAGE",
      suggestedFormat: "SOLUTION_UPDATE",
      existingContent: overlap,
      market,
      whyNow: "Signal aligns with an existing problem-led Solution page.",
      whySmartlance:
        "Prefer refreshing the Solution diagnosis path over a duplicative Insight when the visitor need is problem recognition.",
      commercialRelationship: sol.path,
      suggestedSolutions: solutionOverlap.map((s) => s.slug),
      suggestedServices: serviceOverlap.map((s) => s.path),
      badge: "Update existing",
      higherFactualReview,
      signalTitles: [anchor.title, ...cluster.supporting.map((s) => s.title)].slice(0, 8),
      dimensions: dim({
        commercialSupport: "high",
        cannibalizationRisk: "medium",
        contentGapValue: "medium",
      }),
    });
  }

  // Industry page update when sector-specific overlap is the strongest commercial match
  if (
    industryOverlap.length &&
    industryOverlap[0]!.overlapScore >= 8 &&
    !serviceOverlap.some((s) => s.overlapScore > industryOverlap[0]!.overlapScore) &&
    /industry|sector|for (hotels|restaurants|clinics|lawyers|dentists|estate|hospitality)/i.test(
      `${title} ${seedText}`,
    )
  ) {
    const ind = industryOverlap[0]!;
    return makeDraft({
      workingTitle: `Update industry page: ${ind.title}`.slice(0, 120),
      coreTopic: seedText || ind.title,
      recommendation: "UPDATE_INDUSTRY_PAGE",
      suggestedFormat: "INDUSTRY_UPDATE",
      existingContent: overlap,
      market,
      whyNow: "Signal is sector-specific and maps to an existing Industry page.",
      whySmartlance:
        "Prefer Industry page specificity over a generic Insight when the need is industry framing.",
      commercialRelationship: ind.path,
      badge: "Update existing",
      higherFactualReview,
      signalTitles: [anchor.title],
      dimensions: dim({
        commercialSupport: "medium",
        contentGapValue: "medium",
        cannibalizationRisk: "medium",
      }),
    });
  }

  // Thin evidence → monitor
  if (evidenceCount < 2 && anchor.type === "NEWS" && !hasOfficial) {
    return makeDraft({
      workingTitle: title.slice(0, 120),
      coreTopic: seedText || title,
      recommendation: "MONITOR",
      suggestedFormat: "INSIGHT",
      existingContent: overlap,
      market,
      whyNow: "Single weak/early signal — too early for a full article.",
      whySmartlance: "Wait for corroboration or clearer audience impact.",
      badge: "Monitor",
      higherFactualReview,
      signalTitles: [anchor.title],
      dimensions: dim({ evidenceReadiness: "low", timeliness: "medium" }),
      timeliness: "TIMELY",
      evergreenPotential: false,
    });
  }

  // Default: write new with deeper angle when gap exists
  const supportPath =
    relatedWeak[0]?.path || serviceOverlap[0]?.path || solutionOverlap[0]?.path;
  const supportTitle =
    relatedWeak[0]?.title || serviceOverlap[0]?.title || solutionOverlap[0]?.title;
  return makeDraft({
    workingTitle: deeperAngleTitle(seedText || title).slice(0, 120),
    coreTopic: seedText || title,
    question: `What should a business decision-maker understand about ${seedText || title}?`,
    recommendation: supportPath ? "SUPPORT_COMMERCIAL_PAGE" : "WRITE_NEW",
    suggestedFormat: "INSIGHT",
    existingContent: overlap,
    market,
    whyNow:
      evidenceCount > 1
        ? `${evidenceCount} related signals support exploring this theme.`
        : "Seeded exploration with internal coverage check.",
    whySmartlance:
      "Smartlance can add practical, commercially aware guidance without hype — if a distinct reader need remains after overlap review.",
    uniqueValue: "Diagnostic, decision, or process angle rather than a generic overview.",
    commercialRelationship: supportPath || supportTitle,
    suggestedServices: serviceOverlap.map((s) => s.path),
    suggestedSolutions: solutionOverlap.map((s) => s.slug),
    suggestedPlatforms: platformOverlap.map((s) => s.slug),
    suggestedResources: resourceOverlap.map((s) => s.path),
    suggestedCta: serviceOverlap[0]?.path || solutionOverlap[0]?.path,
    badge: overlap.length ? "Needs angle" : "Strong opportunity",
    higherFactualReview,
    signalTitles: [anchor.title, ...cluster.supporting.map((s) => s.title)].slice(0, 8),
    dimensions: dim({
      audienceRelevance: "medium",
      businessRelevance: "medium",
      distinctIntent: overlap.length ? "partial" : "yes",
      contentGapValue: relatedWeak.length ? "high" : "medium",
      cannibalizationRisk: overlap.length ? "medium" : "low",
      evidenceReadiness: hasOfficial ? "high" : evidenceCount > 1 ? "medium" : "low",
      commercialSupport: supportPath ? "high" : "medium",
    }),
  });
}

function deeperAngleTitle(topic: string): string {
  const t = topic.trim();
  if (/redesign vs|migration|audit|brief/i.test(t)) return t;
  if (/slow|performance|vitals/i.test(t)) {
    return "Why a slow website can lose potential customers before they enquire";
  }
  if (/lead|enquir|convert/i.test(t)) {
    return "Why your website gets traffic but not enough enquiries";
  }
  if (/migrat/i.test(t)) {
    return "Website migration decisions that protect visibility and conversions";
  }
  return t.length > 8 ? t : `Practical guide: ${t}`;
}

function makeDraft(
  partial: Partial<AnalyzedOpportunityDraft> &
    Pick<
      AnalyzedOpportunityDraft,
      | "workingTitle"
      | "coreTopic"
      | "recommendation"
      | "suggestedFormat"
      | "existingContent"
      | "whyNow"
      | "whySmartlance"
      | "badge"
      | "higherFactualReview"
      | "signalTitles"
      | "dimensions"
    >,
): AnalyzedOpportunityDraft {
  return {
    question: partial.question,
    intent: partial.intent,
    audience: partial.audience || "Business decision-makers evaluating websites, SEO and digital platforms",
    market: partial.market || "global_en",
    timeliness: partial.timeliness || "HYBRID",
    evergreenPotential: partial.evergreenPotential ?? true,
    commercialRelationship: partial.commercialRelationship,
    uniqueValue: partial.uniqueValue,
    reasonToExist: partial.reasonToExist,
    suggestedServices: partial.suggestedServices || [],
    suggestedSolutions: partial.suggestedSolutions || [],
    suggestedPlatforms: partial.suggestedPlatforms || [],
    suggestedResources: partial.suggestedResources || [],
    suggestedCta: partial.suggestedCta,
    mergeKey: mergeKeyForOpportunity(partial.coreTopic, partial.market),
    ...partial,
  };
}

/** Cap distinct opportunity angles from a single seed. */
export function limitOpportunityAngles(
  drafts: AnalyzedOpportunityDraft[],
  max = 5,
): AnalyzedOpportunityDraft[] {
  const seen = new Set<string>();
  const out: AnalyzedOpportunityDraft[] = [];
  for (const d of drafts) {
    const key = d.mergeKey;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(d);
    if (out.length >= max) break;
  }
  return out;
}
