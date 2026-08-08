/**
 * Checklist AI — execution aid with stable-ID protection.
 */

import {
  CHECKLIST_FIELD_ALLOWLIST,
  CHECKLIST_FIELD_LABELS,
  CHECKLIST_PROTECTED_FIELDS,
} from "@/lib/ai/content-assistants/allowlists";
import {
  buildResourceFieldChanges,
  createResourceAssistant,
  resourceSeoFields,
} from "@/lib/ai/content-assistants/resource-factory";
import {
  applyChecklistItemOps,
  collectChecklistItemIds,
  type ChecklistItemUpdate,
  type ChecklistNewItemSuggestion,
} from "@/lib/ai/content-assistants/resource-id-safety";
import { copyStringFields } from "@/lib/ai/content-assistants/resource-shared";
import type { ProposalPayload } from "@/lib/ai/content-assistants/types";
import { PROMPT_VERSIONS } from "@/lib/ai/prompts";
import { isEmptyValue } from "@/lib/ai/content-assistants/helpers";

export const CHECKLIST_ACTIONS = [
  { id: "FILL_MISSING", label: "Fill missing fields", promptVersion: PROMPT_VERSIONS.checklistFillMissing, loadingLabel: "Filling missing Checklist fields…", researchPolicy: "optional" as const },
  { id: "IMPROVE_CHECKLIST", label: "Improve this Checklist", promptVersion: PROMPT_VERSIONS.checklistImprove, loadingLabel: "Improving Checklist…", researchPolicy: "optional" as const },
  { id: "IMPROVE_SECTION", label: "Improve section", promptVersion: PROMPT_VERSIONS.checklistSection, loadingLabel: "Improving checklist section…", researchPolicy: "optional" as const },
  { id: "IMPROVE_ITEM", label: "Improve item", promptVersion: PROMPT_VERSIONS.checklistItem, loadingLabel: "Improving checklist item…", researchPolicy: "optional" as const },
  { id: "SUGGEST_MISSING_ITEMS", label: "Suggest missing items", promptVersion: PROMPT_VERSIONS.checklistMissingItems, loadingLabel: "Suggesting missing checklist items…", researchPolicy: "optional" as const },
  { id: "SUGGEST_REORDER", label: "Suggest reorder", promptVersion: PROMPT_VERSIONS.checklistReorder, loadingLabel: "Suggesting checklist reorder…", researchPolicy: "optional" as const },
  { id: "GENERATE_SEO", label: "Generate SEO", promptVersion: PROMPT_VERSIONS.checklistSeo, loadingLabel: "Generating Checklist SEO…", researchPolicy: "optional" as const },
  { id: "REVIEW_CHECKLIST", label: "Review Checklist", promptVersion: PROMPT_VERSIONS.checklistReview, loadingLabel: "Reviewing Checklist…", researchPolicy: "optional" as const },
] as const;

function firstItem(payload: Record<string, unknown>): { id: string; text: string; sectionId: string } | null {
  const sections = Array.isArray(payload.sections) ? payload.sections : [];
  for (const sec of sections) {
    if (!sec || typeof sec !== "object") continue;
    const s = sec as { id?: string; items?: unknown[] };
    for (const item of s.items || []) {
      if (!item || typeof item !== "object") continue;
      const it = item as { id?: string; text?: string };
      if (it.id && it.text) return { id: it.id, text: it.text, sectionId: String(s.id || "") };
    }
  }
  return null;
}

