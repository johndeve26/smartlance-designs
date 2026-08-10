import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { inferServiceType } from "@/lib/agency/deal-conversion";
import { recordProposalActivity } from "@/lib/proposals/activity";
import { generateAgencyProposalNumber } from "@/lib/proposals/proposal-number";
import {
  PROPOSAL_PAGE_SIZE_DEFAULT,
  PROPOSAL_PAGE_SIZE_MAX,
} from "@/lib/proposals/constants";
import type { ProposalFilters } from "@/lib/proposals/schema";
import { createDraftVersion } from "@/lib/proposals/versions";

function boundedPage(input?: { page?: number; pageSize?: number }) {
  const page = Math.max(1, input?.page ?? 1);
  const pageSize = Math.min(
    input?.pageSize ?? PROPOSAL_PAGE_SIZE_DEFAULT,
    PROPOSAL_PAGE_SIZE_MAX,
  );
  return { page, pageSize };
}

function buildProposalWhere(filters?: ProposalFilters): Prisma.AgencyProposalWhereInput {
  const where: Prisma.AgencyProposalWhereInput = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.ownerId) where.ownerId = filters.ownerId;
  if (filters?.companyId) where.companyId = filters.companyId;
  if (filters?.dealId) where.dealId = filters.dealId;
  if (filters?.expired === "true") {
    where.expiresAt = { lt: new Date() };
  }
  if (filters?.q?.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { proposalNumber: { contains: q, mode: "insensitive" } },
      { company: { name: { contains: q, mode: "insensitive" } } },
      { primaryContact: { displayName: { contains: q, mode: "insensitive" } } },
      { primaryContact: { email: { contains: q, mode: "insensitive" } } },
    ];
  }
  return where;
}

const proposalListInclude = {
  company: { select: { id: true, name: true } },
  primaryContact: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      displayName: true,
      email: true,
    },
  },
  owner: { select: { id: true, name: true } },
  deal: { select: { id: true, title: true, stage: true } },
  versions: {
    orderBy: { versionNumber: "desc" as const },
    take: 1,
    select: {
      id: true,
      versionNumber: true,
      totalAmount: true,
      currency: true,
      publishedAt: true,
    },
  },
  acceptance: {
    select: { id: true, acceptedTotal: true, currency: true, acceptedAt: true },
  },
  project: { select: { id: true, projectNumber: true, name: true } },
} satisfies Prisma.AgencyProposalInclude;

export async function listProposals(input?: {
  filters?: ProposalFilters;
  page?: number;
  pageSize?: number;
}) {
  const { page, pageSize } = boundedPage(input);
  const where = buildProposalWhere(input?.filters);

  const [items, total] = await Promise.all([
    prisma.agencyProposal.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: proposalListInclude,
    }),
    prisma.agencyProposal.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getProposalById(proposalId: string) {
  return prisma.agencyProposal.findUnique({
    where: { id: proposalId },
    include: {
      ...proposalListInclude,
      createdBy: { select: { id: true, name: true } },
      versions: {
        orderBy: { versionNumber: "desc" },
        include: {
          createdBy: { select: { id: true, name: true } },
          sections: { orderBy: { position: "asc" } },
          scopeItems: { orderBy: { position: "asc" } },
          deliverables: { orderBy: { position: "asc" } },
          lineItems: { orderBy: { position: "asc" } },
        },
      },
      clientAccess: {
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              displayName: true,
              email: true,
            },
          },
        },
        orderBy: { grantedAt: "asc" },
      },
      responses: { orderBy: { createdAt: "desc" }, take: 20 },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
          actorUser: { select: { id: true, name: true } },
          actorPortalUser: { select: { id: true, email: true } },
        },
      },
    },
  });
}

export async function listProposalsByDealId(dealId: string) {
  return prisma.agencyProposal.findMany({
    where: { dealId },
    orderBy: [{ updatedAt: "desc" }],
    include: proposalListInclude,
  });
}

