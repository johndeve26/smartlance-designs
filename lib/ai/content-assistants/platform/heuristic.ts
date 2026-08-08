/**
 * Deterministic Platform proposal heuristics + claim gating.
 * RESEARCH_AND_IMPROVE is preservation-first: research ≠ rewrite.
 */

import type { Platform } from "@prisma/client";
import { isEmptyValue } from "@/lib/ai/content-assistants/helpers";
import {
  annotateFieldClaimBlockers,
  containsUnsafePlatformClaim,
  containsVolatilePriceClaim,
} from "@/lib/ai/content-assistants/helpers";
import type {
  ProposalClaim,
  ProposalPayload,
  ProposalResearchSource,
} from "@/lib/ai/content-assistants/types";
import {
  PLATFORM_FIELD_ALLOWLIST,
  PLATFORM_FIELD_LABELS,
  PLATFORM_PROTECTED_FIELDS,
} from "@/lib/ai/content-assistants/allowlists";
import { buildFieldChanges } from "@/lib/ai/content-assistants/shared-generate";
import { isOfficialOrPrimary } from "@/lib/ai/content-assistants/research";
import {
  isStrongProseField,
  isThinProseField,
  resolveImprovementResultMode,
} from "@/lib/ai/content-assistants/improvement-result";

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}

