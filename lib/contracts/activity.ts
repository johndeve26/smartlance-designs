import type { AgencyContractActivityType, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function recordContractActivity(
  input: {
    contractId: string;
    type: AgencyContractActivityType;
    summary: string;
    actorUserId?: string | null;
    actorPortalUserId?: string | null;
    entityType?: string | null;
    entityId?: string | null;
    metadata?: Prisma.InputJsonValue;
    clientVisible?: boolean;
  },
  db: Pick<PrismaClient, "agencyContractActivity"> = prisma,
) {
  return db.agencyContractActivity.create({
    data: {
      contractId: input.contractId,
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
