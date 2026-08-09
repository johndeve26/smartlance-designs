-- CRM Scheduler V2.1 — reliability fields

ALTER TYPE "CrmEmailDeliveryStatus" ADD VALUE IF NOT EXISTS 'SENT_UNCONFIRMED';
ALTER TYPE "CrmSequenceExecutionStatus" ADD VALUE IF NOT EXISTS 'AMBIGUOUS';

ALTER TABLE "CrmSequenceExecution" ADD COLUMN IF NOT EXISTS "claimExpiresAt" TIMESTAMP(3);
ALTER TABLE "CrmSequenceExecution" ADD COLUMN IF NOT EXISTS "failureCategory" TEXT;
ALTER TABLE "CrmSequenceExecution" ADD COLUMN IF NOT EXISTS "createdTaskId" TEXT;

ALTER TABLE "CrmOutreachSettings" ADD COLUMN IF NOT EXISTS "outreachPaused" BOOLEAN NOT NULL DEFAULT false;
