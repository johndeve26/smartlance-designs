/**
 * Shared CmsResource load/context/apply for Phase D assistants.
 * Never applies wholesale arbitrary payload JSON — merges allowlisted ops only.
 */

import { createHash, randomBytes } from "crypto";
import type { CmsResource, ResourceKind } from "@prisma/client";
import {
  formatContextBlocks,
  loadBrandVoiceBlock,
  type LabeledContextBlock,
} from "@/lib/ai/content-assistants/context";
import { entityToPlain, isEmptyValue } from "@/lib/ai/content-assistants/helpers";
import type { ResourceAssistantEntityType } from "@/lib/ai/content-assistants/resource-kinds";
import {
  entityTypeToResourceKind,
  resourceKindToEntityType,
} from "@/lib/ai/content-assistants/resource-kinds";
import { prisma } from "@/lib/db";
import { saveResourceDraft } from "@/lib/repositories/resourcesRepository";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import {
  columnsFromResourceRow,
  composeResourceSaveData,
  type ResourceColumnInput,
} from "@/lib/resources/canonical";

export function newStableId(prefix: string): string {
  return `${prefix}-${randomBytes(6).toString("hex")}`;
}

export function resourceEntitySnapshot(row: CmsResource): Record<string, unknown> {
  const payload =
    row.payload && typeof row.payload === "object"
      ? (row.payload as Record<string, unknown>)
      : {};
  return entityToPlain({
    ...(row as unknown as Record<string, unknown>),
    // Flatten common payload prose for proposal diffs
    intro: payload.intro ?? null,
    summary: payload.summary ?? null,
    subtitle: payload.subtitle ?? null,
    decisionGuidance: payload.decisionGuidance ?? null,
    fullExplanation: payload.fullExplanation ?? null,
    whyItMatters: payload.whyItMatters ?? null,
    example: payload.example ?? null,
    faqs: payload.faqs ?? null,
    sections: payload.sections ?? null,
    payload,
  });
}

export async function loadResourceEntity(
  entityId: string,
  expected: ResourceAssistantEntityType,
) {
  const row = await prisma.cmsResource.findUnique({ where: { id: entityId } });
  if (!row) return null;
  if (resourceKindToEntityType(row.type) !== expected) {
    throw new Error(
      `Wrong assistant for resource subtype: expected ${expected}, got ${row.type}`,
    );
  }
  return {
    entity: resourceEntitySnapshot(row),
    updatedAt: row.updatedAt,
    row,
  };
}

export async function buildResourceContext(
  entityId: string,
  expected: ResourceAssistantEntityType,
) {
  const loaded = await loadResourceEntity(entityId, expected);
  if (!loaded) throw new Error("Resource not found");
  const { row } = loaded;

  const blocks: LabeledContextBlock[] = [
    {
      label: "CURRENT_ENTITY",
      title: row.title,
      data: {
        id: row.id,
        type: row.type,
        slug: row.slug,
        title: row.title,
        description: row.description,
        deck: row.deck,
        seoTitle: row.seoTitle,
        seoDescription: row.seoDescription,
        shortDefinition: row.shortDefinition,
        aliases: row.aliases,
        payloadSummary: summarizePayload(row.payload),
      },
    },
    await loadBrandVoiceBlock(),
  ];

  const nearby = await prisma.cmsResource.findMany({
    where: { type: row.type, id: { not: row.id }, status: "PUBLISHED" },
    select: { id: true, slug: true, title: true, type: true },
    take: 20,
    orderBy: { title: "asc" },
  });
  for (const n of nearby) {
    blocks.push({
      label: "NEARBY_ENTITY",
      title: n.title,
      data: { ...n, note: "Avoid duplicating the same intent." },
    });
  }

  return {
    row,
    promptText: formatContextBlocks(blocks),
    nearby,
  };
}

