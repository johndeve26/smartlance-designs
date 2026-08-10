import type { PrismaClient } from "@prisma/client";
import { STALE_CLAIM_THRESHOLD_MS } from "@/lib/crm/sequences/constants";
import {
  markExecutionAmbiguous,
  releaseClaimToPending,
} from "@/lib/crm/sequences/execution-state";

type Db = Pick<PrismaClient, "crmSequenceExecution" | "crmEmail">;

export type StaleClaimRecoveryResult = {
  recovered: number;
  markedAmbiguous: number;
};

/**
 * Recover stale PROCESSING executions whose claim lease expired.
 * Does not reclaim while lease is still valid (worker may still be sending).
 */
export async function recoverStaleProcessingExecutions(
  db: Db,
  now: Date = new Date(),
): Promise<StaleClaimRecoveryResult> {
  const threshold = new Date(now.getTime() - STALE_CLAIM_THRESHOLD_MS);
  const stale = await db.crmSequenceExecution.findMany({
    where: {
      status: "PROCESSING",
      OR: [
        { claimExpiresAt: { lte: now } },
        {
          claimExpiresAt: null,
          claimedAt: { lte: threshold },
        },
      ],
    },
    include: { email: true },
    take: 50,
  });

  let recovered = 0;
  let markedAmbiguous = 0;

  for (const execution of stale) {
    const email = execution.email;
    if (
      email &&
      (email.deliveryStatus === "SENDING" || email.deliveryStatus === "SENT_UNCONFIRMED") &&
      email.providerMessageId
    ) {
      await db.crmEmail.update({
        where: { id: email.id },
        data: { deliveryStatus: "SENT_UNCONFIRMED" },
      });
      await markExecutionAmbiguous(db, execution.id, "POST_SEND_PERSISTENCE_FAILURE");
      markedAmbiguous++;
      continue;
    }

    if (email?.deliveryStatus === "SENT") {
      await db.crmSequenceExecution.update({
        where: { id: execution.id },
        data: {
          status: "SENT",
          executedAt: email.sentAt ?? now,
          claimedAt: null,
          claimExpiresAt: null,
        },
      });
      recovered++;
      continue;
    }

    await releaseClaimToPending(db, execution.id);
    recovered++;
  }

  return { recovered, markedAmbiguous };
}
