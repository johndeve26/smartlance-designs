import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function recordBillingActivity(
  input: {
    invoiceId?: string;
    paymentId?: string;
    retainerId?: string;
    type: Prisma.AgencyBillingActivityCreateInput["type"];
    summary: string;
    actorUserId?: string;
    actorPortalUserId?: string;
    clientVisible?: boolean;
    metadata?: Prisma.InputJsonValue;
  },
  tx: Prisma.TransactionClient = prisma,
) {
  return tx.agencyBillingActivity.create({
    data: {
      invoiceId: input.invoiceId ?? null,
      paymentId: input.paymentId ?? null,
      retainerId: input.retainerId ?? null,
      type: input.type,
      summary: input.summary,
      actorUserId: input.actorUserId ?? null,
      actorPortalUserId: input.actorPortalUserId ?? null,
      clientVisible: input.clientVisible ?? false,
      metadata: input.metadata,
    },
  });
}
