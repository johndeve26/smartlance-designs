/**
 * Guide AI — evergreen educational resource assistant.
 */

import {
  GUIDE_FIELD_ALLOWLIST,
  GUIDE_FIELD_LABELS,
  GUIDE_PROTECTED_FIELDS,
} from "@/lib/ai/content-assistants/allowlists";
import {
  buildResourceFieldChanges,
  createResourceAssistant,
  resourceSeoFields,
} from "@/lib/ai/content-assistants/resource-factory";
import { mergeSectionsById } from "@/lib/ai/content-assistants/resource-id-safety";
import { copyStringFields } from "@/lib/ai/content-assistants/resource-shared";
import type { ProposalPayload } from "@/lib/ai/content-assistants/types";
import { PROMPT_VERSIONS } from "@/lib/ai/prompts";
import { isEmptyValue } from "@/lib/ai/content-assistants/helpers";

export const GUIDE_ACTIONS = [
  { id: "FILL_MISSING", label: "Fill missing fields", promptVersion: PROMPT_VERSIONS.guideFillMissing, loadingLabel: "Filling missing Guide fields…", researchPolicy: "optional" as const },
  { id: "IMPROVE_GUIDE", label: "Improve this Guide", promptVersion: PROMPT_VERSIONS.guideImprove, loadingLabel: "Improving Guide…", researchPolicy: "optional" as const },
  { id: "RESEARCH_AND_UPDATE", label: "Research & update", promptVersion: PROMPT_VERSIONS.guideResearchUpdate, loadingLabel: "Researching Guide updates…", researchPolicy: "required" as const },
  { id: "IMPROVE_SECTION", label: "Improve section", promptVersion: PROMPT_VERSIONS.guideSection, loadingLabel: "Improving Guide section…", researchPolicy: "optional" as const },
  { id: "EXPAND_SECTION", label: "Expand section", promptVersion: PROMPT_VERSIONS.guideExpand, loadingLabel: "Expanding Guide section…", researchPolicy: "optional" as const },
  { id: "GENERATE_OUTLINE", label: "Improve outline", promptVersion: PROMPT_VERSIONS.guideOutline, loadingLabel: "Improving Guide outline…", researchPolicy: "optional" as const },
  { id: "GENERATE_FAQS", label: "Create FAQs", promptVersion: PROMPT_VERSIONS.guideFaq, loadingLabel: "Creating Guide FAQs…", researchPolicy: "optional" as const },
  { id: "GENERATE_SEO", label: "Generate SEO", promptVersion: PROMPT_VERSIONS.guideSeo, loadingLabel: "Generating Guide SEO…", researchPolicy: "optional" as const },
  { id: "SUGGEST_INTERNAL_LINKS", label: "Suggest internal links", promptVersion: PROMPT_VERSIONS.guideLinks, loadingLabel: "Suggesting Guide links…", researchPolicy: "optional" as const },
  { id: "CHECK_FRESHNESS", label: "Check freshness", promptVersion: PROMPT_VERSIONS.guideFreshness, loadingLabel: "Checking Guide freshness…", researchPolicy: "recommended" as const },
  { id: "REVIEW_GUIDE", label: "Review Guide", promptVersion: PROMPT_VERSIONS.guideReview, loadingLabel: "Reviewing Guide…", researchPolicy: "optional" as const },
] as const;

