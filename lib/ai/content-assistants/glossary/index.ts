/**
 * Glossary AI — plain-English definition / reference assistant.
 */

import {
  GLOSSARY_FIELD_ALLOWLIST,
  GLOSSARY_FIELD_LABELS,
  GLOSSARY_PROTECTED_FIELDS,
} from "@/lib/ai/content-assistants/allowlists";
import {
  buildResourceFieldChanges,
  createResourceAssistant,
  resourceSeoFields,
} from "@/lib/ai/content-assistants/resource-factory";
import { copyStringFields } from "@/lib/ai/content-assistants/resource-shared";
import type { ProposalPayload } from "@/lib/ai/content-assistants/types";
import { PROMPT_VERSIONS } from "@/lib/ai/prompts";
import { isEmptyValue } from "@/lib/ai/content-assistants/helpers";
import { prisma } from "@/lib/db";

export const GLOSSARY_ACTIONS = [
  { id: "FILL_MISSING", label: "Fill missing fields", promptVersion: PROMPT_VERSIONS.glossaryFillMissing, loadingLabel: "Filling missing Glossary fields…", researchPolicy: "optional" as const },
  { id: "DEFINE_TERM", label: "Define term", promptVersion: PROMPT_VERSIONS.glossaryDefine, loadingLabel: "Defining Glossary term…", researchPolicy: "recommended" as const },
  { id: "IMPROVE_DEFINITION", label: "Improve definition", promptVersion: PROMPT_VERSIONS.glossaryImprove, loadingLabel: "Improving definition…", researchPolicy: "recommended" as const },
  { id: "ADD_EXAMPLE", label: "Add example", promptVersion: PROMPT_VERSIONS.glossaryExample, loadingLabel: "Adding Glossary example…", researchPolicy: "optional" as const },
  { id: "IMPROVE_TECHNICAL_EXPLANATION", label: "Improve technical explanation", promptVersion: PROMPT_VERSIONS.glossaryTechnical, loadingLabel: "Improving technical explanation…", researchPolicy: "recommended" as const },
  { id: "SUGGEST_ALIASES", label: "Suggest aliases", promptVersion: PROMPT_VERSIONS.glossaryAliases, loadingLabel: "Suggesting aliases…", researchPolicy: "optional" as const },
  { id: "SUGGEST_RELATED_TERMS", label: "Suggest related terms", promptVersion: PROMPT_VERSIONS.glossaryRelated, loadingLabel: "Suggesting related terms…", researchPolicy: "optional" as const },
  { id: "GENERATE_SEO", label: "Generate SEO", promptVersion: PROMPT_VERSIONS.glossarySeo, loadingLabel: "Generating Glossary SEO…", researchPolicy: "optional" as const },
  { id: "CHECK_FRESHNESS", label: "Check freshness", promptVersion: PROMPT_VERSIONS.glossaryFreshness, loadingLabel: "Checking Glossary freshness…", researchPolicy: "required" as const },
  { id: "REVIEW_TERM", label: "Review term", promptVersion: PROMPT_VERSIONS.glossaryReview, loadingLabel: "Reviewing technical definition…", researchPolicy: "optional" as const },
] as const;

const OBSOLETE_FID_RE = /\bFID\b.*\b(current|core web vital|CWV)\b|\bCore Web Vital[s]?\b.*\bFID\b/i;

