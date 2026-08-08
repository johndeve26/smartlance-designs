/**
 * Topic Intelligence → specialized CMS content assistant handoffs.
 * Central router: recommendation → content family → existing entity → assistant.
 * Never creates Insight projects by default. Never GENERATE_TESTIMONIAL.
 * Never auto-starts provider calls — human initiates generation.
 */

import type { TopicContentFormat, TopicRecommendation } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { ContentAssistantEntityType } from "@/lib/ai/content-assistants/types";
import {
  resourceAdminSegment,
  resourceKindToEntityType,
  type ResourceAssistantEntityType,
} from "@/lib/ai/content-assistants/resource-kinds";
import type { ResourceKind } from "@prisma/client";

export type CommercialHandoff = {
  entityType: ContentAssistantEntityType;
  entityId: string;
  href: string;
  label: string;
  opportunityId: string;
  /** Why this route was chosen (transparency for opportunity detail) */
  routingReason?: string;
};

export type HandoffAmbiguity = {
  opportunityId: string;
  message: string;
  candidates: Array<{ id: string; title: string; href: string }>;
};

function asStringArray(json: unknown): string[] {
  if (!Array.isArray(json)) return [];
  return json.filter((x): x is string => typeof x === "string");
}

function existingHits(
  json: unknown,
): Array<{ type?: string; slug?: string; path?: string; id?: string; title?: string }> {
  return Array.isArray(json)
    ? (json as Array<{
        type?: string;
        slug?: string;
        path?: string;
        id?: string;
        title?: string;
      }>)
    : [];
}

/**
 * Map TI recommendation → assistant entity type.
 * Returns null for WRITE_NEW / MONITOR / IGNORE (Insight or no CMS handoff).
 */
export function recommendationToEntityType(
  rec: TopicRecommendation | string,
): ContentAssistantEntityType | null {
  switch (rec) {
    case "UPDATE_SERVICE_PAGE":
      return "SERVICE";
    case "UPDATE_SOLUTION_PAGE":
      return "SOLUTION";
    case "UPDATE_PLATFORM_PAGE":
      return "PLATFORM";
    case "UPDATE_INDUSTRY_PAGE":
      return "INDUSTRY";
    case "UPDATE_WORK_PAGE":
      return "WORK";
    case "UPDATE_HOMEPAGE":
      return "HOMEPAGE";
    default:
      return null;
  }
}

function formatToResourceEntity(
  format: TopicContentFormat,
): ResourceAssistantEntityType | null {
  switch (format) {
    case "GUIDE":
      return "GUIDE";
    case "COMPARISON":
      return "COMPARISON";
    case "CHECKLIST":
      return "CHECKLIST";
    case "GLOSSARY":
      return "GLOSSARY";
    case "TEMPLATE":
    case "TOOL":
      return format;
    default:
      return null;
  }
}

/**
 * Reject handoff when stored targetEntityType mismatches recommendation.
 */
export function assertHandoffTypeMatch(
  recommendation: TopicRecommendation | string,
  targetEntityType: string | null | undefined,
): void {
  if (!targetEntityType) return;
  const expected = recommendationToEntityType(recommendation);
  if (recommendation === "EXPAND_EXISTING_RESOURCE") {
    const allowed = new Set([
      "GUIDE",
      "COMPARISON",
      "CHECKLIST",
      "GLOSSARY",
      "TEMPLATE",
      "TOOL",
      "CmsResource",
    ]);
    if (!allowed.has(targetEntityType)) {
      throw new Error(
        `Topic Intelligence handoff mismatch: ${recommendation} cannot target ${targetEntityType}.`,
      );
    }
    return;
  }
  if (expected && targetEntityType !== expected) {
    throw new Error(
      `Topic Intelligence handoff mismatch: ${recommendation} cannot target ${targetEntityType}.`,
    );
  }
}

/**
 * Resolve a commercial UPDATE_* / EXPAND_EXISTING_RESOURCE / UPDATE_WORK / UPDATE_HOMEPAGE opportunity.
 * Does not create AIEditorialProject. Does not call AI providers.
 */
