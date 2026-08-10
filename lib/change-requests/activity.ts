import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type Tx = Prisma.TransactionClient;

export async function recordChangeRequestActivity(
  input: {
    changeRequestId: string;
    type: Prisma.AgencyChangeRequestActivityCreateInput["type"];
    summary: string;
    actorUserId?: string | null;
    actorPortalUserId?: string | null;
    clientVisible?: boolean;
    metadata?: Prisma.InputJsonValue;
  },
  tx?: Tx,
) {
  const client = tx ?? prisma;
  return client.agencyChangeRequestActivity.create({
    data: {
      changeRequestId: input.changeRequestId,
      type: input.type as never,
      summary: input.summary,
      actorUserId: input.actorUserId ?? null,
      actorPortalUserId: input.actorPortalUserId ?? null,
      clientVisible: input.clientVisible ?? false,
      metadata: input.metadata ?? undefined,
    },
  });
}
