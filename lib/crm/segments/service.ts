import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import {
  CRM_PAGE_SIZE_MAX,
} from "@/lib/crm/constants";
import { escapeCrmCsvCell } from "@/lib/crm/contacts";
import { contactDisplayName } from "@/lib/crm/normalize";
import {
  parseSegmentFilter,
  segmentFilterSchema,
  type SegmentFilter,
} from "@/lib/crm/segments/filter-schema";
import { segmentFilterToWhere } from "@/lib/crm/segments/query-builder";

export async function listSegments() {
  return prisma.crmSegment.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  });
}

export async function getSegmentById(id: string) {
  return prisma.crmSegment.findUnique({
    where: { id },
    include: { createdBy: { select: { id: true, name: true } } },
  });
}

export async function createSegment(input: {
  name: string;
  description?: string | null;
  filter: SegmentFilter;
  createdById: string;
}) {
  return prisma.crmSegment.create({
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      filterJson: JSON.parse(JSON.stringify(input.filter)) as Prisma.InputJsonValue,
      filterVersion: input.filter.version,
      createdById: input.createdById,
    },
  });
}

export async function updateSegment(input: {
  id: string;
  name: string;
  description?: string | null;
  filter: SegmentFilter;
}) {
  return prisma.crmSegment.update({
    where: { id: input.id },
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      filterJson: JSON.parse(JSON.stringify(input.filter)) as Prisma.InputJsonValue,
      filterVersion: input.filter.version,
    },
  });
}

export async function deleteSegment(id: string) {
  return prisma.crmSegment.delete({ where: { id } });
}

export async function countSegmentMatches(filter: SegmentFilter) {
  const where = await segmentFilterToWhere(filter);
  return prisma.crmContact.count({ where });
}

export async function previewSegmentContacts(
  filter: SegmentFilter,
  page = 1,
  pageSize = 25,
) {
  const boundedPage = Math.max(1, page);
  const boundedSize = Math.min(pageSize, CRM_PAGE_SIZE_MAX);
  const where = await segmentFilterToWhere(filter);

  const [items, total] = await Promise.all([
    prisma.crmContact.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (boundedPage - 1) * boundedSize,
      take: boundedSize,
      include: {
        company: { select: { name: true } },
        leads: {
          where: { status: { notIn: ["UNQUALIFIED", "CLOSED"] } },
          take: 1,
        },
      },
    }),
    prisma.crmContact.count({ where }),
  ]);

  return { items, total, page: boundedPage, pageSize: boundedSize };
}

export async function listSegmentContactIds(
  filter: SegmentFilter,
  limit = 500,
) {
  const where = await segmentFilterToWhere(filter);
  const rows = await prisma.crmContact.findMany({
    where,
    select: { id: true },
    take: Math.min(limit, 500),
  });
  return rows.map((r) => r.id);
}

export async function exportSegmentCsv(segmentId: string) {
  const segment = await getSegmentById(segmentId);
  if (!segment) throw new Error("Segment not found.");

  const filter = parseSegmentFilter(segment.filterJson);
  const where = await segmentFilterToWhere(filter);
  const rows = await prisma.crmContact.findMany({
    where,
    take: 5000,
    include: { company: { select: { name: true } } },
  });

  const header = ["Name", "Email", "Company", "Lifecycle", "Email Status"].join(",");
  const lines = rows.map((r) =>
    [contactDisplayName(r), r.email ?? "", r.company?.name ?? "", r.lifecycleStage, r.emailStatus]
      .map((c) => escapeCrmCsvCell(String(c)))
      .join(","),
  );
  return [header, ...lines].join("\n");
}

export { segmentFilterSchema, parseSegmentFilter, segmentFilterToWhere };
