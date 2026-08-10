import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recordCrmActivity } from "@/lib/crm/activities";
import {
  ACTIVE_DEAL_STAGES,
  CRM_EXPORT_MAX_ROWS,
  CRM_PAGE_SIZE_DEFAULT,
  CRM_PAGE_SIZE_MAX,
  DEAL_STAGE_DEFAULT_PROBABILITY,
} from "@/lib/crm/constants";
import { escapeCrmCsvCell, contactDisplayName } from "@/lib/crm/contacts";
import type { CrmDealFilters } from "@/lib/crm/schema";

function boundedPage(input?: { page?: number; pageSize?: number }) {
  const page = Math.max(1, input?.page ?? 1);
  const pageSize = Math.min(
    input?.pageSize ?? CRM_PAGE_SIZE_DEFAULT,
    CRM_PAGE_SIZE_MAX,
  );
  return { page, pageSize };
}

export async function createDeal(input: {
  title: string;
  contactId: string;
  companyId?: string | null;
  leadId?: string | null;
  ownerId?: string | null;
  stage?: Prisma.CrmDealCreateInput["stage"];
  amount?: number | null;
  currency?: string | null;
  expectedCloseAt?: Date | null;
  servicesInterested?: string[];
  createdById: string;
}) {
  const contact = await prisma.crmContact.findUniqueOrThrow({
    where: { id: input.contactId },
  });

  const stage = input.stage ?? "NEW_OPPORTUNITY";
  const probability = DEAL_STAGE_DEFAULT_PROBABILITY[stage];

  const deal = await prisma.crmDeal.create({
    data: {
      title: input.title.trim(),
      contactId: input.contactId,
      companyId: input.companyId ?? contact.companyId,
      leadId: input.leadId ?? null,
      ownerId: input.ownerId ?? contact.ownerId,
      stage,
      amount: input.amount ?? null,
      currency: input.currency ?? "USD",
      probability,
      expectedCloseAt: input.expectedCloseAt ?? null,
      servicesInterested: input.servicesInterested ?? [],
    },
    include: {
      contact: true,
      company: true,
      lead: true,
      owner: { select: { id: true, name: true } },
    },
  });

  if (contact.lifecycleStage === "PROSPECT" || contact.lifecycleStage === "LEAD") {
    await prisma.crmContact.update({
      where: { id: contact.id },
      data: { lifecycleStage: "OPPORTUNITY" },
    });
  }

  await recordCrmActivity({
    contactId: deal.contactId,
    companyId: deal.companyId,
    leadId: deal.leadId,
    dealId: deal.id,
    type: "DEAL_CREATED",
    subject: `Deal created: ${deal.title}`,
    createdById: input.createdById,
  });

  return deal;
}

export async function createDealFromLead(input: {
  leadId: string;
  title?: string;
  actorId: string;
}) {
  const lead = await prisma.crmLead.findUniqueOrThrow({
    where: { id: input.leadId },
    include: { contact: { include: { company: true } } },
  });

  const title =
    input.title?.trim() ||
    `Opportunity — ${lead.contact.company?.name ?? contactDisplayName(lead.contact)}`;

  return createDeal({
    title,
    contactId: lead.contactId,
    companyId: lead.companyId ?? lead.contact.companyId,
    leadId: lead.id,
    ownerId: lead.ownerId,
    servicesInterested: lead.servicesInterested,
    amount: lead.estimatedValue ? Number(lead.estimatedValue) : null,
    currency: lead.currency,
    createdById: input.actorId,
  });
}

