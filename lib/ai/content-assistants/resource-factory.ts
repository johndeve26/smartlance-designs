/**
 * Factory for CmsResource subtype assistants (Phase D).
 */

import type { ResourceKind } from "@prisma/client";
import type { ContentAssistantModule, ProposalPayload } from "@/lib/ai/content-assistants/types";
import { shouldUseHeuristicFirst } from "@/lib/ai/content-assistants/heuristic-routing";
import { isEmptyValue } from "@/lib/ai/content-assistants/helpers";
import { buildFieldChanges } from "@/lib/ai/content-assistants/shared-generate";
import {
  applyResourceCmsFields,
  buildResourceContext,
  isResourceFieldMissing,
  loadResourceEntity,
} from "@/lib/ai/content-assistants/resource-shared";
import type { ResourceAssistantEntityType } from "@/lib/ai/content-assistants/resource-kinds";
import { entityTypeToResourceKind } from "@/lib/ai/content-assistants/resource-kinds";
import {
  researchMetaFromSources,
  researchPromptBlock,
  runContentAssistantResearch,
} from "@/lib/ai/content-assistants/research";

type ActionDef = {
  id: string;
  label: string;
  promptVersion: string;
  loadingLabel: string;
  researchPolicy?: "optional" | "recommended" | "required";
};