function heuristicGlossaryProposal(input: {
  entity: Record<string, unknown>;
  action: string;
  lockedFields: string[];
}): ProposalPayload {
  const e = input.entity;
  const payload = (e.payload || {}) as Record<string, unknown>;
  const term = String(e.title || payload.term || "Term");
  const blob = JSON.stringify({ ...e, ...payload });

  if (input.action === "REVIEW_TERM" || input.action === "CHECK_FRESHNESS") {
    return {
      fields: [],
      reviewFindings: [
        { section: "DEFINITION CLARITY", severity: isEmptyValue(e.shortDefinition || payload.shortDefinition) ? "WARNING" : "PASS", message: "Short definition should start in plain English." },
        { section: "TECHNICAL ACCURACY", severity: OBSOLETE_FID_RE.test(blob) ? "BLOCKER" : "REVIEW", message: OBSOLETE_FID_RE.test(blob) ? "Do not present FID as a current Core Web Vital." : "Confirm standards/Google terminology against official sources." },
        { section: "PLAIN ENGLISH", severity: "REVIEW", message: "Avoid defining a term with denser unexplained jargon." },
        { section: "ALIASES", severity: "REVIEW", message: "Aliases must not conflict with other glossary routes." },
        { section: "FRESHNESS", severity: "REVIEW", message: "Technical standards and CWV metrics change — prefer official sources." },
        { section: "SEO", severity: !e.seoTitle ? "WARNING" : "PASS", message: !e.seoTitle ? "SEO incomplete." : "SEO present." },
      ],
    };
  }

  const proposed: Record<string, unknown> = {};
  const shortDef = String(e.shortDefinition || payload.shortDefinition || "");

  if (input.action === "GENERATE_SEO" || (input.action === "FILL_MISSING" && isEmptyValue(e.seoTitle))) {
    Object.assign(proposed, resourceSeoFields({ ...e, title: term }, term));
  }

  if (
    input.action === "DEFINE_TERM" ||
    input.action === "IMPROVE_DEFINITION" ||
    input.action === "FILL_MISSING"
  ) {
    if (!shortDef || input.action !== "FILL_MISSING") {
      if (shortDef) {
        proposed.shortDefinition = shortDef;
        proposed.description = shortDef;
      } else if (typeof e.description === "string" && e.description.trim()) {
        proposed.shortDefinition = e.description.slice(0, 280);
        proposed.description = proposed.shortDefinition;
      }
    }
    if (isEmptyValue(payload.fullExplanation) && shortDef) {
      proposed.fullExplanation = `${shortDef} In practice, teams use this concept when planning websites, search visibility, or performance work.`;
    }
  }

  if (input.action === "ADD_EXAMPLE" && isEmptyValue(payload.example) && shortDef) {
    proposed.example = `For example, a business website might apply “${term}” when making a concrete implementation or measurement decision.`;
  }

  if (input.action === "IMPROVE_TECHNICAL_EXPLANATION" && typeof payload.fullExplanation === "string") {
    proposed.fullExplanation = payload.fullExplanation;
  }

  if (input.action === "SUGGEST_ALIASES") {
    // Only propose if empty — server validates conflicts on apply
    const aliases = Array.isArray(e.aliases)
      ? e.aliases
      : Array.isArray(payload.aliases)
        ? payload.aliases
        : [];
    if (!aliases.length && term.length <= 6) {
      proposed.aliases = [term.toLowerCase()];
    }
  }

  // Scrub obsolete FID-as-current claims
  for (const [k, v] of Object.entries(proposed)) {
    if (typeof v === "string" && OBSOLETE_FID_RE.test(v)) delete proposed[k];
  }

  const fields = buildResourceFieldChanges({
    entity: {
      ...e,
      shortDefinition: shortDef,
      fullExplanation: payload.fullExplanation,
      example: payload.example,
      whyItMatters: payload.whyItMatters,
    },
    proposed,
    labels: GLOSSARY_FIELD_LABELS,
    allowlist: GLOSSARY_FIELD_ALLOWLIST,
    protectedFields: GLOSSARY_PROTECTED_FIELDS,
    lockedFields: input.lockedFields,
    missingOnly: input.action === "FILL_MISSING",
  });

  return { fields };
}

export const glossaryAssistant = createResourceAssistant({
  entityType: "GLOSSARY",
  displayName: "Glossary",
  promptNamespace: PROMPT_VERSIONS.glossaryWriter,
  actions: GLOSSARY_ACTIONS,
  fieldAllowlist: GLOSSARY_FIELD_ALLOWLIST,
  protectedFields: GLOSSARY_PROTECTED_FIELDS,
  fieldLabels: GLOSSARY_FIELD_LABELS,
  auditAction: "resource.glossary_ai_draft",
  researchQuery: (e) =>
    `${e.title} definition official documentation web standards Core Web Vitals`,
  heuristic: heuristicGlossaryProposal,
  async mergePayload(current, fields) {
    const next = { ...current };
    copyStringFields(next, fields, [
      "shortDefinition",
      "fullExplanation",
      "whyItMatters",
      "example",
      "seoTitle",
      "seoDescription",
      "acronym",
    ]);
    if (typeof fields.shortDefinition === "string") {
      next.term = current.term || next.term;
      next.shortDefinition = fields.shortDefinition;
    }
    if (fields.commonMisconceptions !== undefined) {
      next.commonMisconceptions = fields.commonMisconceptions;
    }
    if (fields.aliases !== undefined) {
      const aliases = Array.isArray(fields.aliases)
        ? (fields.aliases as string[]).filter((a) => typeof a === "string")
        : [];
      for (const alias of aliases) {
        const slugHit = await prisma.cmsResource.findFirst({
          where: { type: "glossary", slug: alias },
          select: { id: true },
        });
        if (slugHit) {
          throw new Error(
            `Alias "${alias}" conflicts with an existing Glossary route and cannot be applied.`,
          );
        }
      }
      next.aliases = aliases;
    }
    if (fields.relatedTermSlugs !== undefined) {
      const slugs = Array.isArray(fields.relatedTermSlugs)
        ? (fields.relatedTermSlugs as string[]).filter((s) => typeof s === "string")
        : [];
      const valid: string[] = [];
      for (const slug of slugs) {
        const row = await prisma.cmsResource.findFirst({
          where: { type: "glossary", slug, status: "PUBLISHED" },
          select: { slug: true },
        });
        if (row) valid.push(row.slug);
      }
      next.relatedTermSlugs = valid;
    }
    return next;
  },
});