function summarizePayload(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object") return {};
  const p = payload as Record<string, unknown>;
  const sections = Array.isArray(p.sections) ? p.sections : [];
  return {
    intro: typeof p.intro === "string" ? p.intro.slice(0, 400) : undefined,
    summary: typeof p.summary === "string" ? p.summary.slice(0, 400) : undefined,
    sectionCount: sections.length,
    sectionIds: sections
      .slice(0, 40)
      .map((s) =>
        s && typeof s === "object" ? (s as { id?: string; title?: string }) : null,
      )
      .filter(Boolean),
    faqCount: Array.isArray(p.faqs) ? p.faqs.length : 0,
    optionA: p.optionA,
    optionB: p.optionB,
  };
}

/** Strip protected CMS columns before apply */
export function stripResourceSystemFields(fields: Record<string, unknown>) {
  const out = { ...fields };
  for (const k of [
    "id",
    "type",
    "status",
    "publishedAt",
    "createdAt",
    "updatedAt",
    "createdById",
    "updatedById",
    "slug",
    "href",
    "featured",
    "featuredOnResources",
    "featuredOrder",
    "noIndex",
    "canonicalOverride",
    "payload", // never wholesale
  ]) {
    delete out[k];
  }
  return out;
}

export async function applyResourceCmsFields(input: {
  entityId: string;
  expectedKind: ResourceKind;
  actorId: string;
  proposalId: string;
  runId?: string | null;
  fields: Record<string, unknown>;
  mergePayload: (
    current: Record<string, unknown>,
    fields: Record<string, unknown>,
  ) => Record<string, unknown> | Promise<Record<string, unknown>>;
  auditAction: string;
}) {
  const row = await prisma.cmsResource.findUniqueOrThrow({
    where: { id: input.entityId },
  });
  if (row.type !== input.expectedKind) {
    throw new Error(
      `Cannot apply ${input.expectedKind} proposal to ${row.type} resource.`,
    );
  }

  const safe = stripResourceSystemFields(input.fields);
  const currentPayload =
    row.payload && typeof row.payload === "object"
      ? (structuredClone(row.payload) as Record<string, unknown>)
      : {};
  const nextPayload = await Promise.resolve(
    input.mergePayload(currentPayload, safe),
  );

  const mergedColumns: ResourceColumnInput = {
    ...columnsFromResourceRow(row),
  };
  for (const key of [
    "title",
    "description",
    "deck",
    "seoTitle",
    "seoDescription",
    "shortDefinition",
    "acronym",
    "readingTime",
    "author",
  ] as const) {
    if (typeof safe[key] === "string") {
      mergedColumns[key] = safe[key] as string;
    }
  }
  for (const key of [
    "relatedServiceHrefs",
    "relatedSolutionSlugs",
    "relatedPlatformSlugs",
    "relatedInsightSlugs",
    "relatedResourceIds",
    "aliases",
  ] as const) {
    if (safe[key] !== undefined) {
      mergedColumns[key] = safe[key];
    }
  }

  if (input.expectedKind === "glossary" && typeof safe.shortDefinition === "string") {
    mergedColumns.shortDefinition = safe.shortDefinition;
    if (!safe.description) mergedColumns.description = safe.shortDefinition;
  }

  const data = composeResourceSaveData({
    type: row.type,
    columns: mergedColumns,
    structuralPayload: nextPayload,
    existing: row,
  });

  await saveResourceDraft({
    id: input.entityId,
    data,
    actorId: input.actorId,
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: input.auditAction,
    entityType: "CmsResource",
    entityId: input.entityId,
    metadata: {
      aiAssisted: true,
      proposalId: input.proposalId,
      runId: input.runId,
      resourceKind: input.expectedKind,
      fields: Object.keys(safe),
      payloadFingerprint: createHash("sha256")
        .update(JSON.stringify(nextPayload))
        .digest("hex")
        .slice(0, 16),
    },
  });
}

export function copyStringFields(
  target: Record<string, unknown>,
  fields: Record<string, unknown>,
  keys: string[],
) {
  for (const key of keys) {
    if (typeof fields[key] === "string") target[key] = fields[key];
  }
}

export function isResourceFieldMissing(
  entity: Record<string, unknown>,
  field: string,
): boolean {
  return isEmptyValue(entity[field]);
}

export { entityTypeToResourceKind };