function researchAndImproveHeuristic(input: {
  platform: Platform;
  lockedFields: string[];
  researchSources?: ProposalResearchSource[];
  writingProviderAvailable?: boolean;
}): ProposalPayload {
  const p = input.platform;
  const name = p.name;
  const hasResearch = Boolean(input.researchSources?.length);
  const official = (input.researchSources || []).filter((s) =>
    isOfficialOrPrimary(s.sourceType),
  );
  const proposed: Record<string, unknown> = {};
  const reasons: Record<string, string> = {};
  const findings: NonNullable<ProposalPayload["reviewFindings"]> = [];
  const claims: ProposalClaim[] = [];

  const writingAvailable = Boolean(input.writingProviderAvailable);

  // Freshness / research signal analysis (does not imply copy rewrite)
  const reviewed = p.lastReviewedAt;
  const ageDays = reviewed
    ? (Date.now() - reviewed.getTime()) / 86_400_000
    : null;

  if (!hasResearch) {
    findings.push({
      section: "RESEARCH SIGNAL",
      severity: "WARNING",
      message:
        "No research sources available for this run. Factual review areas are flagged; strong current copy is preserved.",
    });
  } else {
    findings.push({
      section: "RESEARCH SIGNAL",
      severity: "PASS",
      message: `${input.researchSources!.length} source(s) attached (${official.length} official/primary). Research informs review — it does not automatically rewrite prose.`,
    });
  }

  findings.push({
    section: "FACTUAL FRESHNESS",
    severity: !reviewed
      ? "WARNING"
      : ageDays && ageDays > 180
        ? "REVIEW"
        : "PASS",
    message: !reviewed
      ? "lastReviewedAt is empty — human should confirm volatile facts against current official docs before treating the page as freshly reviewed."
      : `Last factual review: ${reviewed.toISOString().slice(0, 10)}.`,
  });

  // Field quality gate — only fill empty / thin; never replace strong prose in heuristic mode
  const proseFields: Array<{
    key: keyof Platform;
    label: string;
    fill?: () => string;
  }> = [
    {
      key: "summary",
      label: "Summary",
      fill: () =>
        `${name} fit, strengths, and trade-offs for teams deciding whether it matches their website requirements.`,
    },
    {
      key: "description",
      label: "Description",
      fill: () => {
        const researchLine =
          hasResearch && official[0]
            ? ` Prefer current official documentation (${official[0].domain}) for volatile product facts.`
            : " Volatile features and pricing are not invented here.";
        return `${name} is presented as a technology option with clear fit guidance and honest limitations. Smartlance can help evaluate suitability and deliver related website work within our actual capabilities.${researchLine}`;
      },
    },
    {
      key: "tagline",
      label: "Tagline",
      fill: () => `${name}: clear fit guidance, not vendor hype.`,
    },
  ];

  for (const field of proseFields) {
    const current = p[field.key];
    if (isEmptyValue(current) && field.fill) {
      proposed[field.key as string] = field.fill();
      reasons[field.key as string] = "Empty field — safe heuristic fill.";
    } else if (isThinProseField(current, 40) && field.fill && !isStrongProseField(current, 80)) {
      // Thin stubs may be filled; strong copy preserved
      proposed[field.key as string] = field.fill();
      reasons[field.key as string] = "Thin stub — safe heuristic fill.";
    } else if (isStrongProseField(current, 60)) {
      findings.push({
        section: "PRESERVATION",
        severity: "PASS",
        message: `${field.label} looks populated and reasonably strong — kept current (no heuristic rewrite).`,
      });
    }
  }

  if (isEmptyValue(p.audiences)) {
    proposed.audiences = [
      `Decision-makers comparing ${name} to alternatives`,
      "Teams that need practical website delivery on a chosen platform",
    ];
    reasons.audiences = "Empty audiences — safe fill.";
  }
  if (isEmptyValue(p.whenItFits)) {
    proposed.whenItFits = [
      `Requirements align with ${name}'s strengths`,
      "Stakeholders accept the platform's natural constraints",
    ];
    reasons.whenItFits = "Empty whenItFits — safe fill.";
  }
  if (isEmptyValue(p.capabilities)) {
    proposed.capabilities = [
      "Publishing and content workflows typical of the platform",
      "Common site structures suitable for the platform model",
    ];
    reasons.capabilities = "Empty capabilities — safe fill pending official verification.";
  }
  if (isEmptyValue(p.challenges)) {
    proposed.challenges = [
      "Not every customization path is equally practical",
      "SEO and conversion quality still depend on execution",
    ];
    reasons.challenges = "Empty challenges — safe fill.";
  }
  if (isEmptyValue(p.ctaTitle)) {
    proposed.ctaTitle = `Discuss ${name} for your project`;
    reasons.ctaTitle = "Empty CTA title — safe fill.";
  }
  if (isEmptyValue(p.ctaDescription)) {
    proposed.ctaDescription =
      "Share your constraints. We will help you decide fit — without invented partner claims or guarantees.";
    reasons.ctaDescription = "Empty CTA description — safe fill.";
  }
  if (isEmptyValue(p.seoTitle) || isEmptyValue(p.seoDescription)) {
    if (isEmptyValue(p.seoTitle)) {
      proposed.seoTitle = `${name} | Smartlance Designs`.slice(0, 70);
      reasons.seoTitle = "Missing SEO title.";
    }
    if (isEmptyValue(p.seoDescription)) {
      proposed.seoDescription = (
        p.summary || `${name} fit and trade-offs`
      ).slice(0, 170);
      reasons.seoDescription = "Missing SEO description.";
    }
  }

  // Research without writing provider: flag review areas; do not fabricate broad rewrites
  if (hasResearch && !writingAvailable) {
    findings.push({
      section: "WRITING CAPABILITY",
      severity: "REVIEW",
      message:
        "Research sources are available but a Writing provider is not configured. Strong current prose is preserved. Configure a Writing provider for targeted, source-grounded rewrites of stale claims only.",
    });
    if (official[0]) {
      findings.push({
        section: "FACTUAL REVIEW AREAS",
        severity: "REVIEW",
        message: `Confirm capabilities, limitations, and any volatile product statements against ${official
          .slice(0, 3)
          .map((s) => s.domain || s.url)
          .join(", ")}. Propose field-level edits only where a specific claim is outdated.`,
      });
    }
  } else if (!hasResearch && !writingAvailable) {
    findings.push({
      section: "RESEARCH / WRITING",
      severity: "WARNING",
      message:
        "Research-required action ran without research sources and without a Writing provider. No broad rewrite was produced.",
    });
  }

  // Never invent partner/cert experience
  if (!p.verifiedExperience) {
    findings.push({
      section: "SMARTLANCE EXPERIENCE CLAIMS",
      severity: "PASS",
      message:
        "verifiedExperience is false — proposals must not claim certified/official partnership.",
    });
  }

  const fields = buildFieldChanges({
    entity: p as unknown as Record<string, unknown>,
    proposed,
    labels: PLATFORM_FIELD_LABELS,
    allowlist: PLATFORM_FIELD_ALLOWLIST,
    protectedFields: PLATFORM_PROTECTED_FIELDS,
    lockedFields: input.lockedFields,
    reasons,
  });
  annotateFieldClaimBlockers(fields, { hasResearchSources: hasResearch });

  const writingProviderRequired =
    hasResearch &&
    !writingAvailable &&
    fields.length === 0 &&
    isStrongProseField(p.summary) &&
    isStrongProseField(p.description);

  const researchNeeded = !hasResearch;

  const resultMode = resolveImprovementResultMode({
    fieldCount: fields.length,
    writingProviderRequired,
    researchNeeded: researchNeeded && fields.length === 0,
  });

  if (fields.length === 0) {
    findings.unshift({
      section: "OUTCOME",
      severity: "PASS",
      message:
        resultMode === "WRITING_PROVIDER_REQUIRED"
          ? "No content changes recommended in heuristic mode. Configure a Writing provider for targeted source-grounded improvements."
          : resultMode === "RESEARCH_NEEDED"
            ? "No content changes recommended. Attach or configure research before rewriting volatile facts."
            : "No content changes recommended. Current copy already looks stronger than a heuristic rewrite.",
    });
  }

  if (hasResearch && official[0]) {
    claims.push({
      kind: "PLATFORM_FEATURE",
      claimText: `Research attached with preference for official sources (${official[0].domain}).`,
      support: "SUPPORTED",
      evidenceStrength: "MODERATE",
      sourceUrls: official.slice(0, 3).map((s) => s.url),
      checkedAt: new Date().toISOString(),
    });
  }

  return {
    fields,
    claims,
    reviewFindings: findings,
    resultMode,
  };
}

