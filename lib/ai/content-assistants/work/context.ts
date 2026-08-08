/**
 * Case Study AI context — verified project facts only; no Enquiry/PII.
 */

import { prisma } from "@/lib/db";
import {
  formatContextBlocks,
  loadBrandVoiceBlock,
  type LabeledContextBlock,
} from "@/lib/ai/content-assistants/context";
import { entityToPlain } from "@/lib/ai/content-assistants/helpers";
import {
  hasEnoughProjectFacts,
  parseApprovedFacts,
} from "@/lib/ai/content-assistants/proof";

export async function buildWorkContext(entityId: string) {
  const work = await prisma.workProject.findUnique({
    where: { id: entityId },
    include: {
      platform: { select: { id: true, slug: true, name: true, href: true } },
      industryLinks: {
        include: { industry: { select: { id: true, slug: true, name: true } } },
      },
      testimonials: {
        where: { verified: true, status: "PUBLISHED" },
        select: { id: true, name: true, company: true, quote: true },
        take: 3,
      },
    },
  });
  if (!work) throw new Error("Work project not found");

  const facts = parseApprovedFacts(work.approvedProjectFacts);
  const enough = hasEnoughProjectFacts(facts, work);

  const blocks: LabeledContextBlock[] = [
    {
      label: "CURRENT_ENTITY",
      title: work.name,
      data: {
        id: work.id,
        slug: work.slug,
        name: work.name,
        title: work.title,
        clientName: work.clientName,
        industryLabel: work.industryLabel,
        shortDescription: work.shortDescription,
        challenge: work.challenge,
        solution: work.solution,
        approach: work.approach,
        resultSummary: work.resultSummary,
        results: work.results,
        measurableResults: work.measurableResults,
        servicesLabels: work.servicesLabels,
        technologies: work.technologies,
        platformLabel: work.platformLabel,
        platformId: work.platformId,
        seoTitle: work.seoTitle,
        seoDescription: work.seoDescription,
        note: "PUBLISHED CASE STUDY COPY — presentation layer, not additional proof.",
      },
    },
  ];

  if (work.approvedForAI && Object.keys(facts).length) {
    blocks.push({
      label: "EDITOR_INSTRUCTION",
      title: "VERIFIED PROJECT FACT",
      data: {
        label: "VERIFIED PROJECT FACT",
        approvedForAI: true,
        facts,
        note: "Only these approved facts (plus existing Work fields above) may ground generation.",
      },
    });
  } else {
    blocks.push({
      label: "EDITOR_INSTRUCTION",
      title: "Project facts status",
      data: {
        approvedForAI: work.approvedForAI,
        enoughFactsFromExistingFields: enough,
        message: work.approvedForAI
          ? "Approved for AI, but structured facts are thin — use existing challenge/solution carefully."
          : "Approved project facts not opted in — Case Study AI should rely only on already-public Work fields as known copy, not invent missing proof.",
      },
    });
  }

  // designNotes etc. NEVER sent unless approvedForAI and we still exclude private notes by default
  void work.designNotes;

  blocks.push(await loadBrandVoiceBlock());

  for (const t of work.testimonials) {
    blocks.push({
      label: "EDITOR_INSTRUCTION",
      title: "VERIFIED TESTIMONIAL",
      data: {
        label: "VERIFIED TESTIMONIAL",
        id: t.id,
        name: t.name,
        company: t.company,
        quote: t.quote,
      },
    });
  }

  if (work.platform) {
    blocks.push({
      label: "PLATFORM",
      title: work.platform.name,
      data: {
        ...work.platform,
        label: "RELATED PLATFORM",
        note: "Terminology only — does not prove this project used the platform unless project facts say so.",
      },
    });
  }

  for (const link of work.industryLinks) {
    blocks.push({
      label: "INDUSTRY",
      title: link.industry.name,
      data: {
        ...link.industry,
        label: "RELATED INDUSTRY",
        note: "Related industry is not proof of services delivered.",
      },
    });
  }

  const hrefs = Array.isArray(work.relatedServiceHrefs)
    ? work.relatedServiceHrefs.filter((h): h is string => typeof h === "string")
    : [];
  if (hrefs.length) {
    const services = await prisma.service.findMany({
      where: { href: { in: hrefs }, status: "PUBLISHED" },
      select: { id: true, href: true, title: true, slug: true },
      take: 12,
    });
    for (const s of services) {
      blocks.push({
        label: "RELATED_SMARTLANCE_SERVICE",
        title: s.title,
        data: {
          ...s,
          label: "RELATED SERVICE",
          note: "Does NOT prove this Service was performed on this project.",
        },
      });
    }
  }

  const [allServices, allPlatforms, allIndustries, allWork] = await Promise.all([
    prisma.service.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, href: true, title: true, slug: true },
      take: 40,
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
      where: { status: "PUBLISHED", id: { not: work.id } },
      select: { id: true, slug: true, name: true },
      take: 20,
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    work: entityToPlain(work as unknown as Record<string, unknown>),
    workRow: work,
    facts,
    enoughFacts: enough,
    approvedForAI: work.approvedForAI,
    blocks,
    promptText: formatContextBlocks(blocks),
    relationPool: {
      services: allServices,
      platforms: allPlatforms,
      industries: allIndustries,
      work: allWork,
    },
  };
}
