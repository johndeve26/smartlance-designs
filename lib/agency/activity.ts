import type { AgencyProjectActivityType, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AGENCY_ACTIVITY_DEFAULT } from "@/lib/agency/constants";

export type RecordAgencyProjectActivityInput = {
  projectId: string;
  type: AgencyProjectActivityType;
  summary: string;
  actorUserId?: string | null;
  actorPortalUserId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  clientVisible?: boolean;
};

export async function recordAgencyProjectActivity(
  input: RecordAgencyProjectActivityInput,
  db: Pick<PrismaClient, "agencyProjectActivity"> = prisma,
) {
  return db.agencyProjectActivity.create({
    data: {
      projectId: input.projectId,
      type: input.type,
      summary: input.summary.trim(),
      actorUserId: input.actorUserId ?? null,
      actorPortalUserId: input.actorPortalUserId ?? null,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      metadata: input.metadata ?? undefined,
      clientVisible: input.clientVisible ?? false,
    },
  });
}

export async function listProjectActivities(input: {
  projectId: string;
  page?: number;
  pageSize?: number;
  clientVisibleOnly?: boolean;
}) {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(input.pageSize ?? AGENCY_ACTIVITY_DEFAULT, 100);
  const where = {
    projectId: input.projectId,
    ...(input.clientVisibleOnly ? { clientVisible: true } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.agencyProjectActivity.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        actorUser: { select: { id: true, name: true } },
        actorPortalUser: { select: { id: true, email: true } },
      },
    }),
    prisma.agencyProjectActivity.count({ where }),
  ]);

  return { items, total, page, pageSize };
}
