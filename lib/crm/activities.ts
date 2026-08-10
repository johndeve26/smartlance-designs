import type { CrmActivityType, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";

export type RecordCrmActivityInput = {
  contactId: string;
  companyId?: string | null;
  leadId?: string | null;
  dealId?: string | null;
  type: CrmActivityType;
  subject?: string | null;
  body?: string | null;
  metadata?: Prisma.InputJsonValue;
  occurredAt?: Date;
  createdById?: string | null;
};

export async function recordCrmActivity(
  input: RecordCrmActivityInput,
  db: Pick<PrismaClient, "crmActivity"> = prisma,
) {
  return db.crmActivity.create({
    data: {
      contactId: input.contactId,
      companyId: input.companyId ?? null,
      leadId: input.leadId ?? null,
      dealId: input.dealId ?? null,
      type: input.type,
      subject: input.subject?.trim() || null,
      body: input.body?.trim() || null,
      metadata: input.metadata ?? undefined,
      occurredAt: input.occurredAt ?? new Date(),
      createdById: input.createdById ?? null,
    },
  });
}

export async function listContactActivities(input: {
  contactId: string;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(input.pageSize ?? 20, 100);

  const [items, total] = await Promise.all([
    prisma.crmActivity.findMany({
      where: { contactId: input.contactId },
      orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    }),
    prisma.crmActivity.count({ where: { contactId: input.contactId } }),
  ]);

  return { items, total, page, pageSize };
}

export async function listRecentActivities(limit = 20) {
  return prisma.crmActivity.findMany({
    orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
    take: Math.min(limit, 50),
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
      createdBy: { select: { id: true, name: true } },
    },
  });
}

/** Activity types that update lastContactedAt on the contact. */
export const LAST_CONTACTED_ACTIVITY_TYPES: CrmActivityType[] = [
  "EMAIL_SENT",
  "CALL",
  "MEETING",
];

export async function touchLastContactedAt(contactId: string, at = new Date()) {
  await prisma.crmContact.update({
    where: { id: contactId },
    data: { lastContactedAt: at },
  });
}
