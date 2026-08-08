/**
 * Template Assistant — copy only; never field IDs, option values, or conditions.
 */

import {
  TEMPLATE_FIELD_ALLOWLIST,
  TEMPLATE_FIELD_LABELS,
  TEMPLATE_PROTECTED_FIELDS,
} from "@/lib/ai/content-assistants/allowlists";
import {
  buildResourceFieldChanges,
  createResourceAssistant,
  resourceSeoFields,
} from "@/lib/ai/content-assistants/resource-factory";
import {
  applyTemplateCopyOps,
  collectTemplateFieldIds,
  type TemplateFieldCopyUpdate,
  type TemplateSectionCopyUpdate,
} from "@/lib/ai/content-assistants/resource-id-safety";
import { copyStringFields } from "@/lib/ai/content-assistants/resource-shared";
import type { ProposalPayload } from "@/lib/ai/content-assistants/types";
import { PROMPT_VERSIONS } from "@/lib/ai/prompts";
import { isEmptyValue } from "@/lib/ai/content-assistants/helpers";

export const TEMPLATE_ACTIONS = [
  { id: "IMPROVE_TEMPLATE_COPY", label: "Improve template copy", promptVersion: PROMPT_VERSIONS.templateCopy, loadingLabel: "Improving template copy…" },
  { id: "IMPROVE_SECTION", label: "Improve section", promptVersion: PROMPT_VERSIONS.templateSection, loadingLabel: "Improving template section…" },
  { id: "IMPROVE_FIELD_LABEL", label: "Improve field labels", promptVersion: PROMPT_VERSIONS.templateFieldLabel, loadingLabel: "Improving field labels…" },
  { id: "IMPROVE_HELP_TEXT", label: "Improve help text", promptVersion: PROMPT_VERSIONS.templateHelp, loadingLabel: "Improving template help text…" },
  { id: "IMPROVE_PLACEHOLDERS", label: "Improve placeholders", promptVersion: PROMPT_VERSIONS.templatePlaceholder, loadingLabel: "Improving placeholders…" },
  { id: "REVIEW_TEMPLATE", label: "Review Template", promptVersion: PROMPT_VERSIONS.templateReview, loadingLabel: "Reviewing Template…" },
] as const;

function firstField(payload: Record<string, unknown>): {
  sectionId: string;
  id: string;
  label: string;
  help?: string;
  placeholder?: string;
} | null {
  const sections = Array.isArray(payload.sections) ? payload.sections : [];
  for (const sec of sections) {
    if (!sec || typeof sec !== "object") continue;
    const s = sec as { id?: string; fields?: unknown[] };
    for (const field of s.fields || []) {
      if (!field || typeof field !== "object") continue;
      const f = field as {
        id?: string;
        label?: string;
        help?: string;
        placeholder?: string;
      };
      if (f.id && f.label) {
        return {
          sectionId: String(s.id || ""),
          id: f.id,
          label: f.label,
          help: f.help,
          placeholder: f.placeholder,
        };
      }
    }
  }
  return null;
}

