import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recordProposalActivity } from "@/lib/proposals/activity";
import {
  calculateLineItemAmount,
  calculateVersionPricing,
} from "@/lib/proposals/pricing";

type Tx = Pick<
  PrismaClient,
  | "agencyProposalVersion"
  | "agencyProposalLineItem"
  | "agencyProposalScopeItem"
  | "agencyProposalDeliverableItem"
  | "agencyProposalSection"
  | "agencyProposal"
>;

export function isVersionMutable(version: { publishedAt: Date | null }) {
  return version.publishedAt == null;
}

async function allocateVersionNumber(proposalId: string, db: Tx) {
  const maxAttempts = 5;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const latest = await db.agencyProposalVersion.findFirst({
      where: { proposalId },
      orderBy: { versionNumber: "desc" },
      select: { versionNumber: true },
    });
    const versionNumber = (latest?.versionNumber ?? 0) + 1;
    return versionNumber;
  }
  throw new Error("Failed to allocate proposal version number.");
}

export async function createDraftVersion(
  input: {
    proposalId: string;
    createdById: string;
    title: string;
    currency: string;
    sourceVersionId?: string;
    prefillLineItems?: Array<{
      name: string;
      quantity: number;
      unitPrice: number;
      type?: "SERVICE" | "ADD_ON" | "DISCOUNT" | "OTHER";
      position: number;
    }>;
  },
  db: Tx = prisma,
) {
  let source = null;
  if (input.sourceVersionId) {
    source = await db.agencyProposalVersion.findUniqueOrThrow({
      where: { id: input.sourceVersionId },
      include: {
        sections: true,
        scopeItems: true,
        deliverables: true,
        lineItems: true,
      },
    });
    if (source.proposalId !== input.proposalId) {
      throw new Error("Source version does not belong to this proposal.");
    }
  }

  const maxAttempts = 5;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const versionNumber = await allocateVersionNumber(input.proposalId, db);
    try {
      const pricing = source
        ? calculateVersionPricing({
            lineItems: source.lineItems.map((item) => ({
              id: item.id,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
              amount: Number(item.amount),
              isOptional: item.isOptional,
              type: item.type,
            })),
            discountAmount: source.discountAmount ? Number(source.discountAmount) : null,
            taxAmount: source.taxAmount ? Number(source.taxAmount) : null,
          })
        : calculateVersionPricing({
            lineItems: (input.prefillLineItems ?? []).map((item) => ({
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              type: item.type ?? "SERVICE",
            })),
          });

      const version = await db.agencyProposalVersion.create({
        data: {
          proposalId: input.proposalId,
          versionNumber,
          title: input.title.trim(),
          intro: source?.intro ?? null,
          scopeSummary: source?.scopeSummary ?? null,
          timelineSummary: source?.timelineSummary ?? null,
          estimatedStart: source?.estimatedStart ?? null,
          estimatedDuration: source?.estimatedDuration ?? null,
          assumptionsText: source?.assumptionsText ?? null,
          exclusionsText: source?.exclusionsText ?? null,
          revisionPolicy: source?.revisionPolicy ?? null,
          validUntil: source?.validUntil ?? null,
          pricingSubtotal: pricing.pricingSubtotal,
          discountAmount: pricing.discountAmount,
          taxAmount: pricing.taxAmount,
          totalAmount: pricing.totalAmount,
          currency: input.currency,
          createdById: input.createdById,
        },
      });

      if (source) {
        if (source.sections.length) {
          await db.agencyProposalSection.createMany({
            data: source.sections.map((s) => ({
              proposalVersionId: version.id,
              sectionType: s.sectionType,
              title: s.title,
              body: s.body,
              position: s.position,
            })),
          });
        }
        if (source.scopeItems.length) {
          await db.agencyProposalScopeItem.createMany({
            data: source.scopeItems.map((s) => ({
              proposalVersionId: version.id,
              title: s.title,
              description: s.description,
              position: s.position,
              included: s.included,
              clientVisible: s.clientVisible,
            })),
          });
        }
        if (source.deliverables.length) {
          await db.agencyProposalDeliverableItem.createMany({
            data: source.deliverables.map((d) => ({
              proposalVersionId: version.id,
              title: d.title,
              description: d.description,
              quantity: d.quantity,
              position: d.position,
            })),
          });
        }
        if (source.lineItems.length) {
          await db.agencyProposalLineItem.createMany({
            data: source.lineItems.map((l) => ({
              proposalVersionId: version.id,
              name: l.name,
              description: l.description,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              amount: l.amount,
              position: l.position,
              type: l.type,
              isOptional: l.isOptional,
              isSelectedByDefault: l.isSelectedByDefault,
            })),
          });
        }
      } else if (input.prefillLineItems?.length) {
        await db.agencyProposalLineItem.createMany({
          data: input.prefillLineItems.map((item) => ({
            proposalVersionId: version.id,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: calculateLineItemAmount(item),
            position: item.position,
            type: item.type ?? "SERVICE",
          })),
        });
      }

      await recordProposalActivity(
        {
          proposalId: input.proposalId,
          type: "VERSION_CREATED",
          summary: `Version ${versionNumber} created.`,
          actorUserId: input.createdById,
          entityType: "AgencyProposalVersion",
          entityId: version.id,
        },
        db as never,
      );

      return version;
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "P2002" && attempt < maxAttempts - 1) continue;
      throw err;
    }
  }

  throw new Error("Failed to create proposal version.");
}

