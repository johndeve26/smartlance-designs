import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recordCrmActivity } from "@/lib/crm/activities";
import {
  CRM_EXPORT_MAX_ROWS,
  CRM_PAGE_SIZE_DEFAULT,
  CRM_PAGE_SIZE_MAX,
  INACTIVE_LEAD_STATUSES,
} from "@/lib/crm/constants";
import { escapeCrmCsvCell, contactDisplayName } from "@/lib/crm/contacts";
import type { CrmLeadFilters } from "@/lib/crm/schema";

function boundedPage(input?: { page?: number; pageSize?: number }) {
  const page = Math.max(1, input?.page ?? 1);
  const pageSize = Math.min(
    input?.pageSize ?? CRM_PAGE_SIZE_DEFAULT,
    CRM_PAGE_SIZE_MAX,
  );
  return { page, pageSize };
}

export async function findActiveLeadForContact(contactId: string) {
  return prisma.crmLead.findFirst({
    where: {
      contactId,
      status: { notIn: INACTIVE_LEAD_STATUSES },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createLead(input: {
  contactId: string;
  companyId?: string | null;
  status?: Prisma.CrmLeadCreateInput["status"];
  temperature?: Prisma.CrmLeadCreateInput["temperature"];
  source: Prisma.CrmLeadCreateInput["source"];
  ownerId?: string | null;
  interestSummary?: string | null;
  servicesInterested?: string[];
  estimatedValue?: number | null;
  currency?: string | null;
  createdById?: string | null;
}) {
  const active = await findActiveLeadForContact(input.contactId);
  if (active) {
    throw new Error(
      "This contact already has an active lead. Close or disqualify it first.",
    );
  }

  const contact = await prisma.crmContact.findUniqueOrThrow({
    where: { id: input.contactId },
  });

  const lead = await prisma.crmLead.create({
    data: {
      contactId: input.contactId,
      companyId: input.companyId ?? contact.companyId,
      status: input.status ?? "NEW",
      temperature: input.temperature ?? "COLD",
      source: input.source,
      ownerId: input.ownerId ?? contact.ownerId,
      interestSummary: input.interestSummary?.trim() || null,
      servicesInterested: input.servicesInterested ?? [],
      estimatedValue: input.estimatedValue ?? null,
      currency: input.currency ?? "USD",
    },
    include: {
      contact: true,
      company: true,
      owner: { select: { id: true, name: true } },
    },
  });

  if (contact.lifecycleStage === "PROSPECT") {
    await prisma.crmContact.update({
      where: { id: contact.id },
      data: { lifecycleStage: "LEAD" },
    });
  }

  await recordCrmActivity({
    contactId: lead.contactId,
    companyId: lead.companyId,
    leadId: lead.id,
    type: "LEAD_CREATED",
    subject: "Lead created",
    metadata: { status: lead.status, temperature: lead.temperature },
    createdById: input.createdById ?? null,
  });

  return lead;
}

export async function upsertLeadFromEnquiry(input: {
  contactId: string;
  companyId?: string | null;
  source: Prisma.CrmLeadCreateInput["source"];
  interestSummary?: string | null;
  servicesInterested?: string[];
  temperature?: Prisma.CrmLeadCreateInput["temperature"];
  actorId?: string | null;
}) {
  const existing = await findActiveLeadForContact(input.contactId);
  if (existing) return existing;

  return createLead({
    contactId: input.contactId,
    companyId: input.companyId,
    source: input.source,
    status: "NEW",
    temperature: input.temperature ?? "WARM",
    interestSummary: input.interestSummary,
    servicesInterested: input.servicesInterested,
    createdById: input.actorId ?? null,
  });
}

export async function updateLeadStatus(input: {
  leadId: string;
  status: Prisma.CrmLeadUpdateInput["status"];
  disqualificationReason?: Prisma.CrmLeadUpdateInput["disqualificationReason"];
  disqualificationNote?: string | null;
  actorId: string;
}) {
  const before = await prisma.crmLead.findUniqueOrThrow({
    where: { id: input.leadId },
  });

  const data: Prisma.CrmLeadUpdateInput = {
    status: input.status as never,
  };

  if (input.status === "QUALIFIED") {
    data.qualifiedAt = new Date();
  }
  if (input.status === "UNQUALIFIED") {
    data.disqualifiedAt = new Date();
    data.disqualificationReason = input.disqualificationReason as never;
    data.disqualificationNote = input.disqualificationNote?.trim() || null;
  }

  const lead = await prisma.crmLead.update({
    where: { id: input.leadId },
    data,
  });

  await recordCrmActivity({
    contactId: lead.contactId,
    companyId: lead.companyId,
    leadId: lead.id,
    type: "STATUS_CHANGED",
    subject: "Lead status changed",
    metadata: { from: before.status, to: input.status },
    createdById: input.actorId,
  });

  const { onLeadInactive } = await import("@/lib/crm/outreach/suppression");
  await onLeadInactive(lead.contactId, String(input.status));

  return lead;
}

export async function updateLeadTemperature(input: {
  leadId: string;
  temperature: Prisma.CrmLeadUpdateInput["temperature"];
  actorId: string;
}) {
  const before = await prisma.crmLead.findUniqueOrThrow({
    where: { id: input.leadId },
  });

  const lead = await prisma.crmLead.update({
    where: { id: input.leadId },
    data: { temperature: input.temperature as never },
  });

  await recordCrmActivity({
    contactId: lead.contactId,
    leadId: lead.id,
    type: "TEMPERATURE_CHANGED",
    subject: "Lead temperature changed",
    metadata: { from: before.temperature, to: input.temperature },
    createdById: input.actorId,
  });

  return lead;
}

export async function getLeadById(id: string) {
  return prisma.crmLead.findUnique({
    where: { id },
    include: {
      contact: { include: { company: true } },
      company: true,
      owner: { select: { id: true, name: true } },
      deals: { where: { isArchived: false } },
      tasks: { where: { status: "OPEN" }, orderBy: { dueAt: "asc" } },
    },
  });
}

export async function listLeads(filters: CrmLeadFilters = {}) {
  const { page, pageSize } = boundedPage(filters);
  const where: Prisma.CrmLeadWhereInput = {};

  if (filters.status) where.status = filters.status;
  else where.status = { notIn: INACTIVE_LEAD_STATUSES };

  if (filters.temperature) where.temperature = filters.temperature;
  if (filters.source) where.source = filters.source;
  if (filters.ownerId) where.ownerId = filters.ownerId;

  if (filters.noFollowUp) {
    where.tasks = { none: { status: "OPEN" } };
    where.nextFollowUpAt = null;
  }

  if (filters.overdue) {
    where.tasks = {
      some: { status: "OPEN", dueAt: { lt: new Date() } },
    };
  }

  if (filters.q?.trim()) {
    const q = filters.q.trim();
    where.contact = {
      OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { displayName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { company: { name: { contains: q, mode: "insensitive" } } },
      ],
    };
  }

  const [items, total] = await Promise.all([
    prisma.crmLead.findMany({
      where,
      orderBy: { createdAt: "desc" },
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
    prisma.crmLead.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function exportLeadsCsv() {
  const rows = await prisma.crmLead.findMany({
    orderBy: { createdAt: "desc" },
    take: CRM_EXPORT_MAX_ROWS,
    include: {
      contact: { include: { company: true } },
      owner: { select: { name: true } },
    },
  });

  const header = [
    "Contact",
    "Company",
    "Status",
    "Temperature",
    "Source",
    "Owner",
    "Created",
  ].join(",");

  const lines = rows.map((r) =>
    [
      contactDisplayName(r.contact),
      r.contact.company?.name ?? "",
      r.status,
      r.temperature,
      r.source,
      r.owner?.name ?? "",
      r.createdAt.toISOString(),
    ]
      .map((c) => escapeCrmCsvCell(String(c)))
      .join(","),
  );

  return [header, ...lines].join("\n");
}
