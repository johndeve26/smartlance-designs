/**
 * Deterministic Service → Solution relationship ranking.
 * Relevance > quantity. Never first-N by database/display order.
 */

export type ServiceRelationCandidate = {
  slug: string;
  name: string;
  title?: string | null;
  shortDescription?: string | null;
  category?: string | null;
  problemSymptoms?: unknown;
  possibleCauses?: unknown;
  relatedServiceHrefs?: unknown;
};

export type RankedSolutionRelation = {
  kind: "solution";
  slug: string;
  title: string;
  reason: string;
  /** Internal only — not for public display */
  _score: number;
};

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => {
      if (typeof v === "string") return v;
      if (v && typeof v === "object" && "text" in v) {
        return String((v as { text?: unknown }).text || "");
      }
      if (v && typeof v === "object" && "title" in v) {
        return String((v as { title?: unknown }).title || "");
      }
      return "";
    })
    .map((s) => s.trim())
    .filter(Boolean);
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 2 && !STOP.has(t)),
  );
}

const STOP = new Set([
  "the",
  "and",
  "for",
  "with",
  "your",
  "our",
  "this",
  "that",
  "from",
  "into",
  "when",
  "who",
  "what",
  "how",
  "are",
  "can",
  "may",
  "not",
  "you",
  "web",
  "site",
  "page",
  "smartlance",
  "designs",
]);

/** Service title/capability cues that map to common Solution problem language. */
const SERVICE_PROBLEM_HINTS: Array<{
  servicePattern: RegExp;
  problemTokens: string[];
}> = [
  {
    servicePattern: /redesign/i,
    problemTokens: [
      "outdated",
      "conversion",
      "conversions",
      "slow",
      "leads",
      "lead",
      "migration",
      "ux",
      "usability",
      "messaging",
      "structure",
    ],
  },
  {
    servicePattern: /development|build/i,
    problemTokens: [
      "slow",
      "performance",
      "migration",
      "platform",
      "technical",
      "broken",
      "bugs",
    ],
  },
  {
    servicePattern: /seo/i,
    problemTokens: ["seo", "search", "visibility", "ranking", "traffic", "leads"],
  },
  {
    servicePattern: /strategy/i,
    problemTokens: ["strategy", "direction", "priorit", "roadmap", "goals"],
  },
  {
    servicePattern: /design(?!s)/i,
    problemTokens: ["ux", "design", "visual", "usability", "outdated"],
  },
  {
    servicePattern: /migration/i,
    problemTokens: ["migration", "migrate", "platform", "move", "transfer"],
  },
];

function reciprocalLinksService(
  candidate: ServiceRelationCandidate,
  serviceHref: string | null | undefined,
): boolean {
  if (!serviceHref) return false;
  const hrefs = asStringList(candidate.relatedServiceHrefs);
  return hrefs.some(
    (h) => h === serviceHref || h.endsWith(serviceHref) || serviceHref.endsWith(h),
  );
}

function overlapScore(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const t of a) if (b.has(t)) n += 1;
  return n;
}

export function scoreServiceSolutionRelation(input: {
  serviceTitle: string;
  serviceHref?: string | null;
  serviceSummary?: string | null;
  serviceCapabilities?: unknown;
  serviceProblems?: unknown;
  candidate: ServiceRelationCandidate;
}): { score: number; reasons: string[] } {
  const { candidate } = input;
  const reasons: string[] = [];
  let score = 0;

  if (reciprocalLinksService(candidate, input.serviceHref)) {
    score += 100;
    reasons.push(
      `${candidate.name} already links to this Service — reciprocal relevance.`,
    );
  }

  const serviceBlob = [
    input.serviceTitle,
    input.serviceSummary || "",
    asStringList(input.serviceCapabilities).join(" "),
    asStringList(input.serviceProblems).join(" "),
  ].join(" ");
  const serviceTokens = tokenize(serviceBlob);

  const solutionBlob = [
    candidate.name,
    candidate.title || "",
    candidate.shortDescription || "",
    candidate.category || "",
    asStringList(candidate.problemSymptoms).join(" "),
    asStringList(candidate.possibleCauses).join(" "),
  ].join(" ");
  const solutionTokens = tokenize(solutionBlob);

  const overlap = overlapScore(serviceTokens, solutionTokens);
  if (overlap >= 2) {
    score += overlap * 8;
    reasons.push(
      `Shared problem/capability language with ${candidate.name} (${overlap} overlapping terms).`,
    );
  } else if (overlap === 1) {
    score += 4;
  }

  for (const hint of SERVICE_PROBLEM_HINTS) {
    if (!hint.servicePattern.test(input.serviceTitle)) continue;
    // Prefer more specific redesign/migration hints over broad "design" when both match
    if (
      hint.servicePattern.source.includes("design(?!s)") &&
      /redesign|migration/i.test(input.serviceTitle)
    ) {
      continue;
    }
    const hit = hint.problemTokens.filter(
      (t) => solutionTokens.has(t) || solutionBlob.toLowerCase().includes(t),
    );
    if (hit.length) {
      score += 20 + hit.length * 5;
      reasons.push(
        `${input.serviceTitle} can address ${hit.slice(0, 3).join(", ")} issues described by ${candidate.name}.`,
      );
    }
  }

  // Distinct journey value: problem-led Solutions that name a concrete visitor pain
  if (
    /outdated|slow|conversion|lead|migration|broken|not generating|visibility/i.test(
      candidate.name,
    )
  ) {
    score += 6;
  }

  return { score, reasons };
}

const DEFAULT_MIN_SCORE = 24;
const DEFAULT_MAX = 5;

/**
 * Rank Solutions for a Service. Weak candidates are excluded.
 * Order is by relevance score, never input order.
 */
export function rankSolutionsForService(input: {
  serviceTitle: string;
  serviceHref?: string | null;
  serviceSummary?: string | null;
  serviceCapabilities?: unknown;
  serviceProblems?: unknown;
  candidates: ServiceRelationCandidate[];
  minScore?: number;
  max?: number;
}): RankedSolutionRelation[] {
  const minScore = input.minScore ?? DEFAULT_MIN_SCORE;
  const max = input.max ?? DEFAULT_MAX;

  const scored = input.candidates.map((candidate) => {
    const { score, reasons } = scoreServiceSolutionRelation({
      serviceTitle: input.serviceTitle,
      serviceHref: input.serviceHref,
      serviceSummary: input.serviceSummary,
      serviceCapabilities: input.serviceCapabilities,
      serviceProblems: input.serviceProblems,
      candidate,
    });
    return { candidate, score, reasons };
  });

  scored.sort((a, b) => b.score - a.score || a.candidate.name.localeCompare(b.candidate.name));

  return scored
    .filter((s) => s.score >= minScore)
    .slice(0, max)
    .map((s) => ({
      kind: "solution" as const,
      slug: s.candidate.slug,
      title: s.candidate.name,
      reason:
        s.reasons[0] ||
        `${input.serviceTitle} addresses problems visitors recognize on ${s.candidate.name}.`,
      _score: s.score,
    }));
}