export async function saveDraftVersion(input: {
  proposalId: string;
  versionId: string;
  title: string;
  intro?: string | null;
  scopeSummary?: string | null;
  timelineSummary?: string | null;
  estimatedStart?: Date | null;
  estimatedDuration?: string | null;
  assumptionsText?: string | null;
  exclusionsText?: string | null;
  revisionPolicy?: string | null;
  validUntil?: Date | null;
  discountAmount?: number | null;
  taxAmount?: number | null;
  lineItems: Array<{
    id?: string;
    name: string;
    description?: string | null;
    quantity: number;
    unitPrice: number;
    type: string;
    isOptional: boolean;
    isSelectedByDefault: boolean;
    position: number;
  }>;
  scopeItems: Array<{
    id?: string;
    title: string;
    description?: string | null;
    position: number;
    included: boolean;
    clientVisible: boolean;
  }>;
  deliverables: Array<{
    id?: string;
    title: string;
    description?: string | null;
    quantity: number;
    position: number;
  }>;
  sections: Array<{
    id?: string;
    sectionType: string;
    title: string;
    body?: string | null;
    position: number;
  }>;
}) {
  const version = await prisma.agencyProposalVersion.findUniqueOrThrow({
    where: { id: input.versionId },
    include: { proposal: true },
  });

  if (version.proposalId !== input.proposalId) {
    throw new Error("Version does not belong to this proposal.");
  }
  if (!isVersionMutable(version)) {
    throw new Error("Published proposal versions cannot be edited.");
  }
  if (version.proposal.status === "ACCEPTED") {
    throw new Error("Accepted proposals cannot be edited.");
  }

  const computedItems = input.lineItems.map((item) => ({
    ...item,
    amount: calculateLineItemAmount(item),
  }));

  const pricing = calculateVersionPricing({
    lineItems: computedItems,
    discountAmount: input.discountAmount,
    taxAmount: input.taxAmount,
  });

  await prisma.$transaction(async (tx) => {
    await tx.agencyProposalLineItem.deleteMany({
      where: { proposalVersionId: input.versionId },
    });
    await tx.agencyProposalScopeItem.deleteMany({
      where: { proposalVersionId: input.versionId },
    });
    await tx.agencyProposalDeliverableItem.deleteMany({
      where: { proposalVersionId: input.versionId },
    });
    await tx.agencyProposalSection.deleteMany({
      where: { proposalVersionId: input.versionId },
    });

    await tx.agencyProposalVersion.update({
      where: { id: input.versionId },
      data: {
        title: input.title.trim(),
        intro: input.intro?.trim() || null,
        scopeSummary: input.scopeSummary?.trim() || null,
        timelineSummary: input.timelineSummary?.trim() || null,
        estimatedStart: input.estimatedStart ?? null,
        estimatedDuration: input.estimatedDuration?.trim() || null,
        assumptionsText: input.assumptionsText?.trim() || null,
        exclusionsText: input.exclusionsText?.trim() || null,
        revisionPolicy: input.revisionPolicy?.trim() || null,
        validUntil: input.validUntil ?? null,
        pricingSubtotal: pricing.pricingSubtotal,
        discountAmount: pricing.discountAmount,
        taxAmount: pricing.taxAmount,
        totalAmount: pricing.totalAmount,
      },
    });

    if (computedItems.length) {
      await tx.agencyProposalLineItem.createMany({
        data: computedItems.map((item) => ({
          proposalVersionId: input.versionId,
          name: item.name.trim(),
          description: item.description?.trim() || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
          position: item.position,
          type: item.type as never,
          isOptional: item.isOptional,
          isSelectedByDefault: item.isSelectedByDefault,
        })),
      });
    }

    if (input.scopeItems.length) {
      await tx.agencyProposalScopeItem.createMany({
        data: input.scopeItems.map((item) => ({
          proposalVersionId: input.versionId,
          title: item.title.trim(),
          description: item.description?.trim() || null,
          position: item.position,
          included: item.included,
          clientVisible: item.clientVisible,
        })),
      });
    }

    if (input.deliverables.length) {
      await tx.agencyProposalDeliverableItem.createMany({
        data: input.deliverables.map((item) => ({
          proposalVersionId: input.versionId,
          title: item.title.trim(),
          description: item.description?.trim() || null,
          quantity: item.quantity,
          position: item.position,
        })),
      });
    }

    if (input.sections.length) {
      await tx.agencyProposalSection.createMany({
        data: input.sections.map((item) => ({
          proposalVersionId: input.versionId,
          sectionType: item.sectionType as never,
          title: item.title.trim(),
          body: item.body?.trim() || null,
          position: item.position,
        })),
      });
    }

    await tx.agencyProposal.update({
      where: { id: input.proposalId },
      data: { currentVersionId: input.versionId },
    });
  });

  return prisma.agencyProposalVersion.findUniqueOrThrow({
    where: { id: input.versionId },
    include: {
      sections: { orderBy: { position: "asc" } },
      scopeItems: { orderBy: { position: "asc" } },
      deliverables: { orderBy: { position: "asc" } },
      lineItems: { orderBy: { position: "asc" } },
    },
  });
}

