/**
 * Testimonial Assistant context — verified feedback only; never send internal notes.
 */

import { prisma } from "@/lib/db";
import {
  formatContextBlocks,
  loadBrandVoiceBlock,
  type LabeledContextBlock,
} from "@/lib/ai/content-assistants/context";
import { entityToPlain } from "@/lib/ai/content-assistants/helpers";

export async function buildTestimonialContext(entityId: string) {
  const row = await prisma.testimonial.findUnique({
    where: { id: entityId },
    include: {
      workProject: {
        select: { id: true, slug: true, name: true, clientName: true },
      },
    },
  });
  if (!row) throw new Error("Testimonial not found");

  // Explicitly never include internalVerificationNote / internalSourceUrl in AI context
  const sourceQuote = row.originalQuote || row.quote;
  const hasQuote = Boolean(sourceQuote && sourceQuote.trim());

  const blocks: LabeledContextBlock[] = [
    {
      label: "CURRENT_ENTITY",
      title: `${row.name} — ${row.company}`,
      data: {
        id: row.id,
        quote: row.quote,
        originalQuote: sourceQuote,
        displayExcerpt: row.displayExcerpt,
        name: row.name,
        role: row.role,
        company: row.company,
        verified: row.verified,
        status: row.status,
        workProjectId: row.workProjectId,
        themesJson: row.themesJson,
        note: "Preserve the client's words. Do not invent praise or rewrite meaning.",
      },
    },
    {
      label: "EDITOR_INSTRUCTION",
      title: "ORIGINAL VERIFIED QUOTE",
      data: {
        label: "VERIFIED TESTIMONIAL",
        originalQuote: sourceQuote,
        displayExcerpt: row.displayExcerpt,
      },
    },
  ];

  blocks.push(await loadBrandVoiceBlock());

  if (row.workProject) {
    blocks.push({
      label: "PUBLISHED_WORK",
      title: row.workProject.name,
      data: {
        id: row.workProject.id,
        slug: row.workProject.slug,
        name: row.workProject.name,
        clientName: row.workProject.clientName,
        note: "Existing related Case Study — do not invent a different project relationship.",
      },
    });
  }

  const workCandidates = await prisma.workProject.findMany({
    where: { status: { in: ["PUBLISHED", "DRAFT"] } },
    select: {
      id: true,
      slug: true,
      name: true,
      clientName: true,
      industryLabel: true,
    },
    take: 40,
    orderBy: { name: "asc" },
  });

  return {
    testimonial: entityToPlain(row as unknown as Record<string, unknown>),
    testimonialRow: row,
    sourceQuote,
    hasQuote,
    blocks,
    promptText: formatContextBlocks(blocks),
    relationPool: { work: workCandidates },
  };
}
