/**
 * Resource assistant kind mapping — CmsResource.type ↔ AI entity types.
 */

import type { ResourceKind } from "@prisma/client";
import type { ContentAssistantEntityType } from "@/lib/ai/content-assistants/types";

export const RESOURCE_ENTITY_KINDS = [
  "GUIDE",
  "COMPARISON",
  "CHECKLIST",
  "GLOSSARY",
  "TEMPLATE",
  "TOOL",
] as const;

export type ResourceAssistantEntityType =
  (typeof RESOURCE_ENTITY_KINDS)[number];

export function isResourceAssistantEntity(
  entityType: string,
): entityType is ResourceAssistantEntityType {
  return (RESOURCE_ENTITY_KINDS as readonly string[]).includes(entityType);
}

export function entityTypeToResourceKind(
  entityType: ResourceAssistantEntityType,
): ResourceKind {
  switch (entityType) {
    case "GUIDE":
      return "guide";
    case "COMPARISON":
      return "comparison";
    case "CHECKLIST":
      return "checklist";
    case "GLOSSARY":
      return "glossary";
    case "TEMPLATE":
      return "template";
    case "TOOL":
      return "tool";
  }
}

export function resourceKindToEntityType(
  kind: ResourceKind,
): ResourceAssistantEntityType {
  switch (kind) {
    case "guide":
      return "GUIDE";
    case "comparison":
      return "COMPARISON";
    case "checklist":
      return "CHECKLIST";
    case "glossary":
      return "GLOSSARY";
    case "template":
      return "TEMPLATE";
    case "tool":
      return "TOOL";
  }
}

export function resourceAdminSegment(kind: ResourceKind): string {
  switch (kind) {
    case "guide":
      return "guides";
    case "comparison":
      return "comparisons";
    case "checklist":
      return "checklists";
    case "glossary":
      return "glossary";
    case "template":
      return "templates";
    case "tool":
      return "tools";
  }
}

export function resourceEditorPath(
  entityType: ContentAssistantEntityType,
  entityId: string,
): string | null {
  if (!isResourceAssistantEntity(entityType)) return null;
  const kind = entityTypeToResourceKind(entityType);
  return `/admin/resources/${resourceAdminSegment(kind)}/${entityId}`;
}
