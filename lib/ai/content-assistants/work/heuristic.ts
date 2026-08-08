/**
 * Case Study heuristics — presentation from verified facts only.
 */

import type { WorkProject } from "@prisma/client";
import {
  annotateFieldClaimBlockers,
  isEmptyValue,
} from "@/lib/ai/content-assistants/helpers";
import {
  containsUnsupportedPerformanceClaim,
  type ApprovedProjectFacts,
} from "@/lib/ai/content-assistants/proof";
import type { ProposalClaim, ProposalPayload } from "@/lib/ai/content-assistants/types";
import {
  WORK_FIELD_ALLOWLIST,
  WORK_FIELD_LABELS,
  WORK_PROTECTED_FIELDS,
} from "@/lib/ai/content-assistants/allowlists";
import { buildFieldChanges } from "@/lib/ai/content-assistants/shared-generate";

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}

export function heuristicWorkProposal(input: {
  work: WorkProject;
  action: string;
  lockedFields: string[];
  facts: ApprovedProjectFacts;
  enoughFacts: boolean;
  approvedForAI: boolean;
  relationPool?: {
    services: Array<{ href: string; title: string }>;
    platforms: Array<{ id: string; slug: string; name: string }>;
  };
}): ProposalPayload {
  const w = input.work;
  const f = input.facts;
  const claims: ProposalClaim[] = [];
  const proposed: Record<string, unknown> = {};

  const problem = f.problem || w.challenge || "";
  const workDone = f.workCompleted || w.solution || "";
  const outcome = f.outcome || w.resultSummary || "";
  const metrics = f.verifiedMetrics || asStringList(w.measurableResults);

  const insufficient = (field: string) => {
    claims.push({
      kind: "PROJECT_FACT",
      claimText: `Not enough verified information to generate ${field}.`,
      support: "NOT_APPLICABLE",
      field,
    });
  };

  switch (input.action) {
    case "BUILD_FROM_PROJECT_FACTS":
    case "FILL_MISSING":
    case "IMPROVE_CASE_STUDY":
    case "IMPROVE_SUMMARY":
    case "IMPROVE_CHALLENGE":
    case "IMPROVE_SOLUTION":
    case "FORMAT_RESULTS":
    case "GENERATE_SEO":
    case "SUGGEST_RELATIONSHIPS":
    case "SUGGEST_SERVICES":
    case "SUGGEST_PLATFORM":
    case "SUGGEST_INDUSTRY":
    case "SUGGEST_TESTIMONIAL":
    case "REVIEW_PROOF":
    case "REVIEW_CASE_STUDY":
      break;
    default:
      break;
  }

  if (input.action === "REVIEW_PROOF" || input.action === "REVIEW_CASE_STUDY") {
    const findings = [];
    findings.push({
      section: "PROJECT FACTS",
      severity: input.enoughFacts ? ("PASS" as const) : ("WARNING" as const),
      message: input.enoughFacts
        ? "Enough challenge/solution (or approved facts) to ground presentation."
        : "More project information is needed — Case Study AI will not invent missing facts.",
    });
    findings.push({
      section: "RESULT CLAIMS",
      severity: metrics.length
        ? ("PASS" as const)
        : isEmptyValue(w.resultSummary)
          ? ("PASS" as const)
          : ("REVIEW" as const),
      message: metrics.length
        ? "Verified metrics present — keep wording faithful."
        : isEmptyValue(w.resultSummary)
          ? "No result metrics — do not invent outcomes."
          : "Result summary exists without structured metrics — avoid embellishment.",
    });
    findings.push({
      section: "PLATFORM / TECHNOLOGY",
      severity: w.platformId || f.platform ? ("PASS" as const) : ("REVIEW" as const),
      message: w.platformId || f.platform
        ? "Platform indicated in project data."
        : "No platform in verified facts — do not infer one.",
    });
    findings.push({
      section: "SCOPE ACCURACY",
      severity: "REVIEW" as const,
      message:
        "Related Services are not proof of delivery — only claim services verified in project facts.",
    });
    findings.push({
      section: "SEO",
      severity: !w.seoTitle || !w.seoDescription ? ("WARNING" as const) : ("PASS" as const),
      message: !w.seoTitle || !w.seoDescription
        ? "SEO incomplete."
        : "SEO present — must not invent outcome claims in metadata.",
    });
    return { fields: [], reviewFindings: findings, claims };
  }

  if (
    input.action === "SUGGEST_SERVICES" ||
    input.action === "SUGGEST_PLATFORM" ||
    input.action === "SUGGEST_INDUSTRY" ||
    input.action === "SUGGEST_TESTIMONIAL" ||
    input.action === "SUGGEST_RELATIONSHIPS"
  ) {
    const labels = asStringList(w.servicesLabels).map((s) => s.toLowerCase());
    const serviceSuggestions =
      input.action === "SUGGEST_PLATFORM" ||
      input.action === "SUGGEST_INDUSTRY" ||
      input.action === "SUGGEST_TESTIMONIAL"
        ? []
        : (input.relationPool?.services || [])
            .filter((s) =>
              labels.some(
                (l) =>
                  s.title.toLowerCase().includes(l) ||
                  l.includes(s.title.toLowerCase().slice(0, 8)),
              ),
            )
            .slice(0, 4)
            .map((s) => ({
              kind: "service" as const,
              href: s.href,
              title: s.title,
              reason:
                "Matches existing service labels on this Work — verify before accepting. Labels are not proof of delivery alone.",
            }));

    let platformSuggestions: ProposalPayload["suggestedRelations"] = [];
    let platformFields: ReturnType<typeof buildFieldChanges> = [];
    if (
      input.action === "SUGGEST_PLATFORM" ||
      input.action === "SUGGEST_RELATIONSHIPS"
    ) {
      if (!f.platform && !w.platformLabel && !w.platformId) {
        if (input.action === "SUGGEST_PLATFORM") {
          return {
            fields: [],
            reviewFindings: [
              {
                section: "PLATFORM / TECHNOLOGY",
                severity: "BLOCKER",
                message:
                  "No verified platform in project facts — will not infer one.",
              },
            ],
          };
        }
      } else {
        const name = f.platform || w.platformLabel || "";
        const match = (input.relationPool?.platforms || []).find(
          (p) =>
            p.name.toLowerCase() === name.toLowerCase() ||
            p.slug === name.toLowerCase(),
        );
        if (match) {
          platformSuggestions = [
            {
              kind: "platform",
              id: match.id,
              slug: match.slug,
              title: match.name,
              reason: "Matched verified platform name from project facts.",
            },
          ];
          platformFields = buildFieldChanges({
            entity: w as unknown as Record<string, unknown>,
            proposed: { platformLabel: match.name },
            labels: WORK_FIELD_LABELS,
            allowlist: WORK_FIELD_ALLOWLIST,
            protectedFields: WORK_PROTECTED_FIELDS,
            lockedFields: input.lockedFields,
          });
        }
      }
    }

    const suggestions = [...serviceSuggestions, ...(platformSuggestions || [])];
    return {
      fields: platformFields,
      suggestedRelations: suggestions,
      reviewFindings: suggestions.length
        ? undefined
        : [
            {
              section: "SERVICE RELATIONS",
              severity: "REVIEW" as const,
              message:
                "No relation suggestions with verified project support. Will not invent Service/Platform links for SEO.",
            },
          ],
    };
  }

  if (input.action === "FORMAT_RESULTS") {
    if (!metrics.length && !outcome) {
      insufficient("resultSummary");
      return {
        fields: [],
        claims,
        reviewFindings: [
          {
            section: "RESULT CLAIMS",
            severity: "PASS",
            message: "No verified results to format — nothing proposed.",
          },
        ],
      };
    }
    if (metrics.length) {
      proposed.measurableResults = metrics;
      proposed.resultSummary = metrics.join(" ");
      claims.push({
        kind: "PROJECT_METRIC",
        claimText: metrics.join(" | "),
        support: "VERIFIED",
        field: "measurableResults",
        evidenceStrength: "STRONG",
      });
    } else if (outcome) {
      proposed.resultSummary = outcome;
      claims.push({
        kind: "PROJECT_RESULT",
        claimText: outcome.slice(0, 200),
        support: "VERIFIED",
        field: "resultSummary",
      });
    }
  } else if (
    input.action === "BUILD_FROM_PROJECT_FACTS" ||
    input.action === "FILL_MISSING" ||
    input.action === "IMPROVE_CASE_STUDY" ||
    input.action === "IMPROVE_CHALLENGE" ||
    input.action === "IMPROVE_SOLUTION" ||
    input.action === "IMPROVE_SUMMARY" ||
    input.action === "GENERATE_SEO"
  ) {
    if (!input.enoughFacts && input.action === "BUILD_FROM_PROJECT_FACTS") {
      return {
        fields: [],
        reviewFindings: [
          {
            section: "PROJECT FACTS",
            severity: "BLOCKER",
            message:
              "More project information is needed. Case Study AI can improve verified material, but it won't invent missing project facts.",
          },
        ],
      };
    }

    if (
      (input.action === "IMPROVE_CHALLENGE" ||
        input.action === "BUILD_FROM_PROJECT_FACTS" ||
        input.action === "IMPROVE_CASE_STUDY" ||
        (input.action === "FILL_MISSING" && isEmptyValue(w.challenge))) &&
      problem
    ) {
      proposed.challenge =
        input.action === "IMPROVE_CHALLENGE" || isEmptyValue(w.challenge)
          ? problem.length > 40
            ? problem
            : `The project needed to address: ${problem}`
          : problem;
      claims.push({
        kind: "PROJECT_FACT",
        claimText: "Challenge grounded in verified problem/challenge text.",
        support: "VERIFIED",
        field: "challenge",
      });
    } else if (
      input.action === "IMPROVE_CHALLENGE" ||
      input.action === "BUILD_FROM_PROJECT_FACTS"
    ) {
      insufficient("challenge");
    }

    if (
      (input.action === "IMPROVE_SOLUTION" ||
        input.action === "BUILD_FROM_PROJECT_FACTS" ||
        input.action === "IMPROVE_CASE_STUDY" ||
        (input.action === "FILL_MISSING" && isEmptyValue(w.solution))) &&
      workDone
    ) {
      proposed.solution = workDone;
      claims.push({
        kind: "PROJECT_SCOPE",
        claimText: "Solution grounded in verified work completed / solution text.",
        support: "VERIFIED",
        field: "solution",
      });
    } else if (
      input.action === "IMPROVE_SOLUTION" ||
      input.action === "BUILD_FROM_PROJECT_FACTS"
    ) {
      insufficient("solution");
    }

    if (
      (input.action === "IMPROVE_SUMMARY" ||
        input.action === "BUILD_FROM_PROJECT_FACTS" ||
        input.action === "IMPROVE_CASE_STUDY" ||
        (input.action === "FILL_MISSING" && isEmptyValue(w.shortDescription))) &&
      (problem || workDone)
    ) {
      proposed.shortDescription = [
        w.clientName ? `${w.clientName}:` : null,
        problem ? `Addressed ${problem.slice(0, 120)}` : null,
        workDone ? `Delivered ${workDone.slice(0, 120)}` : null,
      ]
        .filter(Boolean)
        .join(" ")
        .slice(0, 400);
      claims.push({
        kind: "PROJECT_SCOPE",
        claimText: "Summary composed from verified challenge/solution only.",
        support: "VERIFIED",
        field: "shortDescription",
      });
    }

    // Results only when verified metrics/outcome exist — never invent
    if (
      (input.action === "BUILD_FROM_PROJECT_FACTS" ||
        input.action === "IMPROVE_CASE_STUDY" ||
        input.action === "FILL_MISSING") &&
      (metrics.length || outcome)
    ) {
      if (isEmptyValue(w.resultSummary) || input.action !== "FILL_MISSING") {
        if (metrics.length) {
          proposed.resultSummary = metrics.join(" ");
          proposed.measurableResults = metrics;
        } else {
          proposed.resultSummary = outcome;
        }
      }
    }

    if (
      input.action === "GENERATE_SEO" ||
      ((input.action === "FILL_MISSING" || input.action === "BUILD_FROM_PROJECT_FACTS") &&
        (isEmptyValue(w.seoTitle) || isEmptyValue(w.seoDescription)))
    ) {
      const titleBase = w.title || w.name;
      proposed.seoTitle = (w.seoTitle || `${titleBase} | Smartlance Designs`).slice(0, 70);
      const seoDesc = (
        w.seoDescription ||
        w.shortDescription ||
        (problem ? `Case study: ${problem.slice(0, 140)}` : titleBase)
      ).slice(0, 170);
      if (containsUnsupportedPerformanceClaim(seoDesc) && !metrics.length) {
        proposed.seoDescription = `${titleBase} — project case study from Smartlance Designs.`.slice(
          0,
          170,
        );
      } else {
        proposed.seoDescription = seoDesc;
      }
      proposed.ogTitle = proposed.seoTitle;
      proposed.ogDescription = proposed.seoDescription;
    }

    if (f.technology?.length && isEmptyValue(w.technologies)) {
      proposed.technologies = f.technology;
    }
    if (f.platform && isEmptyValue(w.platformLabel)) {
      proposed.platformLabel = f.platform;
    }
  }

  // Strip embellished / invented metrics
  for (const [k, v] of Object.entries(proposed)) {
    const text = typeof v === "string" ? v : JSON.stringify(v);
    if (
      containsUnsupportedPerformanceClaim(text) &&
      !metrics.some((m) => text.includes(m)) &&
      !(outcome && text.includes(outcome.slice(0, 40)))
    ) {
      claims.push({
        kind: "PROJECT_METRIC",
        claimText: text.slice(0, 160),
        support: "BLOCKED",
        field: k,
      });
      delete proposed[k];
    }
  }

  const missingOnly =
    input.action === "FILL_MISSING" || input.action === "FORMAT_RESULTS";
  const fields = buildFieldChanges({
    entity: w as unknown as Record<string, unknown>,
    proposed,
    labels: WORK_FIELD_LABELS,
    allowlist: WORK_FIELD_ALLOWLIST,
    protectedFields: WORK_PROTECTED_FIELDS,
    lockedFields: input.lockedFields,
    missingOnly: input.action === "FILL_MISSING",
  });

  // Block result fields that still look unsupported
  for (const field of fields) {
    if (
      (field.field === "resultSummary" ||
        field.field === "results" ||
        field.field === "measurableResults") &&
      !metrics.length &&
      !outcome
    ) {
      field.claimBlockers = [
        "This result claim is not supported by the supplied project facts.",
      ];
    }
    const text =
      typeof field.proposed === "string"
        ? field.proposed
        : JSON.stringify(field.proposed);
    if (
      containsUnsupportedPerformanceClaim(text) &&
      !metrics.some((m) => text.includes(m))
    ) {
      field.claimBlockers = [
        ...(field.claimBlockers || []),
        "Unsupported performance claim without verified metrics.",
      ];
    }
  }

  annotateFieldClaimBlockers(fields, { hasResearchSources: false });
  void missingOnly;

  return { fields, claims };
}
