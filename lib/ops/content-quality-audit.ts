/**
 * Content Quality Audit — deterministic published-content review.
 * Read-only: never writes CMS drafts, never publishes, never rewrites.
 *
 * Prompt versions (evaluation contracts):
 * site-content-audit:v1
 * service-content-audit:v1
 * solution-content-audit:v1
 * platform-content-audit:v1
 * industry-content-audit:v1
 * work-content-audit:v1
 * resource-content-audit:v1
 * homepage-content-audit:v1
 */

import { hasDatabaseUrl, prisma } from "@/lib/db";

export const CONTENT_AUDIT_VERSION = "site-content-audit:v1";

export type ContentAuditVerdict =
  | "STRONG"
  | "LIGHT_POLISH"
  | "NEEDS_IMPROVEMENT"
  | "NEEDS_RESEARCH"
  | "NEEDS_PROOF_REVIEW"
  | "NEEDS_STRUCTURAL_REVIEW"
  | "DUPLICATE_CANNIBALIZATION_REVIEW"
  | "STALE"
  | "BLOCKED_BY_MISSING_FACTS";

export type ContentAuditPriority = "HIGH" | "NORMAL" | "LOW";
export type FindingSeverity = "BLOCKER" | "HIGH" | "NORMAL" | "LOW";

export type ContentAssistantHint =
  | "SERVICE"
  | "SOLUTION"
  | "PLATFORM"
  | "INDUSTRY"
  | "WORK"
  | "TESTIMONIAL"
  | "GUIDE"
  | "COMPARISON"
  | "CHECKLIST"
  | "GLOSSARY"
  | "TEMPLATE"
  | "TOOL"
  | "HOMEPAGE"
  | "INSIGHT"
  | null;

export type ContentAuditFinding = {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  route: string;
  category: string;
  severity: FindingSeverity;
  message: string;
  evidence?: string;
  recommendedAction: string;
  assistantType: ContentAssistantHint;
  assistantAction?: string;
  editorHref: string;
  handoffLabel: string;
  status: "OPEN";
};

export type ContentAuditPageResult = {
  entityType: string;
  entityId: string;
  title: string;
  route: string;
  verdict: ContentAuditVerdict;
  priority: ContentAuditPriority;
  whatWorks: string[];
  findings: ContentAuditFinding[];
  lastUpdated: string | null;
  lastReviewedAt: string | null;
  editorHref: string;
  recommendedNextAction: string | null;
};

export type SiteLevelFinding = {
  id: string;
  category: string;
  severity: FindingSeverity;
  message: string;
  evidence?: string;
  recommendedAction: string;
};

export type ContentAuditSummary = {
  pagesReviewed: number;
  openFindings: number;
  needsResearch: number;
  proofReview: number;
  highPriority: number;
  strongPages: number;
  byType: Record<string, number>;
  byVerdict: Record<string, number>;
};

export type ContentAuditReport = {
  version: string;
  auditedAt: string;
  publishedOnly: true;
  summary: ContentAuditSummary;
  pages: ContentAuditPageResult[];
  siteFindings: SiteLevelFinding[];
  firstImprovementWave: Array<{
    order: number;
    entityType: string;
    title: string;
    route: string;
    priority: ContentAuditPriority;
    verdict: ContentAuditVerdict;
    assistantType: ContentAssistantHint;
    action: string;
    editorHref: string;
    why: string;
  }>;
};

function textLen(v: unknown): number {
  return typeof v === "string" ? v.trim().length : 0;
}

function arrLen(v: unknown): number {
  return Array.isArray(v) ? v.length : 0;
}

function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

function findingId(
  entityType: string,
  entityId: string,
  category: string,
  suffix: string,
): string {
  return `${entityType}:${entityId}:${category}:${suffix}`;
}

function genericAgencyCopy(text: string): boolean {
  return /\b(innovative digital experiences|transform(ing)? businesses|unlock growth|cutting[- ]edge|synergy|holistic solutions|next[- ]level)\b/i.test(
    text,
  );
}

function unsupportedTrustClaim(text: string): boolean {
  return /\b(trusted by|serving)\s+\d+\+?\s*(businesses|clients|companies)|award[- ]winning|#1 agency|\bguaranteed (results|rankings)\b/i.test(
    text,
  );
}

function pickVerdict(
  findings: ContentAuditFinding[],
  defaults: ContentAuditVerdict = "STRONG",
): ContentAuditVerdict {
  if (findings.some((f) => f.category === "PROOF" && f.severity === "BLOCKER")) {
    return "NEEDS_PROOF_REVIEW";
  }
  if (findings.some((f) => f.category === "RESEARCH" && f.severity !== "LOW")) {
    return "NEEDS_RESEARCH";
  }
  if (
    findings.some((f) => f.category === "DUPLICATION" && f.severity !== "LOW")
  ) {
    return "DUPLICATE_CANNIBALIZATION_REVIEW";
  }
  if (findings.some((f) => f.severity === "BLOCKER" || f.severity === "HIGH")) {
    if (findings.some((f) => f.category === "STRUCTURE")) {
      return "NEEDS_STRUCTURAL_REVIEW";
    }
    return "NEEDS_IMPROVEMENT";
  }
  if (findings.some((f) => f.severity === "NORMAL")) {
    return "LIGHT_POLISH";
  }
  if (findings.length === 0) return defaults;
  return "LIGHT_POLISH";
}

function pickPriority(
  entityType: string,
  verdict: ContentAuditVerdict,
  commercialCore: boolean,
): ContentAuditPriority {
  if (
    verdict === "NEEDS_PROOF_REVIEW" ||
    (commercialCore &&
      (verdict === "NEEDS_IMPROVEMENT" ||
        verdict === "NEEDS_RESEARCH" ||
        verdict === "NEEDS_STRUCTURAL_REVIEW"))
  ) {
    return "HIGH";
  }
  if (
    commercialCore ||
    verdict === "NEEDS_IMPROVEMENT" ||
    verdict === "NEEDS_RESEARCH" ||
    verdict === "DUPLICATE_CANNIBALIZATION_REVIEW"
  ) {
    return "NORMAL";
  }
  return "LOW";
}

const COMMERCIAL_SERVICE_SLUGS = new Set([
  "website-design",
  "website-development",
  "website-redesign",
  "website-strategy",
  "conversion-rate-optimization",
  "website-performance-optimization",
  "website-migration",
  "ecommerce-development",
  "website-audit",
  "landing-page-design",
  "ui-ux-design",
  "seo-copywriting",
]);

