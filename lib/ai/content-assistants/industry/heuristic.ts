/**
 * Industry AI heuristics — experience boundary + generic-copy detection.
 */

import type { Industry } from "@prisma/client";
import {
  annotateFieldClaimBlockers,
  containsUnsupportedIndustryExperience,
  isEmptyValue,
} from "@/lib/ai/content-assistants/helpers";
import type { ProposalPayload } from "@/lib/ai/content-assistants/types";
import {
  INDUSTRY_FIELD_ALLOWLIST,
  INDUSTRY_FIELD_LABELS,
  INDUSTRY_PROTECTED_FIELDS,
} from "@/lib/ai/content-assistants/allowlists";
import { buildFieldChanges } from "@/lib/ai/content-assistants/shared-generate";
import { resolveImprovementResultMode } from "@/lib/ai/content-assistants/improvement-result";
import {
  buildIndustrySeo,
  buildSpecificIndustryDescription,
  failsIndustrySubstitutionTest,
  isIndustryPlaceholderCopy,
  looksLikeGenericIndustryCopy,
  needsIndustryDescriptionImprovement,
} from "@/lib/ai/content-assistants/industry/specificity";

export {
  looksLikeGenericIndustryCopy,
  failsIndustrySubstitutionTest,
  isIndustryPlaceholderCopy,
  needsIndustryDescriptionImprovement,
} from "@/lib/ai/content-assistants/industry/specificity";