export function createResourceAssistant(config: {
  entityType: ResourceAssistantEntityType;
  displayName: string;
  promptNamespace: string;
  actions: readonly ActionDef[];
  fieldAllowlist: ReadonlySet<string>;
  protectedFields: ReadonlySet<string>;
  fieldLabels: Record<string, string>;
  auditAction: string;
  heuristic: (input: {
    entity: Record<string, unknown>;
    action: string;
    lockedFields: string[];
    researchSources: ProposalPayload["research"] extends infer R
      ? R extends { sources: infer S }
        ? S
        : never
      : never;
  }) => ProposalPayload;
  mergePayload: (
    current: Record<string, unknown>,
    fields: Record<string, unknown>,
  ) => Record<string, unknown> | Promise<Record<string, unknown>>;
  /** Actions that always use heuristic (reviews, suggestions) */
  forceHeuristicActions?: string[];
  researchQuery?: (entity: Record<string, unknown>) => string;
}): ContentAssistantModule {
  const kind: ResourceKind = entityTypeToResourceKind(config.entityType);
  const forceSet = new Set(
    config.forceHeuristicActions || [
      "REVIEW_GUIDE",
      "REVIEW_COMPARISON",
      "REVIEW_CHECKLIST",
      "REVIEW_TERM",
      "REVIEW_TEMPLATE",
      "REVIEW_TOOL_COPY",
      "CHECK_FRESHNESS",
      "SUGGEST_INTERNAL_LINKS",
      "SUGGEST_MISSING_ITEMS",
      "SUGGEST_REORDER",
      "SUGGEST_ALIASES",
      "SUGGEST_RELATED_TERMS",
      "SUGGEST_MISSING_FIELD",
    ],
  );

  return {
    entityType: config.entityType,
    displayName: config.displayName,
    promptNamespace: config.promptNamespace,
    actions: config.actions,
    fieldAllowlist: config.fieldAllowlist,
    protectedFields: config.protectedFields,
    isFieldMissing: (entity, field) =>
      isResourceFieldMissing(entity, field) || isEmptyValue(entity[field]),

    async loadEntity(entityId) {
      const loaded = await loadResourceEntity(entityId, config.entityType);
      if (!loaded) return null;
      return { entity: loaded.entity, updatedAt: loaded.updatedAt };
    },

    async buildContext(entityId) {
      const ctx = await buildResourceContext(entityId, config.entityType);
      return { promptText: ctx.promptText, nearby: ctx.nearby };
    },

    async generateProposal(input) {
      const actionMeta =
        config.actions.find((a) => a.id === input.action) ||
        (input.action.startsWith("IMPROVE_FIELD:")
          ? {
              id: input.action,
              promptVersion: config.promptNamespace,
              label: "Improve field",
              loadingLabel: "Improving field…",
              researchPolicy: "optional" as const,
            }
          : config.actions[0]);

      const required = actionMeta.researchPolicy === "required";
      const recommended = actionMeta.researchPolicy === "recommended";
      let researchSources = input.researchOverride || [];
      let researchPerformed = Boolean(researchSources.length);

      if (
        (required || recommended) &&
        !input.researchOverride?.length &&
        config.researchQuery
      ) {
        const research = await runContentAssistantResearch({
          query: config.researchQuery(input.entity),
          required: required && !input.forceHeuristic,
          override: input.forceHeuristic ? input.researchOverride : undefined,
        });
        if (required && !input.forceHeuristic && !research.performed) {
          throw new Error(
            "Current research is unavailable. No content was changed.",
          );
        }
        researchSources = research.sources;
        researchPerformed = research.performed;
      }

      const heuristic = () =>
        config.heuristic({
          entity: input.entity,
          action: input.action,
          lockedFields: input.lockedFields,
          researchSources: researchSources as never,
        });

      if (
        input.forceHeuristic ||
        forceSet.has(input.action) ||
        shouldUseHeuristicFirst(config.entityType, input.action) ||
        input.action.startsWith("IMPROVE_FIELD:")
      ) {
        const payload = heuristic();
        return {
          payload: {
            ...payload,
            research:
              researchSources.length || required
                ? researchMetaFromSources(researchSources, {
                    required,
                    factualFreshnessReviewed:
                      input.action.includes("FRESHNESS") ||
                      input.action.includes("RESEARCH"),
                  })
                : payload.research,
          },
          promptVersion: actionMeta.promptVersion,
          provider: researchPerformed ? "heuristic+research" : "heuristic",
        };
      }

      // Structured LLM path still falls back to heuristic via shared runner when unconfigured —
      // Phase D ships heuristic-first for reliable ID safety; research metadata attached when used.
      void researchPromptBlock;
      const payload = heuristic();
      return {
        payload: {
          ...payload,
          research: researchSources.length
            ? researchMetaFromSources(researchSources, {
                required,
                factualFreshnessReviewed:
                  input.action.includes("RESEARCH") ||
                  input.action.includes("FRESHNESS"),
              })
            : payload.research,
        },
        promptVersion: actionMeta.promptVersion,
        provider: researchPerformed ? "heuristic+research" : "heuristic",
      };
    },

    async applyFields(input) {
      // Reject scoring / technical smuggling
      for (const banned of [
        "scoreWeight",
        "weights",
        "signals",
        "showWhen",
        "showWhenAny",
        "storageKey",
        "eligibility",
      ]) {
        if (banned in input.fields) {
          throw new Error(
            `This proposal attempted to modify protected technical field "${banned}" and was rejected.`,
          );
        }
      }

      const filtered: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(input.fields)) {
        if (!config.fieldAllowlist.has(k)) continue;
        if (config.protectedFields.has(k)) continue;
        filtered[k] = v;
      }

      await applyResourceCmsFields({
        entityId: input.entityId,
        expectedKind: kind,
        actorId: input.actorId,
        proposalId: input.proposalId,
        runId: input.runId,
        fields: filtered,
        mergePayload: config.mergePayload,
        auditAction: config.auditAction,
      });
    },
  };
}

export function resourceSeoFields(
  entity: Record<string, unknown>,
  titleFallback: string,
): Record<string, unknown> {
  const title = String(entity.title || titleFallback);
  const desc = String(entity.description || entity.deck || title).slice(0, 170);
  return {
    seoTitle: String(entity.seoTitle || `${title} | Smartlance Designs`).slice(0, 70),
    seoDescription: String(entity.seoDescription || desc).slice(0, 170),
    ogTitle: String(entity.ogTitle || entity.seoTitle || title).slice(0, 70),
    ogDescription: String(entity.ogDescription || entity.seoDescription || desc).slice(
      0,
      170,
    ),
  };
}

export function buildResourceFieldChanges(input: {
  entity: Record<string, unknown>;
  proposed: Record<string, unknown>;
  labels: Record<string, string>;
  allowlist: ReadonlySet<string>;
  protectedFields: ReadonlySet<string>;
  lockedFields: string[];
  missingOnly?: boolean;
}) {
  return buildFieldChanges(input);
}
