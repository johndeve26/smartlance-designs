import type { AIClaim, AIClaimSource, AIResearchSource } from "@prisma/client";

export type EditorialBlocker = {
  id: string;
  severity: "BLOCKER" | "WARNING" | "REVIEW";
  category: string;
  message: string;
  hard?: boolean; // cannot be overridden (security)
};

export type ClaimWithSources = AIClaim & {
  sources: Array<AIClaimSource & { source?: AIResearchSource }>;
};

const FAKE_SMARTLANCE =
  /smartlance.*(increased|improved|grew|boosted).*\d+\s*%|conversions?\s+by\s+\d+/i;
const FAKE_TESTIMONIAL =
  /["“].{20,}["”].*(client|customer)\s+(said|says|noted)/i;
const FAKE_CERT =
  /(google\s+partner|shopify\s+partner|meta\s+partner|certified\s+specialist)/i;
const UNSUPPORTED_STAT = /\b\d{1,3}\s*%\b|\b\d{2,}\s*%\s+of\b/i;

export function computeEditorialBlockers(input: {
  draftMarkdown?: string | null;
  uniqueValue?: string | null;
  factCheckJson?: unknown;
  claims?: ClaimWithSources[];
  commodityWarning?: boolean;
  analysisStale?: unknown;
  cannibalization?: unknown;
}): EditorialBlocker[] {
  const blockers: EditorialBlocker[] = [];
  const draft = input.draftMarkdown || "";

  if (!draft.trim()) {
    blockers.push({
      id: "no-draft",
      severity: "BLOCKER",
      category: "DRAFT",
      message: "Draft content is required before CMS approval.",
    });
  }
  if (!input.uniqueValue?.trim()) {
    blockers.push({
      id: "no-unique-value",
      severity: "BLOCKER",
      category: "ORIGINAL_VALUE",
      message: "Unique Smartlance value statement is required.",
    });
  }
  if (!input.factCheckJson) {
    blockers.push({
      id: "no-fact-check",
      severity: "BLOCKER",
      category: "FACTUAL_SUPPORT",
      message: "Fact check must be completed before approval.",
    });
  }

  const stale = input.analysisStale as Record<string, boolean> | null;
  if (stale?.factCheck) {
    blockers.push({
      id: "stale-fact-check",
      severity: "BLOCKER",
      category: "FACTUAL_SUPPORT",
      message: "Fact check is stale after draft/source changes — rerun required.",
    });
  }

  for (const c of input.claims || []) {
    const text = c.claimText;
    if (FAKE_SMARTLANCE.test(text) && c.support !== "SUPPORTED_INTERNAL") {
      blockers.push({
        id: `fake-result-${c.id}`,
        severity: "BLOCKER",
        category: "HALLUCINATION_RISK",
        message: `Unsupported Smartlance performance claim: “${text.slice(0, 120)}”`,
      });
    }
    if (FAKE_CERT.test(text) && c.support !== "SUPPORTED_INTERNAL") {
      blockers.push({
        id: `fake-cert-${c.id}`,
        severity: "BLOCKER",
        category: "HALLUCINATION_RISK",
        message: `Unverified partnership/certification language: “${text.slice(0, 120)}”`,
      });
    }
    if (c.support === "UNSUPPORTED" && UNSUPPORTED_STAT.test(text)) {
      blockers.push({
        id: `stat-${c.id}`,
        severity: "BLOCKER",
        category: "FACTUAL_SUPPORT",
        message: `Unsupported statistic: “${text.slice(0, 120)}”`,
      });
    }
    for (const link of c.sources || []) {
      if (
        link.evidenceStrength === "INSUFFICIENT" &&
        c.support === "SUPPORTED_EXTERNAL"
      ) {
        blockers.push({
          id: `mismatch-${c.id}-${link.sourceId}`,
          severity: "BLOCKER",
          category: "SOURCE_ACCURACY",
          message: `Cited source does not adequately support claim: “${text.slice(0, 100)}”`,
        });
      }
      if (link.evidenceStrength === "PARTIAL") {
        blockers.push({
          id: `partial-${c.id}-${link.sourceId}`,
          severity: "WARNING",
          category: "SOURCE_ACCURACY",
          message: `Partial source support — review remaining assertion: “${text.slice(0, 100)}”`,
        });
      }
    }
  }

  if (FAKE_TESTIMONIAL.test(draft)) {
    blockers.push({
      id: "fake-testimonial-draft",
      severity: "BLOCKER",
      category: "HALLUCINATION_RISK",
      message: "Draft appears to invent a client quote. Use verified Testimonials only.",
    });
  }

  const cann = input.cannibalization as { classification?: string } | null;
  if (
    cann?.classification === "POTENTIAL_CANNIBALIZATION" ||
    cann?.classification === "BETTER_AS_UPDATE"
  ) {
    blockers.push({
      id: "cannibalization",
      severity: "WARNING",
      category: "CANNIBALIZATION_HANDLING",
      message:
        "Overlap with existing content — prefer update/refresh over a new URL unless angle is clearly distinct.",
    });
  }

  if (input.commodityWarning) {
    blockers.push({
      id: "commodity",
      severity: "WARNING",
      category: "ORIGINAL_VALUE",
      message:
        "Commodity content risk — strengthen unique Smartlance angle or consider not creating this article.",
    });
  }

  return blockers;
}

export function approvalSummary(blockers: EditorialBlocker[]): {
  ready: boolean;
  blockerCount: number;
  warningCount: number;
  headline: string;
} {
  const blockerCount = blockers.filter((b) => b.severity === "BLOCKER").length;
  const warningCount = blockers.filter((b) => b.severity === "WARNING").length;
  return {
    ready: blockerCount === 0,
    blockerCount,
    warningCount,
    headline:
      blockerCount === 0
        ? "Ready for CMS (after human checklist)"
        : `${blockerCount} blocker${blockerCount === 1 ? "" : "s"} require attention`,
  };
}