export async function getCurrentSentVersion(proposalId: string) {
  const proposal = await prisma.agencyProposal.findUniqueOrThrow({
    where: { id: proposalId },
    include: {
      versions: {
        where: { publishedAt: { not: null } },
        orderBy: { versionNumber: "desc" },
        take: 1,
        include: {
          sections: { orderBy: { position: "asc" } },
          scopeItems: { orderBy: { position: "asc" } },
          deliverables: { orderBy: { position: "asc" } },
          lineItems: { orderBy: { position: "asc" } },
        },
      },
    },
  });

  return proposal.versions[0] ?? null;
}

export async function publishVersion(input: {
  proposalId: string;
  versionId: string;
  actorUserId: string;
}) {
  const version = await prisma.agencyProposalVersion.findUniqueOrThrow({
    where: { id: input.versionId },
    include: { proposal: true, lineItems: true, scopeItems: true },
  });

  if (version.proposalId !== input.proposalId) {
    throw new Error("Version does not belong to this proposal.");
  }
  if (version.publishedAt) {
    return version;
  }

  if (!version.title.trim()) {
    throw new Error("Proposal title is required.");
  }
  if (!version.lineItems.some((item) => !item.isOptional || item.type === "SERVICE")) {
    throw new Error("At least one pricing line item is required.");
  }
  if (Number(version.totalAmount) <= 0) {
    throw new Error("Proposal total must be greater than zero.");
  }

  const now = new Date();
  return prisma.agencyProposalVersion.update({
    where: { id: input.versionId },
    data: { publishedAt: now },
  });
}