export function heuristicPlatformProposal(input: {
  platform: Platform;
  action: string;
  lockedFields: string[];
  customInstructions?: string;
  researchSources?: ProposalResearchSource[];
  relationPool?: {
    services: Array<{ href: string; title: string; slug: string }>;
  };
  /** When false/undefined, RESEARCH_AND_IMPROVE will not invent broad prose rewrites */
  writingProviderAvailable?: boolean;
}): ProposalPayload {
  const p = input.platform;
  const name = p.name;
  const hasResearch = Boolean(input.researchSources?.length);
  const official = (input.researchSources || []).filter((s) =>
    isOfficialOrPrimary(s.sourceType),
  );
  // customInstructions guide generation only — never append into proposed public copy
  void input.customInstructions;

  if (input.action === "RESEARCH_AND_IMPROVE") {
    return researchAndImproveHeuristic({
      platform: p,
      lockedFields: input.lockedFields,
      researchSources: input.researchSources,
      writingProviderAvailable: input.writingProviderAvailable,
    });
  }

  const proposed: Record<string, unknown> = {};
  const claims: ProposalClaim[] = [];

  switch (input.action) {
    case "IMPROVE_FIT": {
      proposed.audiences = asStringList(p.audiences).length
        ? asStringList(p.audiences)
        : [
            `Teams evaluating ${name} for a durable website`,
            "Organisations weighing fit vs trade-offs before committing",
          ];
      proposed.whenItFits = asStringList(p.whenItFits).length
        ? asStringList(p.whenItFits)
        : [
            `When ${name}'s strengths match the project constraints`,
            "When the team can operate within the platform's natural limits",
          ];
      if (isEmptyValue(p.summary)) {
        proposed.summary = `${name} is a website platform option. This page explains fit, strengths, and trade-offs — not a vendor brochure.`;
      }
      break;
    }
    case "IMPROVE_TRADEOFFS": {
      proposed.capabilities = asStringList(p.capabilities).length
        ? asStringList(p.capabilities)
        : [
            "Structured site building within the platform model",
            "Common content and publishing workflows",
          ];
      proposed.challenges = asStringList(p.challenges).length
        ? asStringList(p.challenges)
        : [
            "Constraints that may not suit every project type",
            "Trade-offs around customization, performance, or ownership",
          ];
      if (isEmptyValue(p.conversionNote)) {
        proposed.conversionNote = `Conversion quality on ${name} depends on structure, messaging, and measurement — not the platform logo alone.`;
      }
      if (isEmptyValue(p.migrationNote)) {
        proposed.migrationNote = `Migrating to or from ${name} should be planned around content, redirects, and SEO continuity — not assumed to be automatic.`;
      }
      break;
    }
    case "GENERATE_FAQS": {
      proposed.faqs = [
        {
          question: `Is ${name} always the right choice?`,
          answer: `No. Fit depends on requirements, constraints, and trade-offs. This page is decision support — not a claim that ${name} is always best.`,
        },
        {
          question: "Does Smartlance invent platform features or pricing?",
          answer:
            "No. Volatile product facts should come from current official sources. We do not invent certifications, partner status, or exact plan prices.",
        },
        {
          question: `What can Smartlance help with on ${name}?`,
          answer: `Practical website work around fit, structure, SEO/conversion context, and migration considerations — grounded in Smartlance's actual capabilities.`,
        },
      ];
      break;
    }
    case "GENERATE_SEO": {
      proposed.seoTitle = (p.seoTitle || `${name} websites | Smartlance Designs`).slice(
        0,
        70,
      );
      proposed.seoDescription = (
        p.seoDescription ||
        `${p.summary || name}: fit, strengths, and trade-offs — decision support from Smartlance Designs.`
      ).slice(0, 170);
      proposed.ogTitle = proposed.seoTitle;
      proposed.ogDescription = proposed.seoDescription;
      break;
    }
    case "SUGGEST_RELATIONSHIPS": {
      const suggestions = (input.relationPool?.services || [])
        .slice(0, 5)
        .map((s) => ({
          kind: "service" as const,
          href: s.href,
          slug: s.slug,
          title: s.title,
          reason: `May be relevant when ${name} work involves this capability.`,
        }));
      return {
        fields: [],
        suggestedRelations: suggestions,
        resultMode: suggestions.length
          ? "PARTIAL_CHANGE_RECOMMENDED"
          : "NO_CHANGE_RECOMMENDED",
      };
    }
    case "REVIEW_FRESHNESS":
    case "REVIEW_PLATFORM": {
      const findings = [];
      const reviewed = p.lastReviewedAt;
      const ageDays = reviewed
        ? (Date.now() - reviewed.getTime()) / 86_400_000
        : null;
      findings.push({
        section: "FACTUAL FRESHNESS",
        severity:
          !reviewed
            ? ("WARNING" as const)
            : ageDays && ageDays > 180
              ? ("REVIEW" as const)
              : ("PASS" as const),
        message: !reviewed
          ? "Not factually reviewed yet — consider Research & improve before volatile claims."
          : `Last factual review: ${reviewed.toISOString().slice(0, 10)}${
              ageDays && ageDays > 180
                ? " — consider checking current platform information."
                : ""
            }`,
      });
      findings.push({
        section: "PLATFORM FIT",
        severity: isEmptyValue(p.whenItFits) ? ("WARNING" as const) : ("PASS" as const),
        message: isEmptyValue(p.whenItFits)
          ? "When it fits is empty."
          : "Fit guidance present.",
      });
      findings.push({
        section: "STRENGTHS",
        severity: isEmptyValue(p.capabilities) ? ("WARNING" as const) : ("PASS" as const),
        message: isEmptyValue(p.capabilities)
          ? "Capabilities empty — only list grounded strengths."
          : "Capabilities present.",
      });
      findings.push({
        section: "TRADE-OFFS",
        severity: isEmptyValue(p.challenges) ? ("WARNING" as const) : ("PASS" as const),
        message: isEmptyValue(p.challenges)
          ? "Challenges/trade-offs empty."
          : "Trade-offs present.",
      });
      findings.push({
        section: "SMARTLANCE EXPERIENCE CLAIMS",
        severity: "REVIEW" as const,
        message: p.verifiedExperience
          ? "verifiedExperience is true (human-set). Still avoid inventing client metrics."
          : "verifiedExperience is false — do not claim certified partnership or unverified client work.",
      });
      findings.push({
        section: "SEO",
        severity: !p.seoTitle || !p.seoDescription ? ("WARNING" as const) : ("PASS" as const),
        message: !p.seoTitle || !p.seoDescription
          ? "SEO incomplete."
          : "SEO fields present.",
      });
      findings.push({
        section: "AI SEARCH CLARITY",
        severity: "REVIEW" as const,
        message:
          "Confirm the page answers: what it is, who it suits, where it fits poorly, and what Smartlance can help with.",
      });
      findings.push({
        section: "DUPLICATION",
        severity: "REVIEW" as const,
        message: "Avoid copy that fits a nearby Platform unchanged.",
      });
      return { fields: [], reviewFindings: findings };
    }
    case "FILL_MISSING":
    case "IMPROVE_PLATFORM":
    default: {
      // IMPROVE_PLATFORM (heuristic): preserve strong prose; only fill empty/thin
      const allowOverwrite = false;
      if (isEmptyValue(p.summary) || (allowOverwrite && input.action === "IMPROVE_PLATFORM")) {
        proposed.summary = `${name} fit, strengths, and trade-offs for teams deciding whether it matches their website requirements.`;
      }
      if (isEmptyValue(p.description)) {
        const researchLine =
          hasResearch && official[0]
            ? ` Factual details should stay aligned with current official documentation (${official[0].domain}).`
            : " Volatile features and pricing are not invented here.";
        proposed.description = `${name} is presented as a technology option with clear fit guidance and honest limitations. Smartlance can help evaluate suitability and deliver related website work within our actual capabilities.${researchLine}`;
      }
      if (isEmptyValue(p.tagline)) {
        proposed.tagline = `${name}: clear fit guidance, not vendor hype.`;
      }
      if (isEmptyValue(p.audiences)) {
        proposed.audiences = [
          `Decision-makers comparing ${name} to alternatives`,
          "Teams that need practical website delivery on a chosen platform",
        ];
      }
      if (isEmptyValue(p.whenItFits)) {
        proposed.whenItFits = [
          `Requirements align with ${name}'s strengths`,
          "Stakeholders accept the platform's natural constraints",
        ];
      }
      if (isEmptyValue(p.capabilities)) {
        proposed.capabilities = [
          "Publishing and content workflows typical of the platform",
          "Common site structures suitable for the platform model",
        ];
      }
      if (isEmptyValue(p.challenges)) {
        proposed.challenges = [
          "Not every customization path is equally practical",
          "SEO and conversion quality still depend on execution",
        ];
      }
      if (isEmptyValue(p.ctaTitle)) {
        proposed.ctaTitle = `Discuss ${name} for your project`;
      }
      if (isEmptyValue(p.ctaDescription)) {
        proposed.ctaDescription =
          "Share your constraints. We will help you decide fit — without invented partner claims or guarantees.";
      }
      if (isEmptyValue(p.seoTitle) || isEmptyValue(p.seoDescription)) {
        proposed.seoTitle = (p.seoTitle || `${name} | Smartlance Designs`).slice(0, 70);
        proposed.seoDescription = (
          p.seoDescription ||
          (p.summary || `${name} fit and trade-offs`).slice(0, 170)
        );
      }
      break;
    }
  }

  if (input.action.startsWith("IMPROVE_FIELD:")) {
    const field = input.action.slice("IMPROVE_FIELD:".length);
    if (PLATFORM_FIELD_ALLOWLIST.has(field) && !PLATFORM_PROTECTED_FIELDS.has(field)) {
      const current = (p as unknown as Record<string, unknown>)[field];
      let value: unknown = current;
      if (typeof current === "string" || isEmptyValue(current)) {
        value =
          typeof current === "string" && current.trim()
            ? `${current.trim()} (clarified for balanced platform decision support.)`
            : `Balanced, factual copy for ${name}.`;
      }
      const fields = buildFieldChanges({
        entity: p as unknown as Record<string, unknown>,
        proposed: { [field]: value },
        labels: PLATFORM_FIELD_LABELS,
        allowlist: PLATFORM_FIELD_ALLOWLIST,
        protectedFields: PLATFORM_PROTECTED_FIELDS,
        lockedFields: input.lockedFields,
      });
      annotateFieldClaimBlockers(fields, { hasResearchSources: hasResearch });
      return { fields };
    }
  }

  for (const [k, v] of Object.entries(proposed)) {
    const text = typeof v === "string" ? v : JSON.stringify(v);
    if (/always better for seo|best platform for seo/i.test(text)) {
      claims.push({
        kind: "GENERAL_RECOMMENDATION",
        claimText: text.slice(0, 200),
        support: "BLOCKED",
        field: k,
        evidenceStrength: "INSUFFICIENT",
      });
      delete proposed[k];
    }
    if (containsVolatilePriceClaim(text) && !hasResearch) {
      claims.push({
        kind: "PLATFORM_PRICING",
        claimText: text.slice(0, 200),
        support: "BLOCKED",
        field: k,
        evidenceStrength: "INSUFFICIENT",
      });
      delete proposed[k];
    }
    if (containsUnsafePlatformClaim(text)) {
      claims.push({
        kind: "SMARTLANCE_PLATFORM_EXPERIENCE",
        claimText: text.slice(0, 200),
        support: "BLOCKED",
        field: k,
      });
    }
  }

  if (hasResearch && official[0] && proposed.capabilities) {
    claims.push({
      kind: "PLATFORM_FEATURE",
      claimText: `Capabilities grounded with preference for official sources (${official[0].domain}).`,
      support: "SUPPORTED",
      field: "capabilities",
      evidenceStrength: "MODERATE",
      sourceUrls: official.slice(0, 3).map((s) => s.url),
      checkedAt: new Date().toISOString(),
    });
  }

  const fields = buildFieldChanges({
    entity: p as unknown as Record<string, unknown>,
    proposed,
    labels: PLATFORM_FIELD_LABELS,
    allowlist: PLATFORM_FIELD_ALLOWLIST,
    protectedFields: PLATFORM_PROTECTED_FIELDS,
    lockedFields: input.lockedFields,
    missingOnly: input.action === "FILL_MISSING",
  });
  annotateFieldClaimBlockers(fields, { hasResearchSources: hasResearch });

  return {
    fields,
    claims,
    resultMode: resolveImprovementResultMode({ fieldCount: fields.length }),
  };
}