function handoffFor(
  assistant: ContentAssistantHint,
  actionHint: string,
): { handoffLabel: string; assistantAction?: string } {
  switch (assistant) {
    case "SERVICE":
      return { handoffLabel: "Improve Service", assistantAction: actionHint };
    case "SOLUTION":
      return { handoffLabel: "Improve Solution", assistantAction: actionHint };
    case "PLATFORM":
      return {
        handoffLabel: "Research Platform",
        assistantAction: actionHint || "RESEARCH_AND_IMPROVE",
      };
    case "INDUSTRY":
      return {
        handoffLabel: "Improve Industry",
        assistantAction: actionHint,
      };
    case "WORK":
      return { handoffLabel: "Review Case Study", assistantAction: actionHint };
    case "HOMEPAGE":
      return {
        handoffLabel: "Improve Homepage",
        assistantAction: actionHint,
      };
    case "GUIDE":
      return { handoffLabel: "Expand Guide", assistantAction: actionHint };
    case "COMPARISON":
      return { handoffLabel: "Update Comparison", assistantAction: actionHint };
    case "CHECKLIST":
      return { handoffLabel: "Improve Checklist", assistantAction: actionHint };
    case "GLOSSARY":
      return { handoffLabel: "Improve Glossary", assistantAction: actionHint };
    case "TEMPLATE":
      return {
        handoffLabel: "Update Template copy",
        assistantAction: actionHint,
      };
    case "TOOL":
      return {
        handoffLabel: "Improve Tool copy",
        assistantAction: actionHint,
      };
    case "INSIGHT":
      return {
        handoffLabel: "Open Insight (editorial review)",
        assistantAction: undefined,
      };
    case "TESTIMONIAL":
      return {
        handoffLabel: "Open Testimonial (no rewrite)",
        assistantAction: undefined,
      };
    default:
      return { handoffLabel: "Open page", assistantAction: undefined };
  }
}

function editorHrefWithAiAction(
  editorHref: string,
  assistantAction?: string,
): string {
  if (!assistantAction) return editorHref;
  const params = new URLSearchParams();
  if (
    assistantAction.includes("RESEARCH") ||
    assistantAction === "CHECK_FRESHNESS"
  ) {
    params.set("aiAction", "research");
  } else if (
    assistantAction.includes("IMPROVE") ||
    assistantAction === "FILL_MISSING" ||
    assistantAction === "BUILD_FROM_PROJECT_FACTS"
  ) {
    params.set("aiAction", "improve");
  } else {
    return editorHref;
  }
  const join = editorHref.includes("?") ? "&" : "?";
  return `${editorHref}${join}${params.toString()}`;
}

function mkFinding(input: {
  entityType: string;
  entityId: string;
  title: string;
  route: string;
  category: string;
  severity: FindingSeverity;
  message: string;
  evidence?: string;
  recommendedAction: string;
  assistantType: ContentAssistantHint;
  assistantAction?: string;
  editorHref: string;
  suffix: string;
}): ContentAuditFinding {
  const h = handoffFor(input.assistantType, input.assistantAction || "");
  return {
    id: findingId(
      input.entityType,
      input.entityId,
      input.category,
      input.suffix,
    ),
    entityType: input.entityType,
    entityId: input.entityId,
    title: input.title,
    route: input.route,
    category: input.category,
    severity: input.severity,
    message: input.message,
    evidence: input.evidence,
    recommendedAction: input.recommendedAction,
    assistantType: input.assistantType,
    assistantAction: input.assistantAction || h.assistantAction,
    editorHref: editorHrefWithAiAction(
      input.editorHref,
      input.assistantAction || h.assistantAction,
    ),
    handoffLabel: h.handoffLabel,
    status: "OPEN",
  };
}