export async function updateDealStage(input: {
  dealId: string;
  stage: Prisma.CrmDealUpdateInput["stage"];
  lostReason?: Prisma.CrmDealUpdateInput["lostReason"];
  lostNote?: string | null;
  actorId: string;
}) {
  const before = await prisma.crmDeal.findUniqueOrThrow({
    where: { id: input.dealId },
    include: { contact: true },
  });

  const stage = input.stage as keyof typeof DEAL_STAGE_DEFAULT_PROBABILITY;
  const data: Prisma.CrmDealUpdateInput = {
    stage: input.stage as never,
    probability: DEAL_STAGE_DEFAULT_PROBABILITY[stage],
  };

  if (input.stage === "WON") {
    data.wonAt = new Date();
    data.lostAt = null;
    data.lostReason = null;
    data.lostNote = null;
  } else if (input.stage === "LOST") {
    data.lostAt = new Date();
    data.wonAt = null;
    data.lostReason = input.lostReason as never;
    data.lostNote = input.lostNote?.trim() || null;
  } else {
    if (before.stage === "WON" || before.stage === "LOST") {
      data.wonAt = null;
      data.lostAt = null;
      data.lostReason = null;
      data.lostNote = null;
    }
  }

  if (input.stage === "PROPOSAL" && !before.proposalSentAt) {
    data.proposalSentAt = new Date();
  }

  const deal = await prisma.crmDeal.update({
    where: { id: input.dealId },
    data,
  });

  let activityType: "DEAL_STAGE_CHANGED" | "DEAL_WON" | "DEAL_LOST" =
    "DEAL_STAGE_CHANGED";
  if (input.stage === "WON") activityType = "DEAL_WON";
  if (input.stage === "LOST") activityType = "DEAL_LOST";

  await recordCrmActivity({
    contactId: deal.contactId,
    companyId: deal.companyId,
    leadId: deal.leadId,
    dealId: deal.id,
    type: activityType,
    subject: "Deal stage changed",
    metadata: { from: before.stage, to: input.stage },
    createdById: input.actorId,
  });

  if (input.stage === "WON") {
    await prisma.crmContact.update({
      where: { id: before.contactId },
      data: { lifecycleStage: "CLIENT" },
    });
    const { onDealWon } = await import("@/lib/crm/outreach/suppression");
    await onDealWon(before.contactId);
  }

  return deal;
}

export async function getDealById(id: string) {
  return prisma.crmDeal.findUnique({
    where: { id },
    include: {
      contact: { include: { company: true } },
      company: true,
      lead: true,
      owner: { select: { id: true, name: true } },
      tasks: { where: { status: "OPEN" }, orderBy: { dueAt: "asc" } },
    },
  });
}

export async function listDeals(filters: CrmDealFilters = {}) {
  const { page, pageSize } = boundedPage(filters);
  const where: Prisma.CrmDealWhereInput = { isArchived: false };

  if (filters.stage) where.stage = filters.stage;
  if (filters.ownerId) where.ownerId = filters.ownerId;

  if (filters.q?.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      {
        contact: {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { displayName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
      },
      { company: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.crmDeal.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        contact: {
          include: { company: { select: { id: true, name: true } } },
        },
        owner: { select: { id: true, name: true } },
        tasks: {
          where: { status: "OPEN" },
          orderBy: { dueAt: "asc" },
          take: 1,
        },
      },
    }),
    prisma.crmDeal.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getPipelineSummary() {
  const stages = ACTIVE_DEAL_STAGES;
  const counts = await Promise.all(
    stages.map(async (stage) => {
      const [count, agg] = await Promise.all([
        prisma.crmDeal.count({
          where: { stage, isArchived: false },
        }),
        prisma.crmDeal.aggregate({
          where: { stage, isArchived: false, amount: { not: null } },
          _sum: { amount: true },
        }),
      ]);
      return {
        stage,
        count,
        totalAmount: Number(agg._sum.amount ?? 0),
      };
    }),
  );
  return counts;
}

export async function exportDealsCsv() {
  const rows = await prisma.crmDeal.findMany({
    where: { isArchived: false },
    orderBy: { updatedAt: "desc" },
    take: CRM_EXPORT_MAX_ROWS,
    include: {
      contact: { include: { company: true } },
      owner: { select: { name: true } },
    },
  });

  const header = [
    "Title",
    "Contact",
    "Company",
    "Stage",
    "Amount",
    "Currency",
    "Probability",
    "Owner",
    "Expected Close",
  ].join(",");

  const lines = rows.map((r) =>
    [
      r.title,
      contactDisplayName(r.contact),
      r.contact.company?.name ?? r.companyId ?? "",
      r.stage,
      r.amount?.toString() ?? "",
      r.currency ?? "",
      r.probability?.toString() ?? "",
      r.owner?.name ?? "",
      r.expectedCloseAt?.toISOString() ?? "",
    ]
      .map((c) => escapeCrmCsvCell(String(c)))
      .join(","),
  );

  return [header, ...lines].join("\n");
}