function heuristicGuideProposal(input: {
  entity: Record<string, unknown>;
  action: string;
  lockedFields: string[];
}): ProposalPayload {
  const e = input.entity;
  const payload = (e.payload || {}) as Record<string, unknown>;
  const sections = Array.isArray(payload.sections) ? payload.sections : Array.isArray(e.sections) ? e.sections : [];

  if (input.action === "REVIEW_GUIDE" || input.action === "CHECK_FRESHNESS") {
    return {
      fields: [],
      reviewFindings: [
        { section: "PURPOSE", severity: "PASS", message: "Guide should remain deep evergreen education — not a short Insight." },
        { section: "STRUCTURE", severity: sections.length ? "PASS" : "WARNING", message: sections.length ? `${sections.length} sections present; preserve stable section IDs.` : "No sections found." },
        { section: "RESEARCH", severity: input.action === "CHECK_FRESHNESS" ? "REVIEW" : "PASS", message: "Volatile technical claims need current sources; conceptual sections may use internal context." },
        { section: "INTERNAL LINKS", severity: "REVIEW", message: "Suggest contextual links only — avoid link spam." },
        { section: "SEO", severity: !e.seoTitle || !e.seoDescription ? "WARNING" : "PASS", message: !e.seoTitle ? "SEO incomplete." : "SEO present." },
        { section: "DUPLICATION", severity: "REVIEW", message: "Confirm this Guide does not cannibalize an existing Insight or Guide intent." },
      ],
    };
  }

  const proposed: Record<string, unknown> = {};

  if (input.action === "GENERATE_SEO" || (input.action === "FILL_MISSING" && (isEmptyValue(e.seoTitle) || isEmptyValue(e.seoDescription)))) {
    Object.assign(proposed, resourceSeoFields(e, "Guide"));
  }

  if (input.action === "FILL_MISSING" || input.action === "IMPROVE_GUIDE") {
    if (isEmptyValue(e.deck) && typeof e.description === "string") {
      proposed.deck = e.description.slice(0, 220);
    }
    if (isEmptyValue(e.intro) && typeof e.description === "string") {
      proposed.intro = e.description;
    }
  }

  if (input.action === "GENERATE_FAQS") {
    const existing = Array.isArray(payload.faqs) ? payload.faqs : [];
    if (!existing.length && typeof e.title === "string") {
      proposed.faqs = [
        {
          question: `What does this guide cover?`,
          answer: String(e.description || e.deck || "This guide covers the topic in practical, structured depth."),
        },
      ];
    }
  }

  if (
    input.action === "IMPROVE_SECTION" ||
    input.action === "EXPAND_SECTION" ||
    input.action === "IMPROVE_GUIDE" ||
    input.action.startsWith("IMPROVE_FIELD:")
  ) {
    // Propose light polish on first section body only — preserve IDs
    const first = sections[0] as { id?: string; title?: string; body?: string } | undefined;
    if (first?.id && first.body) {
      proposed.sections = [
        {
          id: first.id,
          title: first.title,
          body:
            input.action === "EXPAND_SECTION"
              ? `${first.body}\n\nConsider practical next steps and how this connects to related Services or Checklists.`
              : first.body,
        },
      ];
    }
  }

  if (input.action === "SUGGEST_INTERNAL_LINKS") {
    return {
      fields: [],
      suggestedRelations: [
        { kind: "service", href: "/services/website-development", title: "Website Development", reason: "Common Guide companion when redesign/build guidance is covered." },
        { kind: "resource", slug: "website-redesign-checklist", title: "Website Redesign Checklist", reason: "Execution companion for redesign Guides." },
      ],
    };
  }

  const fields = buildResourceFieldChanges({
    entity: { ...e, intro: e.intro ?? payload.intro, faqs: payload.faqs, sections },
    proposed,
    labels: GUIDE_FIELD_LABELS,
    allowlist: GUIDE_FIELD_ALLOWLIST,
    protectedFields: GUIDE_PROTECTED_FIELDS,
    lockedFields: input.lockedFields,
    missingOnly: input.action === "FILL_MISSING",
  });

  return { fields };
}

export const guideAssistant = createResourceAssistant({
  entityType: "GUIDE",
  displayName: "Guide",
  promptNamespace: PROMPT_VERSIONS.guideWriter,
  actions: GUIDE_ACTIONS,
  fieldAllowlist: GUIDE_FIELD_ALLOWLIST,
  protectedFields: GUIDE_PROTECTED_FIELDS,
  fieldLabels: GUIDE_FIELD_LABELS,
  auditAction: "resource.guide_ai_draft",
  researchQuery: (e) => `${e.title} website guide best practices official documentation`,
  heuristic: heuristicGuideProposal,
  mergePayload(current, fields) {
    const next = { ...current };
    copyStringFields(next, fields, ["intro", "title", "description", "deck", "seoTitle", "seoDescription"]);
    if (fields.faqs !== undefined) next.faqs = fields.faqs;
    if (fields.sections !== undefined) {
      next.sections = mergeSectionsById(current.sections, fields.sections, { allowNew: false });
      // Sync TOC titles for known ids
      if (Array.isArray(next.tableOfContents) && Array.isArray(next.sections)) {
        const titles = new Map(
          (next.sections as Array<{ id: string; title: string }>).map((s) => [s.id, s.title]),
        );
        next.tableOfContents = (next.tableOfContents as Array<{ id: string; title: string }>).map(
          (t) => ({ id: t.id, title: titles.get(t.id) || t.title }),
        );
      }
    }
    // Mirror column SEO into payload when present
    copyStringFields(next, fields, ["seoTitle", "seoDescription"]);
    return next;
  },
});
