/**
 * Service AI context builder — selective retrieval, no Enquiry/PII.
 */

import { prisma } from "@/lib/db";
import {
  formatContextBlocks,
  loadBrandVoiceBlock,
  loadSitePositioningBlock,
  type LabeledContextBlock,
} from "@/lib/ai/content-assistants/context";
import { entityToPlain } from "@/lib/ai/content-assistants/helpers";

export async function buildServiceContext(entityId: string) {
  const service = await prisma.service.findUnique({ where: { id: entityId } });
  if (!service) throw new Error("Service not found");

  const blocks: LabeledContextBlock[] = [
    {
      label: "CURRENT_ENTITY",
      title: service.title,
      data: entityToPlain(service as unknown as Record<string, unknown>),
    },
  ];

  const voice = await loadBrandVoiceBlock();
  blocks.push(voice);

  const site = await loadSitePositioningBlock();
  if (site) blocks.push(site);

  const relatedSolutionSlugs = asStringArray(service.relatedSolutionSlugs);
  if (relatedSolutionSlugs.length) {
    const solutions = await prisma.solution.findMany({
      where: { slug: { in: relatedSolutionSlugs }, status: "PUBLISHED" },
      select: {
        id: true,
        slug: true,
        name: true,
        title: true,
        shortDescription: true,
        category: true,
      },
      take: 8,
    });
    for (const s of solutions) {
      blocks.push({
        label: "RELATED_SOLUTION",
        title: s.name,
        data: s,
      });
    }
  }

  const relatedProjectSlugs = asStringArray(service.relatedProjectSlugs);
  if (relatedProjectSlugs.length) {
    const work = await prisma.workProject.findMany({
      where: {
        slug: { in: relatedProjectSlugs },
        status: "PUBLISHED",
      },
      select: {
        id: true,
        slug: true,
        title: true,
        name: true,
        shortDescription: true,
        clientName: true,
        industryLabel: true,
      },
      take: 6,
    });
    for (const w of work) {
      blocks.push({
        label: "PUBLISHED_WORK",
        title: w.title || w.name,
        data: {
          ...w,
          note: "Published work only — do not invent metrics from this.",
        },
      });
    }
  }

  const relatedPlatformSlugs = asStringArray(service.relatedPlatformSlugs);
  if (relatedPlatformSlugs.length) {
    const platforms = await prisma.platform.findMany({
      where: { slug: { in: relatedPlatformSlugs }, status: "PUBLISHED" },
      select: { id: true, slug: true, name: true, summary: true },
      take: 6,
    });
    for (const p of platforms) {
      blocks.push({ label: "PLATFORM", title: p.name, data: p });
    }
  }

  // Nearby services for duplication awareness (same group)
  const nearby = await prisma.service.findMany({
    where: {
      status: { in: ["PUBLISHED", "DRAFT"] },
      group: service.group,
      id: { not: service.id },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      category: true,
    },
    take: 8,
    orderBy: { displayOrder: "asc" },
  });
  for (const n of nearby) {
    blocks.push({
      label: "NEARBY_ENTITY",
      title: n.title,
      data: {
        ...n,
        note: "Do not write copy that could be pasted onto this Service unchanged.",
      },
    });
  }

  // Candidate relation pool — include Solution problem metadata for ranking
  // (never rank by displayOrder / first-N alone)
  const [allServices, allSolutions, allPlatforms, allWork] = await Promise.all([
    prisma.service.findMany({
      where: { status: "PUBLISHED", id: { not: service.id } },
      select: { id: true, slug: true, title: true, href: true },
      take: 40,
      orderBy: { title: "asc" },
    }),
    prisma.solution.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        slug: true,
        name: true,
        title: true,
        shortDescription: true,
        category: true,
        problemSymptoms: true,
        possibleCauses: true,
        relatedServiceHrefs: true,
      },
      take: 40,
      orderBy: { name: "asc" },
    }),
    prisma.platform.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, slug: true, name: true },
      take: 30,
      orderBy: { name: "asc" },
    }),
    prisma.workProject.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, slug: true, title: true, name: true },
      take: 30,
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    service,
    blocks,
    promptText: formatContextBlocks(blocks),
    relationPool: {
      services: allServices,
      solutions: allSolutions,
      platforms: allPlatforms,
      work: allWork,
    },
  };
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}
