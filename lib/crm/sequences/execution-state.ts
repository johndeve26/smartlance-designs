import type { PrismaClient } from "@prisma/client";
import type { FailureCategory } from "@/lib/crm/sequences/failure-classification";

type Db = Pick<PrismaClient, "crmSequenceExecution" | "crmEmail">;

export async function claimExecution(
  db: Db,
  executionId: string,
  claimExpiresAt: Date,
) {
  return db.crmSequenceExecution.updateMany({
    where: { id: executionId, status: "PENDING" },
    data: {
      status: "PROCESSING",
      claimedAt: new Date(),
      claimExpiresAt,
    },
  });
}

export async function releaseClaimToPending(
  db: Db,
  executionId: string,
  input?: { scheduledAt?: Date; attemptCount?: number; failureCode?: string; failureCategory?: FailureCategory },
) {
  await db.crmSequenceExecution.update({
    where: { id: executionId },
    data: {
      status: "PENDING",
      claimedAt: null,
      claimExpiresAt: null,
      scheduledAt: input?.scheduledAt,
      attemptCount: input?.attemptCount,
      failureCode: input?.failureCode,
      failureCategory: input?.failureCategory,
    },
  });
}

export async function skipExecutionRecord(
  db: Db,
  executionId: string,
  reason: string,
  category: FailureCategory = "SKIPPED",
) {
  await db.crmSequenceExecution.update({
    where: { id: executionId },
    data: {
      status: "SKIPPED",
      skipReason: reason,
      failureCategory: category,
      executedAt: new Date(),
      claimedAt: null,
      claimExpiresAt: null,
    },
  });
}

export async function failExecutionRecord(
  db: Db,
  executionId: string,
  code: string,
  category: FailureCategory,
) {
  await db.crmSequenceExecution.update({
    where: { id: executionId },
    data: {
      status: "FAILED",
      failureCode: code,
      failureCategory: category,
      executedAt: new Date(),
      claimedAt: null,
      claimExpiresAt: null,
    },
  });
}

export async function markExecutionAmbiguous(
  db: Db,
  executionId: string,
  code: string,
) {
  await db.crmSequenceExecution.update({
    where: { id: executionId },
    data: {
      status: "AMBIGUOUS",
      failureCode: code,
      failureCategory: "AMBIGUOUS_DO_NOT_AUTO_RETRY",
      executedAt: new Date(),
      claimedAt: null,
      claimExpiresAt: null,
    },
  });
}

export async function completeExecutionRecord(
  db: Db,
  executionId: string,
  status: "SENT" | "COMPLETED" = "COMPLETED",
) {
  await db.crmSequenceExecution.update({
    where: { id: executionId },
    data: {
      status,
      executedAt: new Date(),
      claimedAt: null,
      claimExpiresAt: null,
    },
  });
}

export async function finalizeEmailSent(
  db: Db,
  input: {
    emailId: string;
    executionId: string;
    providerMessageId?: string | null;
    internetMessageId?: string | null;
    sentAt?: Date;
  },
) {
  const sentAt = input.sentAt ?? new Date();
  await db.crmEmail.update({
    where: { id: input.emailId },
    data: {
      deliveryStatus: "SENT",
      sentAt,
      providerMessageId: input.providerMessageId ?? null,
      internetMessageId: input.internetMessageId ?? null,
    },
  });
  await completeExecutionRecord(db, input.executionId, "SENT");
}

export async function finalizeEmailAmbiguous(
  db: Db,
  input: {
    emailId: string;
    executionId: string;
    providerMessageId?: string | null;
  },
) {
  await db.crmEmail.update({
    where: { id: input.emailId },
    data: {
      deliveryStatus: "SENT_UNCONFIRMED",
      providerMessageId: input.providerMessageId ?? null,
    },
  });
  await markExecutionAmbiguous(db, input.executionId, "POST_SEND_PERSISTENCE_FAILURE");
}

export async function createSendingEmailRecord(
  db: Db,
  input: {
    contactId: string;
    enrollmentId: string;
    executionId: string;
    subject: string;
    bodyText: string;
    createdById: string;
  },
) {
  return db.crmEmail.create({
    data: {
      contactId: input.contactId,
      enrollmentId: input.enrollmentId,
      executionId: input.executionId,
      origin: "SEQUENCE",
      subject: input.subject,
      bodyText: input.bodyText,
      deliveryStatus: "SENDING",
      createdById: input.createdById,
    },
  });
}
