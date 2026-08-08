/**
 * Deterministic Service proposal heuristics (tests / offline / fallback).
 * Preserve strong body copy; rank Solution relationships by relevance.
 */

import type { Service } from "@prisma/client";
import { isEmptyValue } from "@/lib/ai/content-assistants/helpers";
import type { ProposalPayload } from "@/lib/ai/content-assistants/types";
import {
  SERVICE_FIELD_ALLOWLIST,
  SERVICE_FIELD_LABELS,
  SERVICE_PROTECTED_FIELDS,
} from "@/lib/ai/content-assistants/allowlists";
import { buildFieldChanges } from "@/lib/ai/content-assistants/shared-generate";
import type { ServiceFullProposal } from "@/lib/ai/content-assistants/service/schemas";
import {
  rankSolutionsForService,
  type ServiceRelationCandidate,
} from "@/lib/ai/content-assistants/service/relations";
import {
  isStrongProseField,
  resolveImprovementResultMode,
} from "@/lib/ai/content-assistants/improvement-result";

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}

function groundedCapabilities(service: Service): string[] {
  const existing = asStringList(service.capabilities);
  if (existing.length) return existing;
  const bits = service.description
    .split(/[.•\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 24 && s.length < 160)
    .slice(0, 4);
  return bits.length
    ? bits
    : [`Practical ${service.title} delivery grounded in your goals and constraints.`];
}

function serviceWeaknesses(s: Service): {
  missingCta: boolean;
  missingAudience: boolean;
  missingCapabilities: boolean;
  missingSeo: boolean;
  thinSummary: boolean;
  thinDescription: boolean;
  missingRelations: boolean;
} {
  return {
    missingCta: isEmptyValue(s.primaryCtaLabel),
    missingAudience: isEmptyValue(s.audience),
    missingCapabilities: isEmptyValue(s.capabilities),
    missingSeo: isEmptyValue(s.seoTitle) || isEmptyValue(s.seoDescription),
    thinSummary: isEmptyValue(s.summary) || !isStrongProseField(s.summary, 40),
    thinDescription:
      isEmptyValue(s.description) || !isStrongProseField(s.description, 80),
    missingRelations: isEmptyValue(s.relatedSolutionSlugs),
  };
}

export function heuristicServiceProposal(input: {
  service: Service;
  action: string;
  lockedFields: string[];
  customInstructions?: string;
  relationPool?: {
    solutions: ServiceRelationCandidate[];
    platforms: Array<{ slug: string; name: string }>;
    work: Array<{ slug: string; title: string }>;
    services: Array<{ slug: string; title: string; href: string }>;
  };
  /** Optional REVIEW findings to focus IMPROVE_SERVICE */
  reviewFindings?: Array<{ section: string; severity: string; message: string }>;
}): ProposalPayload {
  const s = input.service;
  const title = s.title;
  const audience = s.audience || "businesses that need a clear, durable digital presence";
  void input.customInstructions;

  const full: ServiceFullProposal = {};
  const reasons: Record<string, string> = {};

  switch (input.action) {
    case "REWRITE_POSITIONING":
    case "IMPROVE_FIELD_POSITIONING": {
      full.summary =
        s.summary?.trim() ||
        `${title} helps ${audience} plan and deliver focused website and digital work without hype.`;
      full.tagline =
        s.tagline?.trim() ||
        `Clear ${title.toLowerCase()} for teams that need practical outcomes.`;
      full.narrativeTitle = s.narrativeTitle?.trim() || `How ${title} fits your roadmap`;
      full.narrative =
        s.narrative?.trim() ||
        `${title} is a Smartlance capability focused on practical delivery. It clarifies scope, constraints, and the work involved so stakeholders know what to expect before engagement begins.`;
      full.audience = s.audience?.trim() || audience;
      full.description =
        s.description?.trim() ||
        `${title} covers the capability work required to move from brief to a maintainable outcome. Engagements emphasize clarity, fit, and durable implementation rather than generic agency packaging.`;
      break;
    }
    case "IMPROVE_PROCESS": {
      const existingProcess = Array.isArray(s.process) ? s.process : null;
      full.process =
        existingProcess && existingProcess.length
          ? (existingProcess as ServiceFullProposal["process"])
          : [
              {
                title: "Discover",
                description: `Clarify goals, constraints, and success criteria for ${title}.`,
              },
              {
                title: "Define",
                description: "Agree scope, priorities, and how progress will be reviewed.",
              },
              {
                title: "Deliver",
                description: "Execute the agreed work with clear checkpoints and documentation.",
              },
              {
                title: "Handover",
                description: "Transfer assets, guidance, and next-step recommendations.",
              },
            ];
      if (isEmptyValue(s.deliverables)) {
        full.deliverables = [
          "Documented scope and recommendations",
          "Agreed implementation or design artefacts",
          "Handover notes for ongoing ownership",
        ];
      }
      break;
    }
    case "GENERATE_FAQS": {
      full.faqs = [
        {
          question: `What does ${title} typically include?`,
          answer: `${title} focuses on practical capability work for ${audience}. Exact scope is agreed up front so expectations stay clear.`,
        },
        {
          question: "How do we know if this Service is the right fit?",
          answer:
            "If you need this capability as an ongoing or project capability — not only a one-off problem diagnosis — this Service is usually the right starting point. Problem-led pages live under Solutions.",
        },
        {
          question: "Will you invent platforms or guarantees?",
          answer:
            "No. Recommendations stay grounded in your context and Smartlance’s actual offering. We do not promise rankings, revenue, or conversion guarantees.",
        },
      ];
      break;
    }
    case "GENERATE_SEO": {
      full.seoTitle = (s.seoTitle || `${title} | Smartlance Designs`).slice(0, 70);
      full.seoDescription = (
        s.seoDescription ||
        `${s.summary || title} — practical ${title.toLowerCase()} from Smartlance Designs.`
      ).slice(0, 170);
      full.ogTitle = full.seoTitle;
      full.ogDescription = full.seoDescription;
      break;
    }
    case "SUGGEST_RELATIONSHIPS": {
      const ranked = rankSolutionsForService({
        serviceTitle: title,
        serviceHref: s.href,
        serviceSummary: s.summary,
        serviceCapabilities: s.capabilities,
        serviceProblems: s.problems,
        candidates: input.relationPool?.solutions || [],
      });

      const platformSuggestions = [];
      // Platforms: only when title/summary mentions platform-ish work AND name overlap — keep sparse
      for (const p of input.relationPool?.platforms || []) {
        const blob = `${title} ${s.summary || ""} ${s.description || ""}`.toLowerCase();
        if (blob.includes(p.name.toLowerCase()) || blob.includes(p.slug.replace(/-/g, " "))) {
          platformSuggestions.push({
            kind: "platform" as const,
            slug: p.slug,
            title: p.name,
            reason: `${title} work may involve ${p.name} when that platform is already in scope.`,
          });
        }
      }

      const suggestedRelations = [
        ...ranked.map(({ kind, slug, title: t, reason }) => ({
          kind,
          slug,
          title: t,
          reason,
        })),
        ...platformSuggestions.slice(0, 2),
      ];

      const fields = [];
      if (ranked.length && isEmptyValue(s.relatedSolutionSlugs)) {
        fields.push({
          field: "relatedSolutionSlugs",
          label: SERVICE_FIELD_LABELS.relatedSolutionSlugs,
          current: s.relatedSolutionSlugs ?? null,
          proposed: ranked.map((r) => r.slug),
          reason: "Ranked Solutions with specific editorial relevance (not first-N).",
        });
      }

      const findings =
        ranked.length === 0
          ? [
              {
                section: "RELATIONSHIPS",
                severity: "PASS" as const,
                message:
                  "No additional strong Solution relationships found. Prefer no link spam over weak matches.",
              },
            ]
          : undefined;

      return {
        fields,
        suggestedRelations,
        reviewFindings: findings,
        resultMode: ranked.length
          ? "PARTIAL_CHANGE_RECOMMENDED"
          : "NO_CHANGE_RECOMMENDED",
      };
    }
    case "REVIEW_SERVICE": {
      const findings = [];
      findings.push({
        section: "OFFER CLARITY",
        severity: isEmptyValue(s.summary) ? ("BLOCKER" as const) : ("PASS" as const),
        message: isEmptyValue(s.summary)
          ? "Summary is missing — visitors cannot tell what this capability is."
          : "Summary is present.",
      });
      findings.push({
        section: "AUDIENCE",
        severity: isEmptyValue(s.audience) ? ("WARNING" as const) : ("PASS" as const),
        message: isEmptyValue(s.audience)
          ? "Audience is empty — clarify who this Service is for."
          : "Audience is set.",
      });
      findings.push({
        section: "CAPABILITIES",
        severity: isEmptyValue(s.capabilities) ? ("REVIEW" as const) : ("PASS" as const),
        message: isEmptyValue(s.capabilities)
          ? "Capabilities list is empty — only add items grounded in known offering facts."
          : "Capabilities are present; verify none were invented.",
      });
      findings.push({
        section: "PROCESS",
        severity: isEmptyValue(s.process) ? ("WARNING" as const) : ("PASS" as const),
        message: isEmptyValue(s.process)
          ? "Process is empty — visitors need a clear engagement shape."
          : "Process steps are present.",
      });
      findings.push({
        section: "PROOF",
        severity: isEmptyValue(s.relatedProjectSlugs) ? ("REVIEW" as const) : ("PASS" as const),
        message: isEmptyValue(s.relatedProjectSlugs)
          ? "No related Work linked — only link verified published projects."
          : "Related Work slugs present; confirm they remain verified.",
      });
      findings.push({
        section: "SEO",
        severity: !s.seoTitle || !s.seoDescription ? ("WARNING" as const) : ("PASS" as const),
        message: !s.seoTitle || !s.seoDescription
          ? "SEO title or description missing."
          : "SEO fields present; check for duplicate titles before publish.",
      });
      findings.push({
        section: "AI SEARCH CLARITY",
        severity: "REVIEW" as const,
        message:
          "Confirm the page clearly explains capability, audience, process, and fit — not blog-style education.",
      });
      findings.push({
        section: "CTA",
        severity: isEmptyValue(s.primaryCtaLabel) ? ("WARNING" as const) : ("PASS" as const),
        message: isEmptyValue(s.primaryCtaLabel)
          ? "Primary CTA label is empty."
          : "Primary CTA is set.",
      });
      findings.push({
        section: "DIFFERENTIATION",
        severity: "REVIEW" as const,
        message:
          "Compare nearby Services in the same group — flag copy that would fit another Service unchanged.",
      });
      findings.push({
        section: "RELATIONSHIPS",
        severity: isEmptyValue(s.relatedSolutionSlugs)
          ? ("WARNING" as const)
          : ("PASS" as const),
        message: isEmptyValue(s.relatedSolutionSlugs)
          ? "No related Solution slugs — use Suggest relationships for ranked candidates."
          : "Related Solutions present; verify relevance.",
      });
      findings.push({
        section: "MISSING FIELDS",
        severity: "REVIEW" as const,
        message: "Use Fill missing fields for empty eligible prose and structured lists.",
      });
      findings.push({
        section: "BODY STRENGTH",
        severity:
          isStrongProseField(s.summary, 40) && isStrongProseField(s.description, 80)
            ? ("PASS" as const)
            : ("WARNING" as const),
        message:
          isStrongProseField(s.summary, 40) && isStrongProseField(s.description, 80)
            ? "Summary/description look strong enough to preserve unless a material weakness is identified."
            : "Summary or description is thin — improvement may fill those fields only.",
      });
      return { fields: [], reviewFindings: findings };
    }
    case "FILL_MISSING": {
      if (isEmptyValue(s.summary)) {
        full.summary = `${title} helps ${audience} with focused, practical delivery — clear scope, honest constraints, and durable outcomes.`;
      }
      if (isEmptyValue(s.description)) {
        full.description = `${title} is a Smartlance capability. It explains what the work involves, who it suits, and what clients can reasonably expect — without Solution-style diagnostic framing or invented guarantees.`;
      }
      if (isEmptyValue(s.tagline)) {
        full.tagline = `Practical ${title.toLowerCase()} with clear scope.`;
      }
      if (isEmptyValue(s.capabilities)) {
        full.capabilities = groundedCapabilities(s);
      }
      if (isEmptyValue(s.idealFor)) {
        full.idealFor = [
          `Teams evaluating ${title.toLowerCase()} as a capability`,
          "Organisations that need clear scope before delivery",
        ];
      }
      if (isEmptyValue(s.problems)) {
        full.problems = [
          `Unclear scope around ${title.toLowerCase()}`,
          "Capability work that needs practical definition before build",
        ];
      }
      if (isEmptyValue(s.process)) {
        full.process = [
          { title: "Discover", description: "Align on goals and constraints." },
          { title: "Define", description: "Agree priorities and success checks." },
          { title: "Deliver", description: "Execute with clear checkpoints." },
        ];
      }
      if (isEmptyValue(s.faqs)) {
        full.faqs = [
          {
            question: `Is ${title} the same as a Solution page?`,
            answer:
              "No. Services describe capabilities. Solutions diagnose specific problems and then connect to relevant Services.",
          },
        ];
      }
      if (isEmptyValue(s.ctaTitle)) {
        full.ctaTitle = `Talk about ${title}`;
      }
      if (isEmptyValue(s.ctaDescription)) {
        full.ctaDescription =
          "Share your context and we will help you decide whether this capability — or a Solution path — is the right next step.";
      }
      if (isEmptyValue(s.primaryCtaLabel)) {
        full.primaryCtaLabel = "Tell Us About Your Project";
        full.primaryCtaHref = "/contact";
      }
      if (isEmptyValue(s.seoTitle) || isEmptyValue(s.seoDescription)) {
        full.seoTitle = (s.seoTitle || `${title} | Smartlance Designs`).slice(0, 70);
        full.seoDescription = (
          s.seoDescription ||
          (s.summary || `${title} from Smartlance Designs`).slice(0, 170)
        );
      }
      break;
    }
    case "IMPROVE_SERVICE":
    default: {
      const weak = serviceWeaknesses(s);
      const reviewSaysCtaMissing =
        input.reviewFindings?.some(
          (f) =>
            f.section === "CTA" &&
            (f.severity === "WARNING" || f.severity === "BLOCKER"),
        ) ?? weak.missingCta;
      const reviewSaysBodyWeak =
        input.reviewFindings?.some(
          (f) =>
            f.section === "BODY STRENGTH" &&
            (f.severity === "WARNING" || f.severity === "BLOCKER"),
        ) ?? false;

      // Preserve strong body unless review/heuristic finds material weakness
      if (weak.thinSummary || (reviewSaysBodyWeak && !isStrongProseField(s.summary, 40))) {
        if (isEmptyValue(s.summary) || !isStrongProseField(s.summary, 40)) {
          full.summary = `${title} helps ${audience} with focused, practical delivery — clear scope, honest constraints, and durable outcomes.`;
          reasons.summary = "Thin or empty summary.";
        }
      }
      if (
        (isEmptyValue(s.description) || !isStrongProseField(s.description, 80)) &&
        (weak.thinDescription || reviewSaysBodyWeak)
      ) {
        full.description = `${title} is a Smartlance capability. It explains what the work involves, who it suits, and what clients can reasonably expect — without Solution-style diagnostic framing or invented guarantees.`;
        reasons.description = "Thin or empty description.";
      }

      if (weak.missingAudience) {
        full.audience = audience;
        reasons.audience = "Audience missing.";
      }
      if (weak.missingCapabilities) {
        full.capabilities = groundedCapabilities(s);
        reasons.capabilities = "Capabilities empty.";
      }
      if (isEmptyValue(s.tagline)) {
        full.tagline = `Practical ${title.toLowerCase()} with clear scope.`;
        reasons.tagline = "Tagline empty.";
      }
      if (isEmptyValue(s.process)) {
        full.process = [
          { title: "Discover", description: "Align on goals and constraints." },
          { title: "Define", description: "Agree priorities and success checks." },
          { title: "Deliver", description: "Execute with clear checkpoints." },
        ];
        reasons.process = "Process empty.";
      }

      // CTA-focused when review flagged CTA / CTA missing — do not force body rewrite
      if (reviewSaysCtaMissing || weak.missingCta) {
        full.ctaTitle = s.ctaTitle?.trim() || `Plan your ${title.toLowerCase()}`;
        full.ctaDescription =
          s.ctaDescription?.trim() ||
          "Share goals and constraints. We will help you decide whether redesign, a Solution path, or another Service is the better next step.";
        full.primaryCtaLabel = "Tell Us About Your Project";
        full.primaryCtaHref = "/contact";
        reasons.primaryCtaLabel = "Primary CTA was empty — contextual CTA suggested.";
        reasons.ctaTitle = "CTA block filled from review/weakness gate.";
      }

      if (weak.missingSeo) {
        full.seoTitle = (s.seoTitle || `${title} | Smartlance Designs`).slice(0, 70);
        full.seoDescription = (
          s.seoDescription ||
          (s.summary || `${title} from Smartlance Designs`).slice(0, 170)
        );
        reasons.seoTitle = "SEO incomplete.";
      }
      break;
    }
  }

  if (input.action.startsWith("IMPROVE_FIELD:")) {
    const field = input.action.slice("IMPROVE_FIELD:".length);
    if (SERVICE_FIELD_ALLOWLIST.has(field) && !SERVICE_PROTECTED_FIELDS.has(field)) {
      const current = (s as unknown as Record<string, unknown>)[field];
      let proposed: unknown = current;
      if (typeof current === "string" || isEmptyValue(current)) {
        proposed =
          typeof current === "string" && current.trim()
            ? `${current.trim()} (clarified for ${audience}.)`
            : `Clear, practical copy for ${title} — grounded in Smartlance’s offering.`;
      }
      return {
        fields: buildFieldChanges({
          entity: s as unknown as Record<string, unknown>,
          proposed: { [field]: proposed },
          labels: SERVICE_FIELD_LABELS,
          allowlist: SERVICE_FIELD_ALLOWLIST,
          protectedFields: SERVICE_PROTECTED_FIELDS,
          lockedFields: input.lockedFields,
        }),
      };
    }
  }

  const missingOnly = input.action === "FILL_MISSING";
  const fields = buildFieldChanges({
    entity: s as unknown as Record<string, unknown>,
    proposed: full as Record<string, unknown>,
    labels: SERVICE_FIELD_LABELS,
    allowlist: SERVICE_FIELD_ALLOWLIST,
    protectedFields: SERVICE_PROTECTED_FIELDS,
    lockedFields: input.lockedFields,
    missingOnly,
    reasons,
  });

  if (
    input.action === "FILL_MISSING" &&
    input.relationPool &&
    isEmptyValue(s.relatedSolutionSlugs)
  ) {
    const ranked = rankSolutionsForService({
      serviceTitle: title,
      serviceHref: s.href,
      serviceSummary: s.summary,
      serviceCapabilities: s.capabilities,
      serviceProblems: s.problems,
      candidates: input.relationPool.solutions,
      max: 3,
    });
    if (ranked[0]) {
      fields.push({
        field: "relatedSolutionSlugs",
        label: SERVICE_FIELD_LABELS.relatedSolutionSlugs,
        current: s.relatedSolutionSlugs ?? null,
        proposed: ranked.map((r) => r.slug),
        reason: ranked[0].reason,
      });
    }
  }

  return {
    fields,
    resultMode: resolveImprovementResultMode({ fieldCount: fields.length }),
  };
}
