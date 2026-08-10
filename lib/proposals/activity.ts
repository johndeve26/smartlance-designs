import type { AgencyProposalActivityType, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";

export type RecordProposalActivityInput = {
  proposalId: string;
  type: AgencyProposalActivityType;
  summary: string;
  actorUserId?: string | null;
  actorPortalUserId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  clientVisible?: boolean;
};

export async function recordProposalActivity(
  input: RecordProposalActivityInput,
  db: Pick<PrismaClient, "agencyProposalActivity"> = prisma,
) {
  return db.agencyProposalActivity.create({
    data: {
      proposalId: input.proposalId,
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