/** Pure helpers exported for fixture tests */
export function auditServiceFields(input: {
  id: string;
  slug: string;
  title: string;
  href: string;
  summary: string;
  description: string;
  narrative: string | null;
  problems: unknown;
  deliverables: unknown;
  process: unknown;
  faqs: unknown;
  seoTitle: string | null;
  seoDescription: string | null;
  primaryCtaLabel: string | null;
  relatedSolutionSlugs: unknown;
  relatedProjectSlugs: unknown;
  relatedPlatformSlugs: unknown;
  updatedAt?: Date | null;
}): ContentAuditPageResult {
  const editorHref = `/admin/services/${input.id}`;
  const route = input.href || `/services/${input.slug}`;
  const findings: ContentAuditFinding[] = [];
  const whatWorks: string[] = [];
  const blob = `${input.summary} ${input.description} ${input.narrative || ""}`;

  if (textLen(input.summary) >= 40) whatWorks.push("Clear summary present");
  if (arrLen(input.problems) >= 3) whatWorks.push("Problems section populated");
  if (arrLen(input.deliverables) >= 3) whatWorks.push("Deliverables present");
  if (arrLen(input.process) >= 3) whatWorks.push("Process present");
  if (input.seoTitle?.trim()) whatWorks.push("SEO title present");

  if (textLen(input.description) < 120) {
    findings.push(
      mkFinding({
        entityType: "Service",
        entityId: input.id,
        title: input.title,
        route,
        category: "COMPLETENESS",
        severity: "HIGH",
        message: "Service description is thin for a commercial capability page.",
        evidence: `description length ${textLen(input.description)}`,
        recommendedAction: "Expand capability, audience, and outcomes with Service AI.",
        assistantType: "SERVICE",
        assistantAction: "IMPROVE_SERVICE",
        editorHref,
        suffix: "thin-desc",
      }),
    );
  }

  if (arrLen(input.relatedSolutionSlugs) === 0) {
    findings.push(
      mkFinding({
        entityType: "Service",
        entityId: input.id,
        title: input.title,
        route,
        category: "RELATIONSHIPS",
        severity: "NORMAL",
        message: "No related Solutions linked — weak commercial routing.",
        recommendedAction: "Add relevant Solution relationships (human or suggest via Service AI).",
        assistantType: "SERVICE",
        assistantAction: "SUGGEST_INTERNAL_LINKS",
        editorHref,
        suffix: "no-solutions",
      }),
    );
  }

  if (!input.primaryCtaLabel?.trim()) {
    findings.push(
      mkFinding({
        entityType: "Service",
        entityId: input.id,
        title: input.title,
        route,
        category: "CTA",
        severity: "NORMAL",
        message: "Primary CTA label missing — page may fall back to generic contact patterns.",
        recommendedAction: "Set a specific CTA (Tell Us About Your Project / Free Website Review as appropriate).",
        assistantType: "SERVICE",
        assistantAction: "IMPROVE_SERVICE",
        editorHref,
        suffix: "cta",
      }),
    );
  }

  if (genericAgencyCopy(blob)) {
    findings.push(
      mkFinding({
        entityType: "Service",
        entityId: input.id,
        title: input.title,
        route,
        category: "COPY",
        severity: "HIGH",
        message: "Generic agency / hype language detected.",
        evidence: "Matched banned marketing filler patterns",
        recommendedAction: "Rewrite with specific Smartlance capability language via Service AI.",
        assistantType: "SERVICE",
        assistantAction: "IMPROVE_SERVICE",
        editorHref,
        suffix: "generic",
      }),
    );
  }

  if (unsupportedTrustClaim(blob)) {
    findings.push(
      mkFinding({
        entityType: "Service",
        entityId: input.id,
        title: input.title,
        route,
        category: "PROOF",
        severity: "BLOCKER",
        message: "Unsupported trust / metric claim language present.",
        recommendedAction: "Remove or replace with verified claims only.",
        assistantType: "SERVICE",
        assistantAction: "REVIEW_SERVICE",
        editorHref,
        suffix: "trust",
      }),
    );
  }

  if (!input.seoTitle?.trim() || !input.seoDescription?.trim()) {
    findings.push(
      mkFinding({
        entityType: "Service",
        entityId: input.id,
        title: input.title,
        route,
        category: "SEO",
        severity: "NORMAL",
        message: "SEO title or description missing.",
        recommendedAction: "Generate SEO with Service AI, then human-review.",
        assistantType: "SERVICE",
        assistantAction: "GENERATE_SEO",
        editorHref,
        suffix: "seo",
      }),
    );
  }

  // Website cluster differentiation note (audit guidance, not auto-merge)
  if (
    [
      "website-design",
      "website-development",
      "website-redesign",
      "website-strategy",
      "ui-ux-design",
    ].includes(input.slug) &&
    textLen(input.narrative) < 200
  ) {
    findings.push(
      mkFinding({
        entityType: "Service",
        entityId: input.id,
        title: input.title,
        route,
        category: "DIFFERENTIATION",
        severity: "NORMAL",
        message:
          "Website-cluster Service — ensure narrative clearly differentiates from neighboring Services.",
        recommendedAction: "Polish differentiation with Service AI (Improve Service).",
        assistantType: "SERVICE",
        assistantAction: "IMPROVE_SERVICE",
        editorHref,
        suffix: "cluster",
      }),
    );
  }

  const verdict = pickVerdict(findings);
  const priority = pickPriority(
    "Service",
    verdict,
    COMMERCIAL_SERVICE_SLUGS.has(input.slug),
  );

  return {
    entityType: "Service",
    entityId: input.id,
    title: input.title,
    route,
    verdict,
    priority,
    whatWorks,
    findings,
    lastUpdated: iso(input.updatedAt),
    lastReviewedAt: null,
    editorHref,
    recommendedNextAction:
      findings[0]?.handoffLabel ||
      (verdict === "STRONG" ? "No change recommended" : null),
  };
}

export function auditIndustryFields(input: {
  id: string;
  slug: string;
  name: string;
  description: string;
  group: string;
  proven: boolean;
  relatedServiceLinks: unknown;
  relatedSolutionSlugs: unknown;
  workLinkCount: number;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt?: Date | null;
}): ContentAuditPageResult {
  const editorHref = `/admin/industries/${input.id}`;
  const route = `/industries#${input.slug}`;
  const findings: ContentAuditFinding[] = [];
  const whatWorks: string[] = [];

  if (input.proven && input.workLinkCount > 0) {
    whatWorks.push("Verified project experience linked to Work");
  }
  if (!input.proven) {
    whatWorks.push("Correctly marked supported (not over-claiming proven)");
  }
  if (arrLen(input.relatedServiceLinks) > 0) {
    whatWorks.push("Related Services present");
  }

  if (textLen(input.description) < 160) {
    findings.push(
      mkFinding({
        entityType: "Industry",
        entityId: input.id,
        title: input.name,
        route,
        category: "COMPLETENESS",
        severity: input.proven ? "HIGH" : "NORMAL",
        message:
          "Industry copy is a short blurb — likely interchangeable with other industries if the name changed.",
        evidence: `description length ${textLen(input.description)}`,
        recommendedAction:
          "Use Industry AI to add sector-specific problems, buyer journey, and service application — without inventing experience.",
        assistantType: "INDUSTRY",
        assistantAction: "IMPROVE_INDUSTRY",
        editorHref,
        suffix: "thin",
      }),
    );
  }

  if (arrLen(input.relatedSolutionSlugs) === 0) {
    findings.push(
      mkFinding({
        entityType: "Industry",
        entityId: input.id,
        title: input.name,
        route,
        category: "RELATIONSHIPS",
        severity: "LOW",
        message: "No related Solutions linked.",
        recommendedAction: "Link relevant Solutions where genuinely applicable.",
        assistantType: "INDUSTRY",
        assistantAction: "IMPROVE_INDUSTRY",
        editorHref,
        suffix: "no-sol",
      }),
    );
  }

  if (!input.seoTitle?.trim()) {
    findings.push(
      mkFinding({
        entityType: "Industry",
        entityId: input.id,
        title: input.name,
        route,
        category: "SEO",
        severity: "NORMAL",
        message: "SEO title missing.",
        recommendedAction: "Generate Industry SEO with Industry AI.",
        assistantType: "INDUSTRY",
        assistantAction: "GENERATE_SEO",
        editorHref,
        suffix: "seo",
      }),
    );
  }

  if (input.proven && input.workLinkCount === 0) {
    findings.push(
      mkFinding({
        entityType: "Industry",
        entityId: input.id,
        title: input.name,
        route,
        category: "PROOF",
        severity: "HIGH",
        message:
          "Marked proven experience but no Work links — public proof gap or data inconsistency.",
        recommendedAction: "Link verified Work or review experience flag with a human.",
        assistantType: "INDUSTRY",
        editorHref,
        suffix: "proven-no-work",
      }),
    );
  }

  const verdict = pickVerdict(findings, "LIGHT_POLISH");
  const priority = pickPriority(
    "Industry",
    verdict,
    input.proven ||
      ["short-term-rentals", "real-estate", "ecommerce", "professional-services"].includes(
        input.slug,
      ),
  );

  return {
    entityType: "Industry",
    entityId: input.id,
    title: input.name,
    route,
    verdict,
    priority,
    whatWorks,
    findings,
    lastUpdated: iso(input.updatedAt),
    lastReviewedAt: null,
    editorHref,
    recommendedNextAction: findings[0]?.handoffLabel || "No change recommended",
  };
}

