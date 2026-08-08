/**
 * Deterministic Solution proposal heuristics.
 */

import type { Solution } from "@prisma/client";
import { isEmptyValue } from "@/lib/ai/content-assistants/helpers";
import type { ProposalPayload } from "@/lib/ai/content-assistants/types";
import {
  SOLUTION_FIELD_ALLOWLIST,
  SOLUTION_FIELD_LABELS,
  SOLUTION_PROTECTED_FIELDS,
} from "@/lib/ai/content-assistants/allowlists";
import { buildFieldChanges } from "@/lib/ai/content-assistants/shared-generate";
import type { z } from "zod";
import type { SolutionFullProposalOutput } from "@/lib/ai/content-assistants/solution/schemas";

type Full = z.infer<typeof SolutionFullProposalOutput>;

export function heuristicSolutionProposal(input: {
  solution: Solution;
  action: string;
  lockedFields: string[];
  customInstructions?: string;
  relationPool?: {
    services: Array<{ href: string; title: string; slug: string }>;
    platforms: Array<{ slug: string; name: string }>;
    industries: Array<{ slug: string; name: string }>;
    requiredServiceHrefs: string[];
  };
}): ProposalPayload {
  const s = input.solution;
  const name = s.name;
  // customInstructions guide generation only — never append into proposed public copy
  void input.customInstructions;

  const full: Full = {};

  switch (input.action) {
    case "CLARIFY_PROBLEM": {
      full.eyebrow = s.eyebrow?.trim() || "Problem diagnosis";
      full.heroStatement =
        s.heroStatement?.trim() ||
        `When ${name.toLowerCase()} is the issue, the first step is recognising the pattern — not buying a service brochure.`;
      full.heroSupporting =
        s.heroSupporting?.trim() ||
        "This page helps you spot symptoms, understand likely causes, and see what Smartlance reviews before recommending a path.";
      full.shortDescription =
        s.shortDescription?.trim() ||
        `${name}: a problem-led diagnosis of symptoms, causes, and practical next steps.`;
      full.problemSymptoms = asStringList(s.problemSymptoms).length
        ? asStringList(s.problemSymptoms)
        : [
            "Visitors struggle to recognise whether this is their issue",
            "Teams debate symptoms without a shared diagnostic frame",
            "Capability pages get confused with problem diagnosis",
          ];
      break;
    }
    case "IMPROVE_DIAGNOSTIC_FLOW": {
      full.problemSymptoms = asStringList(s.problemSymptoms).length
        ? asStringList(s.problemSymptoms)
        : [
            "The problem shows up as friction, confusion, or stalled outcomes",
            "Stakeholders disagree on whether the issue is traffic, conversion, or clarity",
          ];
      full.possibleCauses =
        Array.isArray(s.possibleCauses) && s.possibleCauses.length
          ? (s.possibleCauses as Full["possibleCauses"])
          : [
              {
                title: "Misaligned intent",
                description:
                  "The experience may not match what people came to do.",
              },
              {
                title: "Unclear structure",
                description:
                  "Important paths or proof may be hard to find or trust.",
              },
              {
                title: "Measurement gaps",
                description:
                  "Teams may lack a clear view of where the journey breaks.",
              },
            ];
      full.whatWeReview = asStringList(s.whatWeReview).length
        ? asStringList(s.whatWeReview)
        : [
            "How visitors enter and what they are trying to accomplish",
            "Where friction or confusion appears in the journey",
            "Whether related Smartlance Services are the right next step",
          ];
      break;
    }
    case "IMPROVE_APPROACH": {
      full.process =
        Array.isArray(s.process) && s.process.length
          ? (s.process as Full["process"])
          : [
              {
                title: "Diagnose",
                description: "Confirm the problem pattern and constraints.",
              },
              {
                title: "Prioritise",
                description: "Choose the highest-leverage fixes first.",
              },
              {
                title: "Act",
                description:
                  "Apply the right Services — not a generic brochure package.",
              },
            ];
      // Measurement: what could be measured — never fake results
      full.measurementPoints = asStringList(s.measurementPoints).length
        ? asStringList(s.measurementPoints)
        : [
            "Whether the primary conversion path is clearer",
            "Whether key pages answer the visitor’s intent sooner",
            "Whether follow-up enquiries are more specific and qualified",
          ];
      break;
    }
    case "GENERATE_FAQS": {
      full.faqs = [
        {
          question: `Is “${name}” a Service or a Solution?`,
          answer:
            "This is a Solution page: it starts with the problem, symptoms, and diagnosis. Related Services describe capabilities you may need afterward.",
        },
        {
          question: "Will you guarantee rankings or revenue?",
          answer:
            "No. Measurement points describe what to watch — not fabricated results or guarantees.",
        },
        {
          question: "What happens after diagnosis?",
          answer:
            "We connect the problem to relevant Smartlance Services where they fit, then agree a practical next step.",
        },
      ];
      break;
    }
    case "GENERATE_SEO": {
      full.seoTitle = (s.seoTitle || `${name} | Smartlance Designs`).slice(0, 70);
      full.seoDescription = (
        s.seoDescription ||
        `${s.shortDescription || name} — problem diagnosis and next steps from Smartlance Designs.`
      ).slice(0, 170);
      full.ogTitle = full.seoTitle;
      full.ogDescription = full.seoDescription;
      break;
    }
    case "SUGGEST_SERVICES": {
      const services = input.relationPool?.services || [];
      const required = new Set(input.relationPool?.requiredServiceHrefs || []);
      const suggestions = services.slice(0, 5).map((svc) => ({
        kind: "service" as const,
        href: svc.href,
        slug: svc.slug,
        title: svc.title,
        reason: required.has(svc.href)
          ? "Already linked — keep unless intentionally changing relationships."
          : `May be relevant after diagnosing ${name}.`,
      }));
      const reasons = suggestions.slice(0, 3).map((sug) => ({
        href: sug.href!,
        title: sug.title,
        reason: sug.reason || "Relevant capability after diagnosis.",
      }));
      return {
        fields: buildFieldChanges({
          entity: s as unknown as Record<string, unknown>,
          proposed: { relatedServiceReasons: reasons },
          labels: SOLUTION_FIELD_LABELS,
          allowlist: SOLUTION_FIELD_ALLOWLIST,
          protectedFields: SOLUTION_PROTECTED_FIELDS,
          lockedFields: input.lockedFields,
          missingOnly: isEmptyValue(s.relatedServiceReasons),
        }),
        suggestedRelations: suggestions,
      };
    }
    case "SUGGEST_RELATIONSHIPS": {
      const suggestions: ProposalPayload["suggestedRelations"] = [];
      for (const p of (input.relationPool?.platforms || []).slice(0, 3)) {
        suggestions.push({
          kind: "platform",
          slug: p.slug,
          title: p.name,
          reason: `May be relevant when ${name} involves this platform context.`,
        });
      }
      const industrySlugs = (input.relationPool?.industries || [])
        .slice(0, 2)
        .map((i) => i.slug);
      const fields =
        industrySlugs.length && isEmptyValue(s.relatedIndustrySlugs)
          ? buildFieldChanges({
              entity: s as unknown as Record<string, unknown>,
              proposed: { relatedIndustrySlugs: industrySlugs },
              labels: SOLUTION_FIELD_LABELS,
              allowlist: SOLUTION_FIELD_ALLOWLIST,
              protectedFields: SOLUTION_PROTECTED_FIELDS,
              lockedFields: input.lockedFields,
              missingOnly: true,
            })
          : [];
      return { fields, suggestedRelations: suggestions };
    }
    case "REVIEW_SOLUTION": {
      const findings = [];
      findings.push({
        section: "PROBLEM CLARITY",
        severity: isEmptyValue(s.heroStatement) ? ("BLOCKER" as const) : ("PASS" as const),
        message: isEmptyValue(s.heroStatement)
          ? "Hero statement missing — visitors cannot recognise the problem."
          : "Hero statement present.",
      });
      findings.push({
        section: "SYMPTOMS",
        severity: isEmptyValue(s.problemSymptoms) ? ("WARNING" as const) : ("PASS" as const),
        message: isEmptyValue(s.problemSymptoms)
          ? "Symptoms list is empty."
          : "Symptoms present.",
      });
      findings.push({
        section: "CAUSES",
        severity: isEmptyValue(s.possibleCauses) ? ("WARNING" as const) : ("PASS" as const),
        message: isEmptyValue(s.possibleCauses)
          ? "Possible causes missing."
          : "Possible causes present.",
      });
      findings.push({
        section: "DIAGNOSTIC FLOW",
        severity: isEmptyValue(s.whatWeReview) ? ("REVIEW" as const) : ("PASS" as const),
        message: isEmptyValue(s.whatWeReview)
          ? "What we review is empty — diagnostic path incomplete."
          : "Review checklist present.",
      });
      findings.push({
        section: "APPROACH",
        severity: isEmptyValue(s.process) ? ("WARNING" as const) : ("PASS" as const),
        message: isEmptyValue(s.process)
          ? "Approach/process empty."
          : "Approach steps present.",
      });
      findings.push({
        section: "OUTCOME",
        severity: isEmptyValue(s.measurementPoints) ? ("REVIEW" as const) : ("PASS" as const),
        message: isEmptyValue(s.measurementPoints)
          ? "Measurement points empty — describe what could be measured, never fake results."
          : "Measurement points present; confirm no fabricated outcomes.",
      });
      findings.push({
        section: "RELATED SERVICES",
        severity: isEmptyValue(s.relatedServiceHrefs) ? ("BLOCKER" as const) : ("PASS" as const),
        message: isEmptyValue(s.relatedServiceHrefs)
          ? "No related Services — Solutions should connect to real capabilities."
          : "Related Services present; do not remove required links casually.",
      });
      findings.push({
        section: "PROOF",
        severity: isEmptyValue(s.relatedProjectSlugs) ? ("REVIEW" as const) : ("PASS" as const),
        message: isEmptyValue(s.relatedProjectSlugs)
          ? "No related Work — only link published projects."
          : "Related Work present.",
      });
      findings.push({
        section: "SEO",
        severity: !s.seoTitle || !s.seoDescription ? ("WARNING" as const) : ("PASS" as const),
        message: !s.seoTitle || !s.seoDescription
          ? "SEO fields incomplete — keep problem/intent-led."
          : "SEO fields present.",
      });
      findings.push({
        section: "AI SEARCH CLARITY",
        severity: "REVIEW" as const,
        message:
          "Confirm the page explains problem, causes, approach, and next step — not a Service brochure.",
      });
      findings.push({
        section: "CTA",
        severity: isEmptyValue(s.primaryCtaLabel) ? ("WARNING" as const) : ("PASS" as const),
        message: isEmptyValue(s.primaryCtaLabel)
          ? "Primary CTA missing."
          : "Primary CTA set.",
      });
      findings.push({
        section: "DUPLICATION",
        severity: "REVIEW" as const,
        message:
          "Compare nearby Solutions — avoid copy that fits another problem page unchanged.",
      });
      return { fields: [], reviewFindings: findings };
    }
    case "FILL_MISSING":
    case "IMPROVE_SOLUTION":
    default: {
      if (isEmptyValue(s.shortDescription) || input.action === "IMPROVE_SOLUTION") {
        full.shortDescription = `${name}: recognise the problem, understand likely causes, and see a practical next step.`;
      }
      if (isEmptyValue(s.eyebrow)) full.eyebrow = "Problem diagnosis";
      if (isEmptyValue(s.heroStatement) || input.action === "IMPROVE_SOLUTION") {
        full.heroStatement = `If ${name.toLowerCase()} sounds familiar, start here — not with a generic service brochure.`;
      }
      if (isEmptyValue(s.heroSupporting)) {
        full.heroSupporting =
          "This Solution page walks through symptoms, possible causes, what Smartlance reviews, and how related Services may help.";
      }
      if (isEmptyValue(s.problemSymptoms)) {
        full.problemSymptoms = [
          "The issue is recognisable but poorly named internally",
          "Teams jump to tactics before confirming the problem pattern",
        ];
      }
      if (isEmptyValue(s.possibleCauses)) {
        full.possibleCauses = [
          {
            title: "Wrong framing",
            description: "The team may be treating a problem as a missing capability package.",
          },
          {
            title: "Incomplete diagnosis",
            description: "Symptoms are visible but causes have not been checked systematically.",
          },
        ];
      }
      if (isEmptyValue(s.whatWeReview)) {
        full.whatWeReview = [
          "Visitor intent and primary journey",
          "Where the experience breaks or confuses",
          "Which Smartlance Services are actually relevant",
        ];
      }
      if (isEmptyValue(s.process)) {
        full.process = [
          { title: "Diagnose", description: "Confirm the problem pattern." },
          { title: "Prioritise", description: "Choose high-leverage next steps." },
          { title: "Connect", description: "Link to the right Services." },
        ];
      }
      if (isEmptyValue(s.measurementPoints)) {
        full.measurementPoints = [
          "Clarity of the primary path",
          "Quality of follow-up conversations",
          "Whether the diagnosed issue is better understood",
        ];
      }
      if (isEmptyValue(s.faqs)) {
        full.faqs = [
          {
            question: "Will this page sell a Service instead of diagnosing my problem?",
            answer:
              "No. Solutions stay problem-led. Services are linked when they are the right capability after diagnosis.",
          },
        ];
      }
      if (isEmptyValue(s.ctaTitle)) full.ctaTitle = `Get clarity on ${name}`;
      if (isEmptyValue(s.ctaDescription)) {
        full.ctaDescription =
          "Share what you are seeing. We will help you diagnose the issue and suggest a practical next step.";
      }
      if (isEmptyValue(s.primaryCtaLabel)) {
        full.primaryCtaLabel = "Request a free review";
        full.primaryCtaHref = "/free-website-review";
      }
      if (isEmptyValue(s.seoTitle) || isEmptyValue(s.seoDescription)) {
        full.seoTitle = (s.seoTitle || `${name} | Smartlance Designs`).slice(0, 70);
        full.seoDescription = (
          s.seoDescription ||
          (s.shortDescription || name).slice(0, 170)
        );
      }
      break;
    }
  }

  if (input.action.startsWith("IMPROVE_FIELD:")) {
    const field = input.action.slice("IMPROVE_FIELD:".length);
    if (SOLUTION_FIELD_ALLOWLIST.has(field) && !SOLUTION_PROTECTED_FIELDS.has(field)) {
      const current = (s as unknown as Record<string, unknown>)[field];
      let proposed: unknown = current;
      if (typeof current === "string" || isEmptyValue(current)) {
        proposed =
          typeof current === "string" && current.trim()
            ? `${current.trim()} (clarified for problem recognition.)`
            : `Problem-led copy for ${name}.`;
      }
      return {
        fields: buildFieldChanges({
          entity: s as unknown as Record<string, unknown>,
          proposed: { [field]: proposed },
          labels: SOLUTION_FIELD_LABELS,
          allowlist: SOLUTION_FIELD_ALLOWLIST,
          protectedFields: SOLUTION_PROTECTED_FIELDS,
          lockedFields: input.lockedFields,
        }),
      };
    }
  }

  const fields = buildFieldChanges({
    entity: s as unknown as Record<string, unknown>,
    proposed: full as Record<string, unknown>,
    labels: SOLUTION_FIELD_LABELS,
    allowlist: SOLUTION_FIELD_ALLOWLIST,
    protectedFields: SOLUTION_PROTECTED_FIELDS,
    lockedFields: input.lockedFields,
    missingOnly: input.action === "FILL_MISSING",
  });

  return { fields };
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}