export function heuristicIndustryProposal(input: {
  industry: Industry;
  action: string;
  lockedFields: string[];
  customInstructions?: string;
  verified: boolean;
  publishedWork?: Array<{ name: string; slug: string; shortDescription?: string | null }>;
  relationPool?: {
    services: Array<{ href: string; title: string; slug: string }>;
    solutions: Array<{ slug: string; name: string }>;
    work: Array<{ id: string; slug: string; name: string; title: string | null }>;
  };
}): ProposalPayload {
  const ind = input.industry;
  const name = ind.name;
  void input.customInstructions;

  const proposed: Record<string, unknown> = {};
  const reasons: Record<string, string> = {};

  switch (input.action) {
    case "GENERATE_SEO": {
      const seo = buildIndustrySeo({
        name,
        slug: ind.slug,
        description: ind.description,
        verified: input.verified,
      });
      proposed.seoTitle = seo.seoTitle;
      proposed.seoDescription = seo.seoDescription;
      proposed.ogTitle = seo.seoTitle;
      proposed.ogDescription = seo.seoDescription;
      reasons.seoTitle =
        "Derived from sector website intent — not a mechanical ‘Web Design for {Industry}’ template.";
      break;
    }
    case "SUGGEST_SERVICES": {
      const suggestions = (input.relationPool?.services || [])
        .slice(0, 5)
        .map((s) => ({
          kind: "service" as const,
          href: s.href,
          slug: s.slug,
          title: s.title,
          reason: `May help ${name} organisations with website capability work.`,
        }));
      const links = suggestions.slice(0, 4).map((s) => ({
        href: s.href!,
        title: s.title,
        label: s.title,
      }));
      return {
        fields: buildFieldChanges({
          entity: ind as unknown as Record<string, unknown>,
          proposed: { relatedServiceLinks: links },
          labels: INDUSTRY_FIELD_LABELS,
          allowlist: INDUSTRY_FIELD_ALLOWLIST,
          protectedFields: INDUSTRY_PROTECTED_FIELDS,
          lockedFields: input.lockedFields,
          missingOnly: isEmptyValue(ind.relatedServiceLinks),
        }),
        suggestedRelations: suggestions,
      };
    }
    case "SUGGEST_SOLUTIONS": {
      const suggestions = (input.relationPool?.solutions || [])
        .slice(0, 5)
        .map((s) => ({
          kind: "solution" as const,
          slug: s.slug,
          title: s.name,
          reason: `Problem path that ${name} buyers may recognise.`,
        }));
      return {
        fields: buildFieldChanges({
          entity: ind as unknown as Record<string, unknown>,
          proposed: {
            relatedSolutionSlugs: suggestions.map((s) => s.slug!).slice(0, 4),
          },
          labels: INDUSTRY_FIELD_LABELS,
          allowlist: INDUSTRY_FIELD_ALLOWLIST,
          protectedFields: INDUSTRY_PROTECTED_FIELDS,
          lockedFields: input.lockedFields,
          missingOnly: isEmptyValue(ind.relatedSolutionSlugs),
        }),
        suggestedRelations: suggestions,
      };
    }
    case "SUGGEST_WORK": {
      if (!input.verified) {
        return {
          fields: [],
          suggestedRelations: [],
          reviewFindings: [
            {
              section: "VERIFIED EXPERIENCE",
              severity: "BLOCKER",
              message:
                "This Industry is supported-only. Work proof cannot be invented or implied.",
            },
          ],
        };
      }
      const linked = new Set((input.publishedWork || []).map((w) => w.slug));
      const suggestions = (input.relationPool?.work || [])
        .filter((w) => linked.has(w.slug) || input.publishedWork?.length)
        .slice(0, 5)
        .map((w) => ({
          kind: "work" as const,
          id: w.id,
          slug: w.slug,
          title: w.title || w.name,
          reason: "Published Work candidate — human accepts any link changes.",
        }));
      return { fields: [], suggestedRelations: suggestions };
    }
    case "SUGGEST_RELATIONSHIPS": {
      return heuristicIndustryProposal({
        ...input,
        action: "SUGGEST_SERVICES",
      });
    }
    case "REVIEW_INDUSTRY": {
      const findings = [];
      const desc = ind.description || "";
      const generic = looksLikeGenericIndustryCopy(desc, name);
      const substitutionFail = failsIndustrySubstitutionTest(desc, name);
      findings.push({
        section: "INDUSTRY SPECIFICITY",
        severity: generic || substitutionFail ? ("WARNING" as const) : ("PASS" as const),
        message:
          generic || substitutionFail
            ? "GENERIC_COPY warning — paragraph may still work after swapping the industry name, or relies on filler agency language."
            : "Description appears to carry sector-specific cues.",
      });
      findings.push({
        section: "VERIFIED EXPERIENCE",
        severity: input.verified ? ("PASS" as const) : ("REVIEW" as const),
        message: input.verified
          ? "Proven industry with verified experience flag — reference only verified Work facts."
          : "Supported industry — must not claim Smartlance client experience.",
      });
      findings.push({
        section: "PROOF",
        severity:
          input.verified && !(input.publishedWork || []).length
            ? ("WARNING" as const)
            : ("PASS" as const),
        message:
          input.verified && !(input.publishedWork || []).length
            ? "Proven flag set but no published Work linked in context."
            : "Proof boundary respected in this review.",
      });
      findings.push({
        section: "SEO",
        severity: !ind.seoTitle || !ind.seoDescription ? ("WARNING" as const) : ("PASS" as const),
        message: !ind.seoTitle || !ind.seoDescription
          ? "SEO fields incomplete."
          : "SEO fields present.",
      });
      findings.push({
        section: "DUPLICATION",
        severity: "REVIEW" as const,
        message: "Compare nearby Industries for interchangeable paragraphs.",
      });
      findings.push({
        section: "AI SEARCH CLARITY",
        severity: "REVIEW" as const,
        message:
          "Confirm the page explains industry website needs and relevant Smartlance Services/Solutions.",
      });
      if (containsUnsupportedIndustryExperience(desc) && !input.verified) {
        findings.push({
          section: "VERIFIED EXPERIENCE",
          severity: "BLOCKER" as const,
          message: "Current description implies unsupported Smartlance experience.",
        });
      }
      return { fields: [], reviewFindings: findings };
    }
    case "RESEARCH_INDUSTRY_NEEDS":
    case "IMPROVE_SPECIFICITY":
    case "IMPROVE_INDUSTRY":
    case "FILL_MISSING":
    default: {
      const specificBody = buildSpecificIndustryDescription({
        name,
        slug: ind.slug,
        verified: input.verified,
        publishedWork: input.publishedWork,
      });

      const desc = ind.description || "";
      const shouldImproveDescription = needsIndustryDescriptionImprovement(
        desc,
        name,
      );

      // For IMPROVE: only replace when empty, placeholder, thin, or generic
      if (input.action === "FILL_MISSING") {
        if (isEmptyValue(desc) || isIndustryPlaceholderCopy(desc)) {
          proposed.description = specificBody;
          reasons.description = isIndustryPlaceholderCopy(desc)
            ? "Placeholder description — replaced with sector-specific fill."
            : "Empty description — sector-specific fill.";
        }
      } else if (
        input.action === "IMPROVE_INDUSTRY" ||
        input.action === "IMPROVE_SPECIFICITY" ||
        input.action === "RESEARCH_INDUSTRY_NEEDS"
      ) {
        if (shouldImproveDescription) {
          proposed.description = specificBody;
          reasons.description = isIndustryPlaceholderCopy(desc)
            ? "Placeholder description — replaced with sector-specific journey copy."
            : desc.trim().length < 160
              ? "Thin description — expanded with sector-specific journey copy."
              : "Generic description — replaced with sector-specific journey copy.";
        }
      } else if (shouldImproveDescription) {
        proposed.description = specificBody;
      }

      if (isEmptyValue(ind.seoTitle) || isEmptyValue(ind.seoDescription)) {
        const seo = buildIndustrySeo({
          name,
          slug: ind.slug,
          description:
            typeof proposed.description === "string"
              ? proposed.description
              : ind.description,
          verified: input.verified,
        });
        if (isEmptyValue(ind.seoTitle)) proposed.seoTitle = seo.seoTitle;
        if (isEmptyValue(ind.seoDescription)) {
          proposed.seoDescription = seo.seoDescription;
        }
      }
      break;
    }
  }

  if (input.action.startsWith("IMPROVE_FIELD:")) {
    const field = input.action.slice("IMPROVE_FIELD:".length);
    if (INDUSTRY_FIELD_ALLOWLIST.has(field)) {
      const current = (ind as unknown as Record<string, unknown>)[field];
      let value: unknown = current;
      if (typeof current === "string" || isEmptyValue(current)) {
        value =
          typeof current === "string" &&
          current.trim() &&
          !needsIndustryDescriptionImprovement(current, name)
            ? current.trim()
            : buildSpecificIndustryDescription({
                name,
                slug: ind.slug,
                verified: input.verified,
                publishedWork: input.publishedWork,
              });
      }
      const fields = buildFieldChanges({
        entity: ind as unknown as Record<string, unknown>,
        proposed: { [field]: value },
        labels: INDUSTRY_FIELD_LABELS,
        allowlist: INDUSTRY_FIELD_ALLOWLIST,
        protectedFields: INDUSTRY_PROTECTED_FIELDS,
        lockedFields: input.lockedFields,
      });
      annotateFieldClaimBlockers(fields, {
        allowExperienceClaims: input.verified,
      });
      return { fields };
    }
  }

  if (
    typeof proposed.description === "string" &&
    !input.verified &&
    containsUnsupportedIndustryExperience(proposed.description)
  ) {
    proposed.description = proposed.description.replace(
      /\b(our clients in this (industry|sector)|our extensive experience|we('ve| have) (helped|worked with) (many |numerous )?(businesses|clients)|from our work with .{0,40} businesses|our proven track record in)\b/gi,
      "organisations in this sector",
    );
  }

  const fields = buildFieldChanges({
    entity: ind as unknown as Record<string, unknown>,
    proposed,
    labels: INDUSTRY_FIELD_LABELS,
    allowlist: INDUSTRY_FIELD_ALLOWLIST,
    protectedFields: INDUSTRY_PROTECTED_FIELDS,
    lockedFields: input.lockedFields,
    missingOnly: input.action === "FILL_MISSING",
    reasons,
  });
  annotateFieldClaimBlockers(fields, {
    allowExperienceClaims: input.verified,
  });

  const reviewFindings: NonNullable<ProposalPayload["reviewFindings"]> = [];
  const descField = fields.find((f) => f.field === "description");
  const descText =
    typeof descField?.proposed === "string"
      ? descField.proposed
      : typeof ind.description === "string"
        ? ind.description
        : "";

  if (descText && looksLikeGenericIndustryCopy(descText, name)) {
    reviewFindings.push({
      section: "INDUSTRY SPECIFICITY",
      severity: "WARNING",
      message:
        "GENERIC_COPY warning — consider stronger sector-specific buyer/journey detail.",
    });
  } else if (
    descText &&
    failsIndustrySubstitutionTest(descText, name)
  ) {
    reviewFindings.push({
      section: "INDUSTRY SPECIFICITY",
      severity: "WARNING",
      message:
        "GENERIC_COPY warning — substitution test failed (copy still reads as generic after renaming the industry).",
    });
  } else if (descField && typeof descField.proposed === "string") {
    reviewFindings.push({
      section: "INDUSTRY SPECIFICITY",
      severity: "PASS",
      message: "Proposed description includes sector-specific journey/trust cues.",
    });
  }

  // If improve found nothing to change and current is already specific
  if (
    (input.action === "IMPROVE_INDUSTRY" || input.action === "IMPROVE_SPECIFICITY") &&
    fields.length === 0
  ) {
    reviewFindings.unshift({
      section: "OUTCOME",
      severity: "PASS",
      message:
        "No content changes recommended — current Industry copy already looks sector-specific enough.",
    });
  }

  return {
    fields,
    reviewFindings: reviewFindings.length ? reviewFindings : undefined,
    resultMode: resolveImprovementResultMode({ fieldCount: fields.length }),
  };
}
