/**
 * Platform AI context builder — selective retrieval, no Enquiry/PII.
 */

import { prisma } from "@/lib/db";
import {
  formatContextBlocks,
  loadBrandVoiceBlock,
  loadSitePositioningBlock,
  type LabeledContextBlock,
} from "@/lib/ai/content-assistants/context";
import { entityToPlain } from "@/lib/ai/content-assistants/helpers";

export async function buildPlatformContext(
  entityId: string,
  opts?: { opportunityId?: string },
) {
  const platform = await prisma.platform.findUnique({ where: { id: entityId } });
  if (!platform) throw new Error("Platform not found");

  const blocks: LabeledContextBlock[] = [
    {
      label: "CURRENT_ENTITY",
      title: platform.name,
      data: {
        ...entityToPlain(platform as unknown as Record<string, unknown>),
        verifiedExperienceNote:
          "verifiedExperience is HUMAN-ONLY. Never set or infer it.",
      },
    },
  ];

  blocks.push(await loadBrandVoiceBlock());
  const site = await loadSitePositioningBlock();
  if (site) blocks.push(site);

  const serviceHrefs = asStringArray(platform.relatedServiceHrefs);
  if (serviceHrefs.length) {
    const services = await prisma.service.findMany({
      where: { href: { in: serviceHrefs }, status: "PUBLISHED" },
      select: { id: true, slug: true, href: true, title: true, summary: true },
      take: 12,
    });
    for (const s of services) {
      blocks.push({
        label: "RELATED_SMARTLANCE_SERVICE",
        title: s.title,
        data: s,
      });
    }
  }

  const work = await prisma.workProject.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { platformId: platform.id },
        { platformLabel: { contains: platform.name, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      slug: true,
      name: true,
      title: true,
      shortDescription: true,
      platformLabel: true,
    },
    take: 6,
  });
  for (const w of work) {
    blocks.push({
      label: "PUBLISHED_WORK",
      title: w.title || w.name,
      data: {
        ...w,
        note: "Published work only — do not invent metrics or unverified client claims.",
      },
    });
  }

  const nearby = await prisma.platform.findMany({
    where: {
      status: { in: ["PUBLISHED", "DRAFT"] },
      id: { not: platform.id },
      group: platform.group,
    },
    select: { id: true, slug: true, name: true, summary: true },
    take: 6,
    orderBy: { displayOrder: "asc" },
  });
  for (const n of nearby) {
    blocks.push({
      label: "NEARBY_ENTITY",
      title: n.name,
      data: {
        ...n,
        note: "For trade-off awareness only — do not turn this page into a full vs comparison.",
      },
    });
  }

  if (opts?.opportunityId) {
    const opp = await prisma.editorialOpportunity.findUnique({
      where: { id: opts.opportunityId },
      select: {
        id: true,
        whyNow: true,
        whySmartlance: true,
        uniqueValue: true,
        market: true,
        workingTitle: true,
        sourceSummaryJson: true,
        supportingSignalsJson: true,
      },
    });
    if (opp) {
      blocks.push({
        label: "EDITOR_INSTRUCTION",
        title: "Topic Intelligence handoff",
        data: {
          opportunityId: opp.id,
          workingTitle: opp.workingTitle,
          whyNow: opp.whyNow,
          whySmartlance: opp.whySmartlance,
          uniqueValue: opp.uniqueValue,
          market: opp.market,
          note: "Handoff context only — do not auto-generate until the editor starts an action.",
        },
      });
    }
  }

  const [allServices, allPlatforms] = await Promise.all([
    prisma.service.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, slug: true, href: true, title: true },
      take: 40,
      orderBy: { title: "asc" },
    }),
    prisma.platform.findMany({
      where: { status: "PUBLISHED", id: { not: platform.id } },
      select: { id: true, slug: true, name: true, href: true },
      take: 30,
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    platform,
    blocks,
    promptText: formatContextBlocks(blocks),
    relationPool: { services: allServices, platforms: allPlatforms },
    lastReviewedAt: platform.lastReviewedAt,
    verifiedExperience: platform.verifiedExperience,
  };
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}