export async function resolveCommercialAssistantHandoff(
  opportunityId: string,
): Promise<CommercialHandoff | null> {
  const opp = await prisma.editorialOpportunity.findUnique({
    where: { id: opportunityId },
  });
  if (!opp) return null;

  assertHandoffTypeMatch(opp.recommendation, opp.targetEntityType);

  if (opp.recommendation === "EXPAND_EXISTING_RESOURCE") {
    return resolveResourceExpandHandoff(opp.id, opp);
  }

  if (opp.recommendation === "UPDATE_HOMEPAGE") {
    return {
      entityType: "HOMEPAGE",
      entityId: "home",
      href: `/admin/homepage?opportunityId=${opportunityId}`,
      label: "Update Homepage",
      opportunityId,
      routingReason:
        "Homepage positioning/content issue — opens Homepage Copy Assistant (draft only).",
    };
  }

  if (opp.recommendation === "UPDATE_WORK_PAGE") {
    return resolveWorkHandoff(opportunityId, opp);
  }

  const entityType = recommendationToEntityType(opp.recommendation);
  if (!entityType) return null;

  // Prefer explicit target when present
  if (opp.targetEntityId && opp.targetEntityType === entityType) {
    return resolveByTargetId(opportunityId, entityType, opp.targetEntityId);
  }

  if (entityType === "SERVICE") {
    const hrefs = asStringArray(opp.suggestedServicesJson);
    const path = hrefs[0] || opp.commercialRelationship || "";
    const slug = path.replace(/^\/services\//, "").replace(/^\//, "");
    const row = slug
      ? await prisma.service.findFirst({
          where: {
            OR: [
              { slug },
              { href: path.startsWith("/") ? path : `/services/${slug}` },
            ],
          },
          select: { id: true, title: true, href: true },
        })
      : null;
    if (!row) return null;
    return {
      entityType: "SERVICE",
      entityId: row.id,
      href: `/admin/services/${row.id}?opportunityId=${opportunityId}&aiAction=improve`,
      label: `Update Service: ${row.title}`,
      opportunityId,
      routingReason: "Existing Service owns this commercial intent.",
    };
  }

  if (entityType === "SOLUTION") {
    const slugs = asStringArray(opp.suggestedSolutionsJson);
    const fromCommercial = (opp.commercialRelationship || "")
      .replace(/^\/solutions\//, "")
      .replace(/^\//, "");
    const slug = slugs[0] || fromCommercial;
    const row = slug
      ? await prisma.solution.findFirst({
          where: { slug },
          select: { id: true, name: true },
        })
      : null;
    if (!row) return null;
    return {
      entityType: "SOLUTION",
      entityId: row.id,
      href: `/admin/solutions/${row.id}?opportunityId=${opportunityId}&aiAction=improve`,
      label: `Update Solution: ${row.name}`,
      opportunityId,
      routingReason: "Existing Solution owns this problem/intent.",
    };
  }

  if (entityType === "PLATFORM") {
    const slugs = asStringArray(opp.suggestedPlatformsJson);
    const fromCommercial = (opp.commercialRelationship || "")
      .replace(/^\/platforms\//, "")
      .replace(/^\//, "");
    const slug = slugs[0] || fromCommercial;
    const row = slug
      ? await prisma.platform.findFirst({
          where: { OR: [{ slug }, { href: `/platforms/${slug}` }] },
          select: { id: true, name: true },
        })
      : null;
    if (!row) return null;
    return {
      entityType: "PLATFORM",
      entityId: row.id,
      href: `/admin/platforms/${row.id}?opportunityId=${opportunityId}&aiAction=research`,
      label: `Update Platform: ${row.name}`,
      opportunityId,
      routingReason:
        "Platform fact/product change — Platform AI still requires official-source policy.",
    };
  }

  // INDUSTRY
  const existing = existingHits(opp.existingContentJson);
  const industryHit = existing.find((e) => e.type === "Industry");
  const slug =
    industryHit?.slug ||
    (opp.commercialRelationship || "")
      .replace(/^\/industries\//, "")
      .replace(/^\//, "");
  const row = slug
    ? await prisma.industry.findFirst({
        where: { slug },
        select: { id: true, name: true },
      })
    : null;
  if (!row) return null;
  return {
    entityType: "INDUSTRY",
    entityId: row.id,
    href: `/admin/industries/${row.id}?opportunityId=${opportunityId}&aiAction=improve`,
    label: `Update Industry: ${row.name}`,
    opportunityId,
    routingReason: "Existing Industry page owns this market intent.",
  };
}

async function resolveByTargetId(
  opportunityId: string,
  entityType: ContentAssistantEntityType,
  targetEntityId: string,
): Promise<CommercialHandoff | null> {
  if (entityType === "SERVICE") {
    const row = await prisma.service.findUnique({
      where: { id: targetEntityId },
      select: { id: true, title: true },
    });
    if (!row) return null;
    return {
      entityType,
      entityId: row.id,
      href: `/admin/services/${row.id}?opportunityId=${opportunityId}&aiAction=improve`,
      label: `Update Service: ${row.title}`,
      opportunityId,
    };
  }
  if (entityType === "SOLUTION") {
    const row = await prisma.solution.findUnique({
      where: { id: targetEntityId },
      select: { id: true, name: true },
    });
    if (!row) return null;
    return {
      entityType,
      entityId: row.id,
      href: `/admin/solutions/${row.id}?opportunityId=${opportunityId}&aiAction=improve`,
      label: `Update Solution: ${row.name}`,
      opportunityId,
    };
  }
  if (entityType === "PLATFORM") {
    const row = await prisma.platform.findUnique({
      where: { id: targetEntityId },
      select: { id: true, name: true },
    });
    if (!row) return null;
    return {
      entityType,
      entityId: row.id,
      href: `/admin/platforms/${row.id}?opportunityId=${opportunityId}&aiAction=research`,
      label: `Update Platform: ${row.name}`,
      opportunityId,
    };
  }
  if (entityType === "INDUSTRY") {
    const row = await prisma.industry.findUnique({
      where: { id: targetEntityId },
      select: { id: true, name: true },
    });
    if (!row) return null;
    return {
      entityType,
      entityId: row.id,
      href: `/admin/industries/${row.id}?opportunityId=${opportunityId}&aiAction=improve`,
      label: `Update Industry: ${row.name}`,
      opportunityId,
    };
  }
  if (entityType === "WORK") {
    const row = await prisma.workProject.findUnique({
      where: { id: targetEntityId },
      select: { id: true, name: true },
    });
    if (!row) return null;
    return {
      entityType,
      entityId: row.id,
      href: `/admin/work/${row.id}?opportunityId=${opportunityId}`,
      label: `Update Case Study: ${row.name}`,
      opportunityId,
      routingReason:
        "Existing Case Study clarity/presentation — external news is not project proof.",
    };
  }
  if (entityType === "HOMEPAGE") {
    return {
      entityType: "HOMEPAGE",
      entityId: "home",
      href: `/admin/homepage?opportunityId=${opportunityId}`,
      label: "Update Homepage",
      opportunityId,
    };
  }
  return null;
}

async function resolveWorkHandoff(
  opportunityId: string,
  opp: {
    targetEntityId: string | null;
    targetEntityType: string | null;
    existingContentJson: unknown;
    commercialRelationship: string | null;
  },
): Promise<CommercialHandoff | null> {
  if (opp.targetEntityId && opp.targetEntityType === "WORK") {
    return resolveByTargetId(opportunityId, "WORK", opp.targetEntityId);
  }

  const existing = existingHits(opp.existingContentJson);
  const workHit = existing.find(
    (e) =>
      e.type === "Work" ||
      e.type === "WorkProject" ||
      e.type === "CaseStudy" ||
      e.path?.includes("/work/"),
  );
  const slug =
    workHit?.slug ||
    workHit?.path?.split("/").filter(Boolean).pop() ||
    (opp.commercialRelationship || "")
      .replace(/^\/work\//, "")
      .replace(/^\//, "");

  const row = workHit?.id
    ? await prisma.workProject.findFirst({
        where: { id: workHit.id },
        select: { id: true, name: true },
      })
    : slug
      ? await prisma.workProject.findFirst({
          where: { slug },
          select: { id: true, name: true },
        })
      : null;

  if (!row) {
    // Ambiguous / no existing Work — never invent a Case Study from news
    return null;
  }

  return {
    entityType: "WORK",
    entityId: row.id,
    href: `/admin/work/${row.id}?opportunityId=${opportunityId}`,
    label: `Update Case Study: ${row.name}`,
    opportunityId,
    routingReason:
      "Existing Case Study identified. Case Study AI still requires verified project facts — news is not proof.",
  };
}

async function resolveResourceExpandHandoff(
  opportunityId: string,
  opp: {
    suggestedFormat: TopicContentFormat;
    existingContentJson: unknown;
    targetEntityId?: string | null;
    targetEntityType?: string | null;
    topicTitle?: string | null;
  },
): Promise<CommercialHandoff | null> {
  const entityType = formatToResourceEntity(opp.suggestedFormat);
  if (!entityType) return null;

  const kindMap: Record<ResourceAssistantEntityType, ResourceKind> = {
    GUIDE: "guide",
    COMPARISON: "comparison",
    CHECKLIST: "checklist",
    GLOSSARY: "glossary",
    TEMPLATE: "template",
    TOOL: "tool",
  };
  const kind = kindMap[entityType];

  if (opp.targetEntityId) {
    const row = await prisma.cmsResource.findFirst({
      where: { id: opp.targetEntityId, type: kind },
      select: { id: true, title: true, type: true },
    });
    if (row) {
      return resourceHandoff(opportunityId, entityType, row);
    }
  }

  const existing = existingHits(opp.existingContentJson);

  const hit =
    existing.find(
      (e) =>
        e.type?.toLowerCase() === kind ||
        e.type?.toUpperCase() === entityType ||
        e.path?.includes(`/${resourceAdminSegment(kind)}/`) ||
        e.path?.includes(`/${kind}/`),
    ) || existing[0];

  const slug = hit?.slug || hit?.path?.split("/").filter(Boolean).pop();
  const row = hit?.id
    ? await prisma.cmsResource.findFirst({
        where: { id: hit.id, type: kind },
        select: { id: true, title: true, type: true },
      })
    : slug
      ? await prisma.cmsResource.findFirst({
          where: { type: kind, slug },
          select: { id: true, title: true, type: true },
        })
      : null;

  if (!row) {
    return null;
  }

  return resourceHandoff(opportunityId, entityType, row);
}

function resourceHandoff(
  opportunityId: string,
  entityType: ResourceAssistantEntityType,
  row: { id: string; title: string; type: ResourceKind },
): CommercialHandoff {
  const segment = resourceAdminSegment(row.type);
  const labelPrefix =
    entityType === "COMPARISON"
      ? "Update Comparison"
      : entityType === "CHECKLIST"
        ? "Expand Checklist"
        : entityType === "GLOSSARY"
          ? "Update Glossary"
          : entityType === "GUIDE"
            ? "Expand Guide"
            : entityType === "TEMPLATE"
              ? "Update Template"
              : "Update Tool";

  return {
    entityType: resourceKindToEntityType(row.type),
    entityId: row.id,
    href: `/admin/resources/${segment}/${row.id}?opportunityId=${opportunityId}`,
    label: `${labelPrefix}: ${row.title}`,
    opportunityId,
    routingReason: `Existing ${entityType} owns this resource intent — not a new Insight.`,
  };
}

export function isCommercialPageRecommendation(
  rec: TopicRecommendation | string,
): boolean {
  return (
    rec === "UPDATE_SERVICE_PAGE" ||
    rec === "UPDATE_SOLUTION_PAGE" ||
    rec === "UPDATE_PLATFORM_PAGE" ||
    rec === "UPDATE_INDUSTRY_PAGE" ||
    rec === "UPDATE_WORK_PAGE" ||
    rec === "UPDATE_HOMEPAGE"
  );
}

export function isResourceExpandRecommendation(
  rec: TopicRecommendation | string,
): boolean {
  return rec === "EXPAND_EXISTING_RESOURCE";
}

/** Recommendations that must never produce Insight projects by default. */
export function forcesInsightOverride(
  rec: TopicRecommendation | string,
): boolean {
  return (
    isCommercialPageRecommendation(rec) ||
    isResourceExpandRecommendation(rec) ||
    rec === "MONITOR" ||
    rec === "IGNORE"
  );
}

export function commercialActionLabel(rec: TopicRecommendation | string): string {
  switch (rec) {
    case "UPDATE_SERVICE_PAGE":
      return "Update Service";
    case "UPDATE_SOLUTION_PAGE":
      return "Update Solution";
    case "UPDATE_PLATFORM_PAGE":
      return "Update Platform";
    case "UPDATE_INDUSTRY_PAGE":
      return "Update Industry";
    case "UPDATE_WORK_PAGE":
      return "Update Case Study";
    case "UPDATE_HOMEPAGE":
      return "Update Homepage";
    case "EXPAND_EXISTING_RESOURCE":
      return "Update Resource";
    case "WRITE_NEW":
      return "Create Insight Project";
    default:
      return "Open CMS assistant";
  }
}

/** Hard rule: no TI path may recommend generating testimonials. */
export function isForbiddenTestimonialGeneration(
  rec: TopicRecommendation | string,
): boolean {
  const s = String(rec).toUpperCase();
  return (
    s.includes("GENERATE_TESTIMONIAL") ||
    s.includes("CREATE_TESTIMONIAL") ||
    s.includes("WRITE_TESTIMONIAL")
  );
}
