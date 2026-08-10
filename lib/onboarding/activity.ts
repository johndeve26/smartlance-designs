import type { AgencyOnboardingActivityType, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function recordOnboardingActivity(
  input: {
    onboardingId: string;
    type: AgencyOnboardingActivityType;
    summary: string;
    actorUserId?: string | null;
    actorPortalUserId?: string | null;
    entityType?: string | null;
    entityId?: string | null;
    metadata?: Prisma.InputJsonValue;
    clientVisible?: boolean;
  },
  db: Pick<PrismaClient, "agencyOnboardingActivity"> = prisma,
) {
  return db.agencyOnboardingActivity.create({
    data: {
      onboardingId: input.onboardingId,
      type: input.type,
      summary: input.summary.slice(0, 500),
      actorUserId: input.actorUserId ?? null,
      actorPortalUserId: input.actorPortalUserId ?? null,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      metadata: input.metadata ?? undefined,
      clientVisible: input.clientVisible ?? false,
    },
  });
}