function heuristicTemplateProposal(input: {
  entity: Record<string, unknown>;
  action: string;
  lockedFields: string[];
}): ProposalPayload {
  const e = input.entity;
  const payload = (e.payload || {}) as Record<string, unknown>;
  const fieldIds = collectTemplateFieldIds(payload.sections);

  if (input.action === "REVIEW_TEMPLATE") {
    return {
      fields: [],
      reviewFindings: [
        { section: "TECHNICAL-ID SAFETY", severity: "PASS", message: `${fieldIds.length} field IDs protected — AI cannot change them, option values, or showWhenAny.` },
        { section: "PLACEHOLDERS", severity: "REVIEW", message: "Prefer specific example-driven placeholders over “Enter text here.”" },
        { section: "HELP TEXT", severity: "REVIEW", message: "Help should be concise and reassuring." },
        { section: "CONDITIONAL COPY", severity: "PASS", message: "Conditional logic is protected; only visible copy may change." },
      ],
    };
  }

  const proposed: Record<string, unknown> = {};
  const field = firstField(payload);

  if (input.action === "IMPROVE_TEMPLATE_COPY" && isEmptyValue(payload.intro) && typeof e.description === "string") {
    proposed.intro = e.description;
  }

  if (
    (input.action === "IMPROVE_FIELD_LABEL" ||
      input.action === "IMPROVE_TEMPLATE_COPY") &&
    field
  ) {
    proposed.fieldCopyUpdates = [
      {
        id: field.id,
        label: field.label.trim(),
      } satisfies TemplateFieldCopyUpdate,
    ];
  }

  if (input.action === "IMPROVE_HELP_TEXT" && field) {
    proposed.fieldCopyUpdates = [
      {
        id: field.id,
        help:
          field.help && field.help.trim()
            ? field.help
            : "Share enough detail for planning — you can refine this later.",
      } satisfies TemplateFieldCopyUpdate,
    ];
  }

  if (input.action === "IMPROVE_PLACEHOLDERS" && field) {
    proposed.fieldCopyUpdates = [
      {
        id: field.id,
        placeholder:
          field.placeholder && !/^enter text/i.test(field.placeholder)
            ? field.placeholder
            : "e.g. Launch a new marketing site in Q4",
      } satisfies TemplateFieldCopyUpdate,
    ];
  }

  if (input.action === "IMPROVE_SECTION") {
    const sections = Array.isArray(payload.sections) ? payload.sections : [];
    const first = sections[0] as { id?: string; title?: string; description?: string } | undefined;
    if (first?.id) {
      proposed.sectionCopyUpdates = [
        {
          id: first.id,
          title: first.title,
          description: first.description,
        } satisfies TemplateSectionCopyUpdate,
      ];
    }
  }

  // Never propose SEO auto for templates unless empty — optional soft SEO
  if (isEmptyValue(e.seoTitle)) {
    Object.assign(proposed, resourceSeoFields(e, "Template"));
  }

  const fields = buildResourceFieldChanges({
    entity: {
      ...e,
      intro: payload.intro,
      fieldCopyUpdates: null,
      sectionCopyUpdates: null,
    },
    proposed,
    labels: TEMPLATE_FIELD_LABELS,
    allowlist: TEMPLATE_FIELD_ALLOWLIST,
    protectedFields: TEMPLATE_PROTECTED_FIELDS,
    lockedFields: input.lockedFields,
  });

  return { fields };
}

export const templateAssistant = createResourceAssistant({
  entityType: "TEMPLATE",
  displayName: "Template",
  promptNamespace: PROMPT_VERSIONS.templateAssistant,
  actions: TEMPLATE_ACTIONS,
  fieldAllowlist: TEMPLATE_FIELD_ALLOWLIST,
  protectedFields: TEMPLATE_PROTECTED_FIELDS,
  fieldLabels: TEMPLATE_FIELD_LABELS,
  auditAction: "resource.template_ai_draft",
  heuristic: heuristicTemplateProposal,
  mergePayload(current, fields) {
    const before = collectTemplateFieldIds(current.sections);
    const next = { ...current };
    copyStringFields(next, fields, [
      "intro",
      "subtitle",
      "title",
      "description",
      "seoTitle",
      "seoDescription",
    ]);

    const { sections } = applyTemplateCopyOps(
      current.sections,
      fields.sectionCopyUpdates as TemplateSectionCopyUpdate[] | undefined,
      fields.fieldCopyUpdates as TemplateFieldCopyUpdate[] | undefined,
    );
    next.sections = sections;

    const after = collectTemplateFieldIds(next.sections);
    if (before.length !== after.length || before.some((id, i) => id !== after[i])) {
      // Order of collection should match; if IDs missing, reject
      for (const id of before) {
        if (!after.includes(id)) {
          throw new Error(
            "This template change would alter a technical field value and cannot be applied.",
          );
        }
      }
    }
    return next;
  },
});
