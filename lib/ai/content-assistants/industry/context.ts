/**
 * Industry AI context — explicit VERIFIED vs SUPPORTED labeling.
 */

import { prisma } from "@/lib/db";
import {
  formatContextBlocks,
  loadBrandVoiceBlock,
  loadSitePositioningBlock,
  type LabeledContextBlock,
} from "@/lib/ai/content-assistants/context";
import { entityToPlain } from "@/lib/ai/content-assistants/helpers";

export async function buildIndustryContext(
  entityId: string,
  opts?: { opportunityId?: string },
) {
  const industry = await prisma.industry.findUnique({
    where: { id: entityId },
    include: {
      workLinks: {
        include: {
          work: {
            select: {
              id: true,
              slug: true,
              name: true,
              title: true,
              shortDescription: true,
              status: true,
              challenge: true,
              solution: true,
              resultSummary: true,
            },
          },
        },
      },
    },
  });
  if (!industry) throw new Error("Industry not found");

  const verified =
    industry.hasVerifiedProjectExperience && industry.group === "proven";

  const blocks: LabeledContextBlock[] = [
    {
      label: "CURRENT_ENTITY",
      title: industry.name,
      data: {
        ...entityToPlain(industry as unknown as Record<string, unknown>),
        experienceMode: verified ? "PROVEN" : "SUPPORTED_ONLY",
        note: verified
          ? "May reference only verified/published related Work facts."
          : "SUPPORTED INDUSTRY ONLY — no first-person client experience claims.",
      },
    },
  ];

  if (!verified) {
    blocks.push({
      label: "EDITOR_INSTRUCTION",
      title: "SUPPORTED INDUSTRY ONLY",
      data: {
        message:
          "Do not say we've helped many businesses in this industry. Use Services/Solutions and general needs reasoning only.",
      },
    });
  }

  blocks.push(await loadBrandVoiceBlock());
  const site = await loadSitePositioningBlock();
  if (site) blocks.push(site);

  const publishedWork = industry.workLinks
    .map((l) => l.work)
    .filter((w) => w.status === "PUBLISHED");

  for (const w of publishedWork) {
    blocks.push({
      label: "PUBLISHED_WORK",
      title: w.title || w.name,
      data: {
        id: w.id,
        slug: w.slug,
        name: w.name,
        title: w.title,
        shortDescription: w.shortDescription,
        // Avoid sending measurableResults / invented metrics
        note: "VERIFIED SMARTLANCE PROJECT — use only these facts; invent no metrics.",
        label: "VERIFIED SMARTLANCE PROJECT",
      },
    });
  }

  const serviceLinks = Array.isArray(industry.relatedServiceLinks)
    ? industry.relatedServiceLinks
    : [];
  const hrefs = serviceLinks
    .map((x) =>
      x && typeof x === "object" && "href" in x
        ? String((x as { href: string }).href)
        : null,
    )
    .filter((h): h is string => Boolean(h));

  if (hrefs.length) {
    const services = await prisma.service.findMany({
      where: { href: { in: hrefs }, status: "PUBLISHED" },
      select: { id: true, slug: true, href: true, title: true, summary: true },
      take: 12,
    });
    for (const s of services) {
      blocks.push({
        label: "RELATED_SMARTLANCE_SERVICE",
        title: s.title,
        data: { ...s, label: "SMARTLANCE SERVICE" },
      });
    }
  }

  const solutionSlugs = Array.isArray(industry.relatedSolutionSlugs)
    ? industry.relatedSolutionSlugs.filter((s): s is string => typeof s === "string")
    : [];
  if (solutionSlugs.length) {
    const solutions = await prisma.solution.findMany({
      where: { slug: { in: solutionSlugs }, status: "PUBLISHED" },
      select: { id: true, slug: true, name: true, shortDescription: true },
      take: 8,
    });
    for (const s of solutions) {
      blocks.push({
        label: "RELATED_SOLUTION",
        title: s.name,
        data: { ...s, label: "SMARTLANCE SOLUTION" },
      });
    }
  }

  const nearby = await prisma.industry.findMany({
    where: {
      status: { in: ["PUBLISHED", "DRAFT"] },
      id: { not: industry.id },
    },
    select: { id: true, slug: true, name: true, description: true, group: true },
    take: 8,
    orderBy: { name: "asc" },
  });
  for (const n of nearby) {
    blocks.push({
      label: "NEARBY_ENTITY",
      title: n.name,
      data: {
        ...n,
        note: "Flag copy that would still work after swapping industry names.",
      },
    });
  }

  if (opts?.opportunityId) {
    const opp = await prisma.editorialOpportunity.findUnique({
      where: { id: opts.opportunityId },
      select: {
        id: true,
        whyNow: true,
        uniqueValue: true,
        market: true,
        workingTitle: true,
      },
    });
    if (opp) {
      blocks.push({
        label: "EDITOR_INSTRUCTION",
        title: "Topic Intelligence handoff",
        data: opp,
      });
    }
  }

  const [allServices, allSolutions, allWork] = await Promise.all([
    prisma.service.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, slug: true, href: true, title: true },
      take: 40,
      orderBy: { title: "asc" },
    }),
    prisma.solution.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, slug: true, name: true },
      take: 30,
      orderBy: { name: "asc" },
    }),
    prisma.workProject.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, slug: true, name: true, title: true },
      take: 40,
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    industry,
    verified,
    publishedWork,
    blocks,
    promptText: formatContextBlocks(blocks),
    relationPool: {
      services: allServices,
      solutions: allSolutions,
      work: allWork,
    },
  };
}
