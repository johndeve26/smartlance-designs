import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  CRM_PAGE_SIZE_DEFAULT,
  CRM_PAGE_SIZE_MAX,
} from "@/lib/crm/constants";
import { normalizeCompanyDomain } from "@/lib/crm/normalize";
import type { CrmCompanyFilters } from "@/lib/crm/schema";
import { escapeCrmCsvCell } from "@/lib/crm/contacts";

function boundedPage(input?: { page?: number; pageSize?: number }) {
  const page = Math.max(1, input?.page ?? 1);
  const pageSize = Math.min(
    input?.pageSize ?? CRM_PAGE_SIZE_DEFAULT,
    CRM_PAGE_SIZE_MAX,
  );
  return { page, pageSize };
}

export async function createCompany(input: {
  name: string;
  website?: string | null;
  industry?: string | null;
  phone?: string | null;
  location?: string | null;
  address?: string | null;
  sizeLabel?: string | null;
  description?: string | null;
  ownerId?: string | null;
}) {
  return prisma.crmCompany.create({
    data: {
      name: input.name.trim(),
      website: input.website?.trim() || null,
      domain: normalizeCompanyDomain(input.website),
      industry: input.industry?.trim() || null,
      phone: input.phone?.trim() || null,
      location: input.location?.trim() || null,
      address: input.address?.trim() || null,
      sizeLabel: input.sizeLabel?.trim() || null,
      description: input.description?.trim() || null,
      ownerId: input.ownerId || null,
    },
  });
}

export async function findCompanyByDomain(
  db: Pick<typeof prisma, "crmCompany"> = prisma,
  domain: string,
) {
  return db.crmCompany.findFirst({
    where: { domain, isArchived: false },
  });
}

export async function findCompanyByName(
  db: Pick<typeof prisma, "crmCompany"> = prisma,
  name: string,
) {
  return db.crmCompany.findFirst({
    where: {
      name: { equals: name.trim(), mode: "insensitive" },
      isArchived: false,
    },
  });
}

export async function getCompanyById(id: string) {
  const company = await prisma.crmCompany.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true } },
      contacts: {
        where: { isArchived: false },
        orderBy: { updatedAt: "desc" },
        take: 50,
      },
      leads: {
        where: { status: { notIn: ["UNQUALIFIED", "CLOSED"] } },
        orderBy: { updatedAt: "desc" },
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
      },
      deals: {
        where: { isArchived: false },
        orderBy: { updatedAt: "desc" },
      },
      tasks: {
        where: { status: "OPEN" },
        orderBy: [{ dueAt: "asc" }],
        take: 10,
      },
    },
  });
  return company;
}

export async function listCompanies(filters: CrmCompanyFilters = {}) {
  const { page, pageSize } = boundedPage(filters);
  const where: Prisma.CrmCompanyWhereInput = { isArchived: false };

  if (filters.ownerId) where.ownerId = filters.ownerId;
  if (filters.q?.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { domain: { contains: q, mode: "insensitive" } },
      { industry: { contains: q, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.crmCompany.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        owner: { select: { id: true, name: true } },
        _count: {
          select: {
            contacts: { where: { isArchived: false } },
            deals: {
              where: {
                isArchived: false,
                stage: { notIn: ["WON", "LOST"] },
              },
            },
          },
        },
      },
    }),
    prisma.crmCompany.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getCompanyPipelineValue(companyId: string) {
  const deals = await prisma.crmDeal.findMany({
    where: {
      companyId,
      isArchived: false,
      stage: { notIn: ["WON", "LOST"] },
      amount: { not: null },
    },
    select: { amount: true, currency: true },
  });
  return deals.reduce(
    (sum, d) => sum + Number(d.amount ?? 0),
    0,
  );
}

export async function exportCompaniesCsv() {
  const rows = await prisma.crmCompany.findMany({
    where: { isArchived: false },
    orderBy: { name: "asc" },
    take: 5000,
    include: {
      _count: { select: { contacts: true, deals: true } },
    },
  });

  const header = [
    "Name",
    "Website",
    "Domain",
    "Industry",
    "Contacts",
    "Open Deals",
    "Created",
  ].join(",");

  const lines = rows.map((r) =>
    [
      r.name,
      r.website ?? "",
      r.domain ?? "",
      r.industry ?? "",
      r._count.contacts,
      r._count.deals,
      r.createdAt.toISOString(),
    ]
      .map((c) => escapeCrmCsvCell(String(c)))
      .join(","),
  );

  return [header, ...lines].join("\n");
}