export function auditPlatformFields(input: {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  capabilities: unknown;
  whenItFits: unknown;
  challenges: unknown;
  verifiedExperience: boolean;
  lastReviewedAt: Date | null;
  seoTitle: string | null;
  seoDescription: string | null;
  relatedServiceHrefs: unknown;
  updatedAt?: Date | null;
}): ContentAuditPageResult {
  const editorHref = `/admin/platforms/${input.id}`;
  const route = `/platforms/${input.slug}`;
  const findings: ContentAuditFinding[] = [];
  const whatWorks: string[] = [];

  if (arrLen(input.capabilities) >= 5) whatWorks.push("Capabilities listed");
  if (arrLen(input.whenItFits) >= 3) whatWorks.push("Fit guidance present");
  if (arrLen(input.challenges) >= 3) whatWorks.push("Limitations / challenges present");
  if (arrLen(input.relatedServiceHrefs) >= 3) whatWorks.push("Related Services linked");
  if (input.seoTitle?.trim()) whatWorks.push("SEO present");

  if (!input.lastReviewedAt) {
    findings.push(
      mkFinding({
        entityType: "Platform",
        entityId: input.id,
        title: input.name,
        route,
        category: "RESEARCH",
        severity: input.slug === "wordpress" || input.slug === "shopify" || input.slug === "webflow"
          ? "HIGH"
          : "NORMAL",
        message:
          "No lastReviewedAt — Platform facts have not been through a recorded factual review.",
        recommendedAction:
          "Run Platform AI → Research & improve later (do not invent product claims from memory).",
        assistantType: "PLATFORM",
        assistantAction: "RESEARCH_AND_IMPROVE",
        editorHref: `${editorHref}?aiAction=research`,
        suffix: "never-reviewed",
      }),
    );
  }

  if (textLen(input.description) < 150) {
    findings.push(
      mkFinding({
        entityType: "Platform",
        entityId: input.id,
        title: input.name,
        route,
        category: "COMPLETENESS",
        severity: "NORMAL",
        message: "Platform description is relatively short.",
        recommendedAction: "Expand fit/trade-offs after research.",
        assistantType: "PLATFORM",
        assistantAction: "IMPROVE_PLATFORM",
        editorHref,
        suffix: "thin",
      }),
    );
  }

  const verdict = pickVerdict(findings, "NEEDS_RESEARCH");
  const priority = pickPriority(
    "Platform",
    verdict,
    ["wordpress", "shopify", "webflow", "woocommerce"].includes(input.slug),
  );

  return {
    entityType: "Platform",
    entityId: input.id,
    title: input.name,
    route,
    verdict: input.lastReviewedAt ? verdict : "NEEDS_RESEARCH",
    priority,
    whatWorks,
    findings,
    lastUpdated: iso(input.updatedAt),
    lastReviewedAt: iso(input.lastReviewedAt),
    editorHref,
    recommendedNextAction: "Research Platform",
  };
}

export function auditHomepageFields(input: {
  heroHeadline: string;
  heroSupporting: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  seoTitle: string | null;
  seoDescription: string | null;
  curatedServiceCount: number;
  curatedTestimonialCount: number;
  updatedAt?: Date | null;
}): ContentAuditPageResult {
  const editorHref = "/admin/homepage";
  const findings: ContentAuditFinding[] = [];
  const whatWorks: string[] = [];
  const blob = `${input.heroHeadline} ${input.heroSupporting}`;

  if (input.heroHeadline.trim()) whatWorks.push("Hero headline present");
  if (/Tell Us About Your Project|View Our Work|Explore/i.test(input.primaryCtaLabel)) {
    whatWorks.push("Specific primary CTA");
  }
  if (input.curatedServiceCount >= 4) whatWorks.push("Curated Services present");
  if (input.curatedTestimonialCount >= 1) {
    whatWorks.push("Curated Testimonials configured");
  }

  if (!input.seoTitle?.trim() || !input.seoDescription?.trim()) {
    findings.push(
      mkFinding({
        entityType: "Homepage",
        entityId: "home",
        title: "Homepage",
        route: "/",
        category: "SEO",
        severity: "HIGH",
        message: "Published Homepage SEO title/description missing.",
        recommendedAction: "Homepage Copy Assistant → Generate SEO → apply to draft → publish.",
        assistantType: "HOMEPAGE",
        assistantAction: "GENERATE_SEO",
        editorHref,
        suffix: "seo",
      }),
    );
  }

  if (unsupportedTrustClaim(blob)) {
    findings.push(
      mkFinding({
        entityType: "Homepage",
        entityId: "home",
        title: "Homepage",
        route: "/",
        category: "PROOF",
        severity: "BLOCKER",
        message: "Unsupported trust claim on Homepage.",
        recommendedAction: "Remove invented trust metrics.",
        assistantType: "HOMEPAGE",
        assistantAction: "REVIEW_HOMEPAGE",
        editorHref,
        suffix: "trust",
      }),
    );
  }

  if (genericAgencyCopy(blob)) {
    findings.push(
      mkFinding({
        entityType: "Homepage",
        entityId: "home",
        title: "Homepage",
        route: "/",
        category: "COPY",
        severity: "HIGH",
        message: "Generic agency language in hero.",
        recommendedAction: "Improve hero with Homepage Copy Assistant.",
        assistantType: "HOMEPAGE",
        assistantAction: "IMPROVE_HERO",
        editorHref,
        suffix: "generic",
      }),
    );
  }

  if (textLen(input.heroSupporting) < 80) {
    findings.push(
      mkFinding({
        entityType: "Homepage",
        entityId: "home",
        title: "Homepage",
        route: "/",
        category: "COMPLETENESS",
        severity: "NORMAL",
        message: "Hero supporting copy is short.",
        recommendedAction: "Improve hero supporting with Homepage Copy Assistant.",
        assistantType: "HOMEPAGE",
        assistantAction: "IMPROVE_HERO",
        editorHref,
        suffix: "hero-short",
      }),
    );
  } else {
    whatWorks.push("Hero supporting present");
  }

  // Positioning: commercial clarity check — soft
  if (!/service|solution|website|seo|business/i.test(blob)) {
    findings.push(
      mkFinding({
        entityType: "Homepage",
        entityId: "home",
        title: "Homepage",
        route: "/",
        category: "POSITIONING",
        severity: "NORMAL",
        message: "Hero may lack clear commercial positioning cues.",
        recommendedAction: "Review Homepage positioning with Homepage Copy Assistant.",
        assistantType: "HOMEPAGE",
        assistantAction: "REVIEW_HOMEPAGE",
        editorHref,
        suffix: "positioning",
      }),
    );
  } else {
    whatWorks.push("Commercial positioning cues in hero");
  }

  const verdict = pickVerdict(findings, "LIGHT_POLISH");
  return {
    entityType: "Homepage",
    entityId: "home",
    title: "Homepage",
    route: "/",
    verdict,
    priority: "HIGH",
    whatWorks,
    findings,
    lastUpdated: iso(input.updatedAt),
    lastReviewedAt: null,
    editorHref,
    recommendedNextAction: findings[0]?.handoffLabel || "No change recommended",
  };
}

