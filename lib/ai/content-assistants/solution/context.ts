/**
 * Solution AI context builder — selective retrieval, no Enquiry/PII.
 */

import { prisma } from "@/lib/db";
import {
  formatContextBlocks,
  loadBrandVoiceBlock,
  loadSitePositioningBlock,
  type LabeledContextBlock,
} from "@/lib/ai/content-assistants/context";
import { entityToPlain } from "@/lib/ai/content-assistants/helpers";

export async function buildSolutionContext(entityId: string) {
  const solution = await prisma.solution.findUnique({ where: { id: entityId } });
  if (!solution) throw new Error("Solution not found");

  const blocks: LabeledContextBlock[] = [
    {
      label: "CURRENT_ENTITY",
      title: solution.name,
      data: {
        ...entityToPlain(solution as unknown as Record<string, unknown>),
        // pageContent included for awareness but truncated in prompt via JSON size
        pageContentSummary: solution.pageContent
          ? {
              kind: (solution.pageContent as { kind?: string })?.kind,
              slug: (solution.pageContent as { slug?: string })?.slug,
            }
          : null,
      },
    },
  ];

  blocks.push(await loadBrandVoiceBlock());
  const site = await loadSitePositioningBlock();
  if (site) blocks.push(site);

  const serviceHrefs = asStringArray(solution.relatedServiceHrefs);
  if (serviceHrefs.length) {
    const services = await prisma.service.findMany({
      where: { href: { in: serviceHrefs }, status: "PUBLISHED" },
      select: {
        id: true,
        slug: true,
        href: true,
        title: true,
        summary: true,
        category: true,
      },
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

  const projectSlugs = asStringArray(solution.relatedProjectSlugs);
  if (projectSlugs.length) {
    const work = await prisma.workProject.findMany({
      where: { slug: { in: projectSlugs }, status: "PUBLISHED" },
      select: {
        id: true,
        slug: true,
        name: true,
        title: true,
        shortDescription: true,
      },
      take: 6,
    });
    for (const w of work) {
      blocks.push({
        label: "PUBLISHED_WORK",
        title: w.title || w.name,
        data: {
          ...w,
          note: "Do not invent metrics from Work.",
        },
      });
    }
  }

  const nearby = await prisma.solution.findMany({
    where: {
      status: { in: ["PUBLISHED", "DRAFT"] },
      category: solution.category,
      id: { not: solution.id },
    },
    select: {
      id: true,
      slug: true,
      name: true,
      shortDescription: true,
    },
    take: 6,
    orderBy: { displayOrder: "asc" },
  });
  for (const n of nearby) {
    blocks.push({
      label: "NEARBY_ENTITY",
      title: n.name,
      data: {
        ...n,
        note: "Avoid generic copy that fits another Solution unchanged.",
      },
    });
  }

  const [allServices, allPlatforms, allIndustries, allWork] = await Promise.all([
    prisma.service.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, slug: true, href: true, title: true },
      take: 50,
      orderBy: { title: "asc" },
    }),
    prisma.platform.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, slug: true, name: true },
      take: 30,
      orderBy: { name: "asc" },
    }),
    prisma.industry.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, slug: true, name: true },
      take: 30,
      orderBy: { name: "asc" },
    }),
    prisma.workProject.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, slug: true, name: true, title: true },
      take: 30,
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    solution,
    blocks,
    promptText: formatContextBlocks(blocks),
    relationPool: {
      services: allServices,
      platforms: allPlatforms,
      industries: allIndustries,
      work: allWork,
      requiredServiceHrefs: serviceHrefs,
    },
  };
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}