export async function createProposal(input: {
  title: string;
  primaryContactId: string;
  companyId?: string | null;
  dealId?: string | null;
  sourceProspectRequestId?: string | null;
  ownerId: string;
  createdById: string;
  currency?: string;
  summary?: string | null;
  internalNotes?: string | null;
  prefillFromDeal?: {
    amount?: number | null;
    servicesInterested?: string[];
    dealTitle?: string;
  };
}) {
  const contact = await prisma.crmContact.findUniqueOrThrow({
    where: { id: input.primaryContactId },
  });

  let deal = null;
  if (input.dealId) {
    deal = await prisma.crmDeal.findUniqueOrThrow({
      where: { id: input.dealId },
    });
  }

  const proposal = await prisma.$transaction(async (tx) => {
    const maxAttempts = 3;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const proposalNumber = await generateAgencyProposalNumber(tx);
      try {
        const created = await tx.agencyProposal.create({
          data: {
            proposalNumber,
            title: input.title.trim(),
            primaryContactId: input.primaryContactId,
            companyId: input.companyId ?? deal?.companyId ?? contact.companyId,
            dealId: input.dealId ?? null,
            sourceProspectRequestId: input.sourceProspectRequestId ?? null,
            ownerId: input.ownerId,
            createdById: input.createdById,
            currency: input.currency ?? deal?.currency ?? "USD",
            summary: input.summary?.trim() || null,
            internalNotes: input.internalNotes?.trim() || null,
          },
        });

        await recordProposalActivity(
          {
            proposalId: created.id,
            type: "PROPOSAL_CREATED",
            summary: `Proposal ${created.proposalNumber} created.`,
            actorUserId: input.createdById,
          },
          tx,
        );

        const version = await createDraftVersion(
          {
            proposalId: created.id,
            createdById: input.createdById,
            title: input.title.trim(),
            currency: created.currency,
            prefillLineItems:
              deal?.amount != null
                ? [
                    {
                      name: deal.title || "Core scope",
                      quantity: 1,
                      unitPrice: Number(deal.amount),
                      type: "SERVICE" as const,
                      position: 0,
                    },
                  ]
                : [],
          },
          tx,
        );

        await tx.agencyProposal.update({
          where: { id: created.id },
          data: { currentVersionId: version.id },
        });

        return created;
      } catch (err) {
        const code = (err as { code?: string }).code;
        if (code === "P2002" && attempt < maxAttempts - 1) continue;
        throw err;
      }
    }
    throw new Error("Failed to allocate a unique proposal number.");
  });

  return getProposalById(proposal.id);
}

export async function updateProposal(input: {
  proposalId: string;
  title?: string;
  summary?: string | null;
  internalNotes?: string | null;
  ownerId?: string;
  expiresAt?: Date | null;
}) {
  const data: Prisma.AgencyProposalUpdateInput = {};
  if (input.title !== undefined) data.title = input.title.trim();
  if (input.summary !== undefined) data.summary = input.summary?.trim() || null;
  if (input.internalNotes !== undefined) {
    data.internalNotes = input.internalNotes?.trim() || null;
  }
  if (input.ownerId !== undefined) data.owner = { connect: { id: input.ownerId } };
  if (input.expiresAt !== undefined) data.expiresAt = input.expiresAt;

  await prisma.agencyProposal.update({
    where: { id: input.proposalId },
    data,
  });

  return getProposalById(input.proposalId);
}

export async function getProposalDashboardCounts() {
  const now = new Date();
  const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [draft, awaiting, changesRequested, accepted, declined, expiringSoon] =
    await Promise.all([
      prisma.agencyProposal.count({ where: { status: "DRAFT" } }),
      prisma.agencyProposal.count({ where: { status: "SENT" } }),
      prisma.agencyProposal.count({ where: { status: "CHANGES_REQUESTED" } }),
      prisma.agencyProposal.count({ where: { status: "ACCEPTED" } }),
      prisma.agencyProposal.count({ where: { status: "DECLINED" } }),
      prisma.agencyProposal.count({
        where: {
          status: { in: ["SENT", "CHANGES_REQUESTED"] },
          expiresAt: { gte: now, lte: soon },
        },
      }),
    ]);

  return { draft, awaiting, changesRequested, accepted, declined, expiringSoon };
}

export { inferServiceType };