export async function runContentQualityAudit(): Promise<ContentAuditReport> {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL required for content quality audit");
  }

  const [
    home,
    services,
    solutions,
    platforms,
    industries,
    work,
    testimonials,
    insights,
    resources,
  ] = await Promise.all([
    prisma.homepageContent.findUnique({ where: { id: "home" } }),
    prisma.service.findMany({ where: { status: "PUBLISHED" } }),
    prisma.solution.findMany({ where: { status: "PUBLISHED" } }),
    prisma.platform.findMany({ where: { status: "PUBLISHED" } }),
    prisma.industry.findMany({
      where: { status: "PUBLISHED" },
      include: { workLinks: { select: { workId: true } } },
    }),
    prisma.workProject.findMany({
      where: { status: "PUBLISHED" },
      include: {
        industryLinks: true,
        testimonials: { select: { id: true, verified: true, status: true } },
      },
    }),
    prisma.testimonial.findMany({
      where: { status: "PUBLISHED", verified: true },
    }),
    prisma.insight.findMany({ where: { status: "PUBLISHED" } }),
    prisma.cmsResource.findMany({ where: { status: "PUBLISHED" } }),
  ]);

  const pages: ContentAuditPageResult[] = [];
  const siteFindings: SiteLevelFinding[] = [];

  if (home) {
    pages.push(
      auditHomepageFields({
        heroHeadline: home.heroHeadline,
        heroSupporting: home.heroSupporting,
        primaryCtaLabel: home.primaryCtaLabel,
        primaryCtaHref: home.primaryCtaHref,
        secondaryCtaLabel: home.secondaryCtaLabel,
        seoTitle: home.seoTitle || home.metaTitle,
        seoDescription: home.seoDescription || home.metaDescription,
        curatedServiceCount: arrLen(home.curatedServiceItems),
        curatedTestimonialCount: arrLen(home.curatedTestimonialIds),
        updatedAt: home.updatedAt,
      }),
    );
  }

  for (const s of services) {
    pages.push(
      auditServiceFields({
        id: s.id,
        slug: s.slug,
        title: s.title,
        href: s.href,
        summary: s.summary,
        description: s.description,
        narrative: s.narrative,
        problems: s.problems,
        deliverables: s.deliverables,
        process: s.process,
        faqs: s.faqs,
        seoTitle: s.seoTitle,
        seoDescription: s.seoDescription,
        primaryCtaLabel: s.primaryCtaLabel,
        relatedSolutionSlugs: s.relatedSolutionSlugs,
        relatedProjectSlugs: s.relatedProjectSlugs,
        relatedPlatformSlugs: s.relatedPlatformSlugs,
        updatedAt: s.updatedAt,
      }),
    );
  }

  for (const s of solutions) {
    const editorHref = `/admin/solutions/${s.id}`;
    const route = `/solutions/${s.slug}`;
    const findings: ContentAuditFinding[] = [];
    const whatWorks: string[] = [];
    if (s.pageContent) whatWorks.push("Dedicated pageContent narrative");
    if (arrLen(s.problemSymptoms) >= 4) whatWorks.push("Symptoms present");
    if (arrLen(s.whatWeReview) >= 5) whatWorks.push("What we review present");
    if (arrLen(s.relatedServiceHrefs) >= 3) whatWorks.push("Related Services");
    if (s.primaryCtaLabel) whatWorks.push(`CTA: ${s.primaryCtaLabel}`);

    if (!s.pageContent) {
      findings.push(
        mkFinding({
          entityType: "Solution",
          entityId: s.id,
          title: s.name,
          route,
          category: "STRUCTURE",
          severity: "HIGH",
          message: "Solution missing pageContent — may render thinly.",
          recommendedAction: "Structural review + Solution AI improve.",
          assistantType: "SOLUTION",
          assistantAction: "IMPROVE_SOLUTION",
          editorHref,
          suffix: "no-pagecontent",
        }),
      );
    }

    if (arrLen(s.measurementPoints) === 0) {
      findings.push(
        mkFinding({
          entityType: "Solution",
          entityId: s.id,
          title: s.name,
          route,
          category: "COMPLETENESS",
          severity: "LOW",
          message: "No measurement points — optional but useful for outcome clarity.",
          recommendedAction: "Add measurement points if verified/appropriate.",
          assistantType: "SOLUTION",
          assistantAction: "IMPROVE_SOLUTION",
          editorHref,
          suffix: "measure",
        }),
      );
    }

    // Free Website Review CTA on new-business is a known mismatch risk
    if (
      s.slug === "new-business-website" &&
      /free website review/i.test(s.primaryCtaLabel || "")
    ) {
      findings.push(
        mkFinding({
          entityType: "Solution",
          entityId: s.id,
          title: s.name,
          route,
          category: "CTA",
          severity: "HIGH",
          message:
            "New-business Solution uses Free Website Review CTA — usually for existing-site problems.",
          recommendedAction: "Prefer Tell Us About Your Project / Plan Your Project.",
          assistantType: "SOLUTION",
          assistantAction: "IMPROVE_SOLUTION",
          editorHref,
          suffix: "cta-mismatch",
        }),
      );
    }

    const verdict = pickVerdict(findings, "STRONG");
    pages.push({
      entityType: "Solution",
      entityId: s.id,
      title: s.name,
      route,
      verdict,
      priority: pickPriority("Solution", verdict, true),
      whatWorks,
      findings,
      lastUpdated: iso(s.updatedAt),
      lastReviewedAt: null,
      editorHref,
      recommendedNextAction:
        findings[0]?.handoffLabel || "No change recommended",
    });
  }

  for (const p of platforms) {
    pages.push(
      auditPlatformFields({
        id: p.id,
        slug: p.slug,
        name: p.name,
        summary: p.summary,
        description: p.description,
        capabilities: p.capabilities,
        whenItFits: p.whenItFits,
        challenges: p.challenges,
        verifiedExperience: p.verifiedExperience,
        lastReviewedAt: p.lastReviewedAt,
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
        relatedServiceHrefs: p.relatedServiceHrefs,
        updatedAt: p.updatedAt,
      }),
    );
  }

  for (const ind of industries) {
    pages.push(
      auditIndustryFields({
        id: ind.id,
        slug: ind.slug,
        name: ind.name,
        description: ind.description,
        group: ind.group,
        proven: ind.hasVerifiedProjectExperience,
        relatedServiceLinks: ind.relatedServiceLinks,
        relatedSolutionSlugs: ind.relatedSolutionSlugs,
        workLinkCount: ind.workLinks.length,
        seoTitle: ind.seoTitle,
        seoDescription: ind.seoDescription,
        updatedAt: ind.updatedAt,
      }),
    );
  }

  for (const w of work) {
    const editorHref = `/admin/work/${w.id}`;
    const route = `/work/${w.slug}`;
    const findings: ContentAuditFinding[] = [];
    const whatWorks: string[] = [];
    if (textLen(w.challenge) >= 80) whatWorks.push("Challenge described");
    if (textLen(w.solution) >= 80) whatWorks.push("Solution described");
    if (w.resultSummary) whatWorks.push("Qualitative outcome present (metrics not required)");
    if (w.platformLabel || w.platformId) whatWorks.push("Platform identified");

    const resultBlob = `${w.resultSummary || ""} ${JSON.stringify(w.results || [])}`;
    if (/\d+\s*%|\+\d+%|revenue|ROI|ranked #\d/i.test(resultBlob) && arrLen(w.measurableResults) === 0) {
      findings.push(
        mkFinding({
          entityType: "Work",
          entityId: w.id,
          title: w.name,
          route,
          category: "PROOF",
          severity: "BLOCKER",
          message:
            "Numeric/performance-style result language without measurableResults structure — verify source.",
          recommendedAction: "Human proof review; Case Study AI must not invent metrics.",
          assistantType: "WORK",
          assistantAction: "REVIEW_CASE_STUDY",
          editorHref,
          suffix: "metric-claim",
        }),
      );
    }

    if (textLen(w.challenge) < 60 || textLen(w.solution) < 60) {
      findings.push(
        mkFinding({
          entityType: "Work",
          entityId: w.id,
          title: w.name,
          route,
          category: "COMPLETENESS",
          severity: "NORMAL",
          message: "Challenge or solution copy is short.",
          recommendedAction: "Improve presentation from verified facts via Case Study AI.",
          assistantType: "WORK",
          assistantAction: "IMPROVE_CASE_STUDY",
          editorHref,
          suffix: "thin",
        }),
      );
    }

    if (
      w.testimonials.filter((t) => t.verified && t.status === "PUBLISHED").length === 0
    ) {
      findings.push(
        mkFinding({
          entityType: "Work",
          entityId: w.id,
          title: w.name,
          route,
          category: "PROOF",
          severity: "LOW",
          message: "No linked verified Testimonial (public proof limited — not a capability failure).",
          recommendedAction: "Link a verified Testimonial if one exists.",
          assistantType: "WORK",
          editorHref,
          suffix: "no-tm",
        }),
      );
    }

    const verdict = pickVerdict(findings, "STRONG");
    pages.push({
      entityType: "Work",
      entityId: w.id,
      title: w.name,
      route,
      verdict,
      priority: pickPriority("Work", verdict, true),
      whatWorks,
      findings,
      lastUpdated: iso(w.updatedAt),
      lastReviewedAt: null,
      editorHref,
      recommendedNextAction:
        findings[0]?.handoffLabel || "No change recommended",
    });
  }

  for (const t of testimonials) {
    const editorHref = `/admin/testimonials/${t.id}`;
    const findings: ContentAuditFinding[] = [];
    const whatWorks: string[] = ["Verified", "Published"];
    if (t.originalQuote) whatWorks.push("Original quote preserved");
    if (t.workProjectId) whatWorks.push("Linked to Work");

    if (!t.originalQuote) {
      findings.push(
        mkFinding({
          entityType: "Testimonial",
          entityId: t.id,
          title: `${t.name} — ${t.company}`,
          route: "/work",
          category: "PROOF",
          severity: "NORMAL",
          message: "originalQuote missing — integrity tracking weaker.",
          recommendedAction: "Capture originalQuote; do not invent wording.",
          assistantType: "TESTIMONIAL",
          editorHref,
          suffix: "no-original",
        }),
      );
    }

    pages.push({
      entityType: "Testimonial",
      entityId: t.id,
      title: `${t.name} — ${t.company}`,
      route: "/work",
      verdict: findings.length ? "LIGHT_POLISH" : "STRONG",
      priority: "LOW",
      whatWorks,
      findings,
      lastUpdated: iso(t.updatedAt),
      lastReviewedAt: null,
      editorHref,
      recommendedNextAction: "No change recommended",
    });
  }

  // Insights — duplication clusters
  const vr = insights.filter((i) => i.categoryLabel === "Vacation Rentals");
  const pricelabs = insights.filter((i) =>
    /pricelabs|price labs/i.test(`${i.title} ${i.description}`),
  );
  const doubleBook = insights.filter((i) =>
    /double.?book/i.test(`${i.title} ${i.description}`),
  );
  const calendar = insights.filter((i) =>
    /calendar.?sync|keep your booking calendars|preventing booking overlaps/i.test(
      `${i.title} ${i.description}`,
    ),
  );
  const directBook = insights.filter((i) =>
    /direct.?book/i.test(i.title),
  );

  for (const i of insights) {
    const editorHref = `/admin/insights/${i.id}`;
    const route = `/blog/${i.slug}`;
    const findings: ContentAuditFinding[] = [];
    const whatWorks: string[] = [];
    if (textLen(i.bodyMarkdown) >= 1200) whatWorks.push("Substantial body");
    if (i.seoTitle) whatWorks.push("SEO title present");

    const inPrice = pricelabs.some((x) => x.id === i.id);
    const inDouble = doubleBook.some((x) => x.id === i.id);
    const inCal = calendar.some((x) => x.id === i.id);
    const inDirect = directBook.some((x) => x.id === i.id);

    if (inPrice && pricelabs.length >= 5) {
      findings.push(
        mkFinding({
          entityType: "Insight",
          entityId: i.id,
          title: i.title,
          route,
          category: "DUPLICATION",
          severity: "NORMAL",
          message: `Part of a large PriceLabs cluster (${pricelabs.length} posts) — consolidation review candidate.`,
          recommendedAction: "Human consolidation review — do not auto-delete.",
          assistantType: "INSIGHT",
          editorHref,
          suffix: "pricelabs-cluster",
        }),
      );
    }
    if (inDouble && doubleBook.length >= 5) {
      findings.push(
        mkFinding({
          entityType: "Insight",
          entityId: i.id,
          title: i.title,
          route,
          category: "DUPLICATION",
          severity: "NORMAL",
          message: `Part of double-booking / calendar-prevention cluster (${doubleBook.length}).`,
          recommendedAction: "Consolidation review with human redirect strategy.",
          assistantType: "INSIGHT",
          editorHref,
          suffix: "double-cluster",
        }),
      );
    }
    if (inCal && calendar.length >= 5 && !inDouble) {
      findings.push(
        mkFinding({
          entityType: "Insight",
          entityId: i.id,
          title: i.title,
          route,
          category: "DUPLICATION",
          severity: "LOW",
          message: "Calendar-sync theme overlap with other Insights.",
          recommendedAction: "Defer unless consolidating calendar cluster.",
          assistantType: "INSIGHT",
          editorHref,
          suffix: "calendar-cluster",
        }),
      );
    }
    if (inDirect && directBook.length >= 12) {
      findings.push(
        mkFinding({
          entityType: "Insight",
          entityId: i.id,
          title: i.title,
          route,
          category: "DUPLICATION",
          severity: "LOW",
          message: "Direct-booking theme is heavily covered across Insights.",
          recommendedAction: "Keep strongest; defer low-value near-duplicates.",
          assistantType: "INSIGHT",
          editorHref,
          suffix: "direct-cluster",
        }),
      );
    }

    if (textLen(i.bodyMarkdown) < 800 && i.categoryLabel !== "Vacation Rentals") {
      findings.push(
        mkFinding({
          entityType: "Insight",
          entityId: i.id,
          title: i.title,
          route,
          category: "COMPLETENESS",
          severity: "NORMAL",
          message: "Non-VR Insight body is relatively short.",
          recommendedAction: "Refresh via Insight Editorial Studio if still strategic.",
          assistantType: "INSIGHT",
          editorHref,
          suffix: "thin",
        }),
      );
    }

    let verdict: ContentAuditVerdict = "STRONG";
    if (findings.some((f) => f.category === "DUPLICATION" && f.severity === "NORMAL")) {
      verdict = "DUPLICATE_CANNIBALIZATION_REVIEW";
    } else if (findings.length) {
      verdict = "LIGHT_POLISH";
    }

    // Non-VR commercial insights get higher visibility priority when thin
    const commercialInsight = i.categoryLabel !== "Vacation Rentals";
    pages.push({
      entityType: "Insight",
      entityId: i.id,
      title: i.title,
      route,
      verdict,
      priority: pickPriority("Insight", verdict, commercialInsight),
      whatWorks,
      findings,
      lastUpdated: iso(i.updatedAt),
      lastReviewedAt: iso(i.materialUpdatedAt),
      editorHref,
      recommendedNextAction:
        verdict === "DUPLICATE_CANNIBALIZATION_REVIEW"
          ? "Consolidation review"
          : findings[0]?.handoffLabel || "No change recommended",
    });
  }

  for (const r of resources) {
    const segment =
      r.type === "guide"
        ? "guides"
        : r.type === "comparison"
          ? "comparisons"
          : r.type === "checklist"
            ? "checklists"
            : r.type === "glossary"
              ? "glossary"
              : r.type === "template"
                ? "templates"
                : "tools";
    const editorHref = `/admin/resources/${segment}/${r.id}`;
    const publicPath =
      r.type === "guide"
        ? `/guides/${r.slug}`
        : r.type === "comparison"
          ? `/compare/${r.slug}`
          : r.type === "checklist"
            ? `/checklists/${r.slug}`
            : r.type === "glossary"
              ? `/glossary/${r.slug}`
              : r.type === "template"
                ? `/templates/${r.slug}`
                : `/tools/${r.slug}`;
    const assistant = r.type.toUpperCase() as ContentAssistantHint;
    const findings: ContentAuditFinding[] = [];
    const whatWorks: string[] = [];
    if (r.seoTitle) whatWorks.push("SEO title present");
    if (textLen(r.description) >= 100) whatWorks.push("Description present");
    if (r.type === "glossary" && textLen(r.shortDefinition) >= 80) {
      whatWorks.push("Short definition present");
    }

    if (!r.seoTitle?.trim() || !r.seoDescription?.trim()) {
      findings.push(
        mkFinding({
          entityType: "CmsResource",
          entityId: r.id,
          title: r.title,
          route: publicPath,
          category: "SEO",
          severity: "LOW",
          message: "SEO metadata incomplete.",
          recommendedAction: `Generate SEO via ${assistant} assistant.`,
          assistantType: assistant,
          assistantAction: "GENERATE_SEO",
          editorHref,
          suffix: "seo",
        }),
      );
    }

    if (r.type === "comparison" || r.type === "guide") {
      findings.push(
        mkFinding({
          entityType: "CmsResource",
          entityId: r.id,
          title: r.title,
          route: publicPath,
          category: "RESEARCH",
          severity: "NORMAL",
          message:
            "High-value resource — schedule factual freshness review when product/standards change (not automatic research now).",
          recommendedAction:
            r.type === "comparison"
              ? "Comparison AI → Check freshness / Research options later"
              : "Guide AI → Check freshness later",
          assistantType: assistant,
          assistantAction: "CHECK_FRESHNESS",
          editorHref,
          suffix: "freshness-flag",
        }),
      );
    }

    const verdict = pickVerdict(
      findings,
      r.type === "glossary" ? "STRONG" : "LIGHT_POLISH",
    );
    pages.push({
      entityType: r.type.charAt(0).toUpperCase() + r.type.slice(1),
      entityId: r.id,
      title: r.title,
      route: publicPath,
      verdict,
      priority: pickPriority(
        "CmsResource",
        verdict,
        r.type === "guide" || r.type === "comparison" || r.type === "tool",
      ),
      whatWorks,
      findings,
      lastUpdated: iso(r.updatedAt),
      lastReviewedAt: iso(r.materialUpdatedAt),
      editorHref,
      recommendedNextAction:
        findings[0]?.handoffLabel || "No change recommended",
    });
  }

  // Site-level findings
  siteFindings.push({
    id: "site:content-imbalance:insights-vr",
    category: "CONTENT_IMBALANCE",
    severity: "HIGH",
    message: `${vr.length} of ${insights.length} published Insights are Vacation Rentals — commercial themes under-represented in editorial archive.`,
    evidence: `VR=${vr.length}; non-VR=${insights.length - vr.length}`,
    recommendedAction:
      "Do not mass-delete. Prioritize new commercial Insights selectively; consolidate VR near-duplicates.",
  });

  siteFindings.push({
    id: "site:relationships:service-solution",
    category: "MISSING_COMMERCIAL_SUPPORT",
    severity: "HIGH",
    message: "All published Services have zero relatedSolutionSlugs.",
    recommendedAction:
      "Add Service→Solution relationships on commercial-core Services first.",
  });

  siteFindings.push({
    id: "site:seo:industry-titles",
    category: "SEO_METADATA_PATTERN",
    severity: "NORMAL",
    message: "All published Industries are missing SEO titles.",
    recommendedAction: "Batch Industry SEO via Industry AI on highest-priority industries first.",
  });

  siteFindings.push({
    id: "site:research:platforms-unreviewed",
    category: "STALE_PLATFORM_CONTENT",
    severity: "HIGH",
    message: "All published Platforms have null lastReviewedAt.",
    recommendedAction:
      "Research wave: WordPress, Shopify, Webflow, WooCommerce first via Platform AI.",
  });

  siteFindings.push({
    id: "site:pattern:industry-blurbs",
    category: "GENERIC_COPY_PATTERN",
    severity: "NORMAL",
    message:
      "Industry pages are short sector blurbs — similar structure across 20 industries.",
    recommendedAction:
      "Improve highest-priority proven industries first with Industry AI; do not mass-rewrite all 20.",
  });

  siteFindings.push({
    id: "site:proof:work-vertical-concentration",
    category: "WEAK_PROOF_COVERAGE",
    severity: "NORMAL",
    message:
      "Published Work/Testimonials concentrate in STR / hospitality / real estate / WordPress — limited public proof for other commercial Services.",
    evidence: `work=${work.length}; platforms in work mostly WordPress`,
    recommendedAction:
      "Treat as proof coverage gap, not capability denial. Expand Work when real projects exist.",
  });

  if (pricelabs.length >= 5) {
    siteFindings.push({
      id: "site:duplication:pricelabs",
      category: "RESOURCE_DUPLICATION",
      severity: "NORMAL",
      message: `${pricelabs.length} Insights in PriceLabs cluster — consolidation review.`,
      recommendedAction: "Human picks canonical posts; redirect/merge later via SEO workflow.",
    });
  }

  const byType: Record<string, number> = {};
  const byVerdict: Record<string, number> = {};
  for (const p of pages) {
    byType[p.entityType] = (byType[p.entityType] || 0) + 1;
    byVerdict[p.verdict] = (byVerdict[p.verdict] || 0) + 1;
  }

  const allFindings = pages.flatMap((p) => p.findings);
  const summary: ContentAuditSummary = {
    pagesReviewed: pages.length,
    openFindings: allFindings.length + siteFindings.length,
    needsResearch: pages.filter((p) => p.verdict === "NEEDS_RESEARCH").length,
    proofReview: pages.filter((p) => p.verdict === "NEEDS_PROOF_REVIEW").length,
    highPriority: pages.filter((p) => p.priority === "HIGH").length,
    strongPages: pages.filter((p) => p.verdict === "STRONG").length,
    byType,
    byVerdict,
  };

  // First improvement wave (~15–30 meaningful targets; avoid duplicate identical Service findings)
  const waveCandidates = pages
    .filter((p) => p.verdict !== "STRONG" || p.priority === "HIGH")
    .sort((a, b) => {
      const pr = { HIGH: 0, NORMAL: 1, LOW: 2 } as const;
      if (pr[a.priority] !== pr[b.priority]) return pr[a.priority] - pr[b.priority];
      const weight = (t: string) =>
        [
          "Homepage",
          "Service",
          "Solution",
          "Platform",
          "Industry",
          "Work",
          "Guide",
          "Comparison",
          "Tool",
        ].includes(t)
          ? 0
          : t === "Insight"
            ? 2
            : 1;
      return weight(a.entityType) - weight(b.entityType);
    });

  const seenTypes = new Map<string, number>();
  const commercialServiceOrder = [
    "website-design",
    "website-development",
    "website-redesign",
    "website-strategy",
    "conversion-rate-optimization",
    "website-performance-optimization",
    "website-audit",
    "ecommerce-development",
  ];
  const wave: ContentAuditReport["firstImprovementWave"] = [];

  function pushWave(p: ContentAuditPageResult) {
    if (wave.length >= 28) return false;
    const count = seenTypes.get(p.entityType) || 0;
    seenTypes.set(p.entityType, count + 1);
    const f = p.findings[0];
    wave.push({
      order: wave.length + 1,
      entityType: p.entityType,
      title: p.title,
      route: p.route,
      priority: p.priority,
      verdict: p.verdict,
      assistantType: f?.assistantType || null,
      action: f?.recommendedAction || p.recommendedNextAction || "Review",
      editorHref: p.editorHref,
      why: f?.message || p.whatWorks[0] || p.verdict,
    });
    return true;
  }

  for (const p of waveCandidates) {
    if (wave.length >= 26) break;
    const count = seenTypes.get(p.entityType) || 0;
    if (p.entityType === "Insight") continue;
    if (p.entityType === "Industry" && count >= 5) continue;
    if (p.entityType === "Platform" && count >= 4) continue;
    if (p.entityType === "Service" && count >= 8) continue;
    if (p.entityType === "Solution" && count >= 4) continue;
    if (p.entityType === "Service") {
      const slug = p.route.replace(/^\/services\//, "");
      const preferred = commercialServiceOrder.includes(slug);
      if (!preferred && count >= 4) continue;
    }
    pushWave(p);
  }

  // Insight consolidation representatives (human review — not auto-merge)
  const insightReps = pages.filter(
    (p) =>
      p.entityType === "Insight" &&
      p.findings.some(
        (f) =>
          f.id.includes("pricelabs-cluster") ||
          f.id.includes("double-cluster"),
      ),
  );
  const seenInsightCluster = new Set<string>();
  for (const p of insightReps) {
    const cluster = p.findings.find((f) => f.id.includes("pricelabs-cluster"))
      ? "pricelabs"
      : "double";
    if (seenInsightCluster.has(cluster)) continue;
    seenInsightCluster.add(cluster);
    pushWave(p);
    if (seenInsightCluster.size >= 2) break;
  }

  wave.forEach((w, i) => {
    w.order = i + 1;
  });

  return {
    version: CONTENT_AUDIT_VERSION,
    auditedAt: new Date().toISOString(),
    publishedOnly: true,
    summary,
    pages,
    siteFindings,
    firstImprovementWave: wave,
  };
}