function heuristicChecklistProposal(input: {
  entity: Record<string, unknown>;
  action: string;
  lockedFields: string[];
}): ProposalPayload {
  const e = input.entity;
  const payload = (e.payload || {}) as Record<string, unknown>;
  const ids = collectChecklistItemIds(payload.sections);

  if (input.action === "REVIEW_CHECKLIST") {
    return {
      fields: [],
      reviewFindings: [
        { section: "STABLE-ID SAFETY", severity: "PASS", message: `${ids.length} stable item IDs present — AI must not regenerate them.` },
        { section: "ACTIONABILITY", severity: "REVIEW", message: "Items should be clear executable steps." },
        { section: "SEQUENCE", severity: "REVIEW", message: "Reorder may preserve IDs; do not recreate items." },
        { section: "SEO", severity: !e.seoTitle ? "WARNING" : "PASS", message: !e.seoTitle ? "SEO incomplete." : "SEO present." },
      ],
    };
  }

  if (input.action === "SUGGEST_REORDER") {
    return {
      fields: [],
      reviewFindings: [
        {
          section: "SEQUENCE",
          severity: "REVIEW",
          message:
            "Reorder suggestions are advisory. Preserve existing item IDs — do not recreate the checklist.",
        },
      ],
    };
  }

  const proposed: Record<string, unknown> = {};

  if (input.action === "GENERATE_SEO" || (input.action === "FILL_MISSING" && isEmptyValue(e.seoTitle))) {
    Object.assign(proposed, resourceSeoFields(e, "Checklist"));
  }

  if (input.action === "FILL_MISSING" || input.action === "IMPROVE_CHECKLIST") {
    if (isEmptyValue(payload.intro) && typeof e.description === "string") {
      proposed.intro = e.description;
    }
  }

  if (input.action === "IMPROVE_ITEM" || input.action === "IMPROVE_CHECKLIST" || input.action.startsWith("IMPROVE_FIELD:")) {
    const item = firstItem(payload);
    if (item) {
      proposed.itemUpdates = [
        {
          id: item.id,
          text: item.text.endsWith(".") ? item.text : `${item.text}.`,
        } satisfies ChecklistItemUpdate,
      ];
    }
  }

  if (input.action === "SUGGEST_MISSING_ITEMS") {
    const item = firstItem(payload);
    proposed.newItemSuggestions = [
      {
        sectionId: item?.sectionId || "",
        text: "Confirm analytics and conversion tracking still fire after launch",
        description: "Suggested addition — server will assign a stable ID on accept.",
        afterItemId: item?.id,
      } satisfies ChecklistNewItemSuggestion,
    ];
  }

  const fields = buildResourceFieldChanges({
    entity: {
      ...e,
      intro: payload.intro,
      itemUpdates: null,
      newItemSuggestions: null,
    },
    proposed,
    labels: CHECKLIST_FIELD_LABELS,
    allowlist: CHECKLIST_FIELD_ALLOWLIST,
    protectedFields: CHECKLIST_PROTECTED_FIELDS,
    lockedFields: input.lockedFields,
    missingOnly: input.action === "FILL_MISSING",
  });

  return { fields };
}

export const checklistAssistant = createResourceAssistant({
  entityType: "CHECKLIST",
  displayName: "Checklist",
  promptNamespace: PROMPT_VERSIONS.checklistWriter,
  actions: CHECKLIST_ACTIONS,
  fieldAllowlist: CHECKLIST_FIELD_ALLOWLIST,
  protectedFields: CHECKLIST_PROTECTED_FIELDS,
  fieldLabels: CHECKLIST_FIELD_LABELS,
  auditAction: "resource.checklist_ai_draft",
  heuristic: heuristicChecklistProposal,
  mergePayload(current, fields) {
    const beforeIds = collectChecklistItemIds(current.sections);
    const next = { ...current };
    copyStringFields(next, fields, [
      "intro",
      "subtitle",
      "title",
      "description",
      "seoTitle",
      "seoDescription",
    ]);

    // Reject wholesale sections replacement that changes IDs
    if (fields.sections !== undefined) {
      const afterAttempt = collectChecklistItemIds(fields.sections);
      const lost = beforeIds.filter((id) => !afterAttempt.includes(id));
      if (lost.length) {
        throw new Error(
          "This checklist proposal attempted to change a stable item ID and was rejected.",
        );
      }
    }

    const { sections, warnings } = applyChecklistItemOps(
      current.sections,
      fields.itemUpdates as ChecklistItemUpdate[] | undefined,
      fields.newItemSuggestions as ChecklistNewItemSuggestion[] | undefined,
    );
    next.sections = sections;
    void warnings;

    const afterIds = collectChecklistItemIds(next.sections);
    for (const id of beforeIds) {
      if (!afterIds.includes(id)) {
        throw new Error(
          "This checklist proposal attempted to change a stable item ID and was rejected.",
        );
      }
    }
    return next;
  },
});
