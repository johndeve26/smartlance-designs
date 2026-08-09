-- CRM Outreach V2

-- Extend enums
ALTER TYPE "CrmActivityType" ADD VALUE IF NOT EXISTS 'SEQUENCE_ENROLLED';
ALTER TYPE "CrmActivityType" ADD VALUE IF NOT EXISTS 'SEQUENCE_PAUSED';
ALTER TYPE "CrmActivityType" ADD VALUE IF NOT EXISTS 'SEQUENCE_COMPLETED';
ALTER TYPE "CrmActivityType" ADD VALUE IF NOT EXISTS 'SEQUENCE_STOPPED';
ALTER TYPE "CrmActivityType" ADD VALUE IF NOT EXISTS 'MANUAL_REPLY_RECORDED';

ALTER TYPE "CrmEmailDeliveryStatus" ADD VALUE IF NOT EXISTS 'QUEUED';
ALTER TYPE "CrmEmailDeliveryStatus" ADD VALUE IF NOT EXISTS 'SENDING';
ALTER TYPE "CrmEmailDeliveryStatus" ADD VALUE IF NOT EXISTS 'SKIPPED';

CREATE TYPE "CrmEmailOrigin" AS ENUM ('MANUAL', 'SEQUENCE');
CREATE TYPE "CrmSequenceStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');
CREATE TYPE "CrmSequenceStepType" AS ENUM ('EMAIL', 'TASK', 'WAIT');
CREATE TYPE "CrmSequenceTaskAdvanceMode" AS ENUM ('AUTO_CONTINUE', 'WAIT_FOR_TASK_COMPLETION');
CREATE TYPE "CrmSequenceEnrollmentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'STOPPED', 'FAILED');
CREATE TYPE "CrmSequenceStopReason" AS ENUM ('SUPPRESSED', 'ARCHIVED', 'LEAD_DISQUALIFIED', 'DEAL_WON', 'MANUAL', 'OPT_OUT', 'MANUAL_REPLY', 'OUTREACH_PAUSED', 'ERROR');
CREATE TYPE "CrmSequenceExecutionStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'COMPLETED', 'FAILED', 'SKIPPED');

-- CrmContact outreach fields
ALTER TABLE "CrmContact" ADD COLUMN "outreachPaused" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CrmContact" ADD COLUMN "outreachPausedAt" TIMESTAMP(3);
ALTER TABLE "CrmContact" ADD COLUMN "manualRepliedAt" TIMESTAMP(3);

-- CrmEmail extensions
ALTER TABLE "CrmEmail" ADD COLUMN "enrollmentId" TEXT;
ALTER TABLE "CrmEmail" ADD COLUMN "executionId" TEXT;
ALTER TABLE "CrmEmail" ADD COLUMN "origin" "CrmEmailOrigin" NOT NULL DEFAULT 'MANUAL';

CREATE UNIQUE INDEX "CrmEmail_executionId_key" ON "CrmEmail"("executionId");
CREATE INDEX "CrmEmail_enrollmentId_idx" ON "CrmEmail"("enrollmentId");
CREATE INDEX "CrmEmail_origin_createdAt_idx" ON "CrmEmail"("origin", "createdAt");

-- New tables
CREATE TABLE "CrmSegment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "filterJson" JSONB NOT NULL,
    "filterVersion" INTEGER NOT NULL DEFAULT 1,
    "isDynamic" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CrmSegment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrmSequence" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "CrmSequenceStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CrmSequence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrmSequenceStep" (
    "id" TEXT NOT NULL,
    "sequenceId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "type" "CrmSequenceStepType" NOT NULL,
    "delayDays" INTEGER NOT NULL DEFAULT 0,
    "delayMinutes" INTEGER NOT NULL DEFAULT 0,
    "emailTemplateId" TEXT,
    "subject" TEXT,
    "body" TEXT,
    "taskTitle" TEXT,
    "taskDescription" TEXT,
    "taskAdvanceMode" "CrmSequenceTaskAdvanceMode" NOT NULL DEFAULT 'AUTO_CONTINUE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CrmSequenceStep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrmSequenceEnrollment" (
    "id" TEXT NOT NULL,
    "sequenceId" TEXT NOT NULL,
    "sequenceVersion" INTEGER NOT NULL,
    "contactId" TEXT NOT NULL,
    "leadId" TEXT,
    "status" "CrmSequenceEnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "nextRunAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pausedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "stoppedAt" TIMESTAMP(3),
    "stopReason" "CrmSequenceStopReason",
    "stopNote" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CrmSequenceEnrollment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrmSequenceExecution" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "status" "CrmSequenceExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "claimedAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "failureCode" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "skipReason" TEXT,
    "subjectSnap" TEXT,
    "bodySnap" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CrmSequenceExecution_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrmOutreachSettings" (
    "id" TEXT NOT NULL DEFAULT 'outreach',
    "maxDailySequenceEmails" INTEGER NOT NULL DEFAULT 50,
    "minContactEmailGapHours" INTEGER NOT NULL DEFAULT 24,
    "minStepDelayMinutes" INTEGER NOT NULL DEFAULT 60,
    "sendWeekdaysOnly" BOOLEAN NOT NULL DEFAULT true,
    "sendWindowStartUtc" INTEGER NOT NULL DEFAULT 8,
    "sendWindowEndUtc" INTEGER NOT NULL DEFAULT 18,
    "outreachFooter" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CrmOutreachSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrmOutreachOptOut" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),
    CONSTRAINT "CrmOutreachOptOut_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CrmSequenceStep_sequenceId_position_key" ON "CrmSequenceStep"("sequenceId", "position");
CREATE INDEX "CrmSequenceStep_sequenceId_idx" ON "CrmSequenceStep"("sequenceId");
CREATE INDEX "CrmSegment_updatedAt_idx" ON "CrmSegment"("updatedAt");
CREATE INDEX "CrmSegment_createdById_idx" ON "CrmSegment"("createdById");
CREATE INDEX "CrmSequence_status_updatedAt_idx" ON "CrmSequence"("status", "updatedAt");
CREATE INDEX "CrmSequenceEnrollment_status_nextRunAt_idx" ON "CrmSequenceEnrollment"("status", "nextRunAt");
CREATE INDEX "CrmSequenceEnrollment_contactId_idx" ON "CrmSequenceEnrollment"("contactId");
CREATE INDEX "CrmSequenceEnrollment_sequenceId_status_idx" ON "CrmSequenceEnrollment"("sequenceId", "status");
CREATE UNIQUE INDEX "CrmSequenceExecution_enrollmentId_stepId_key" ON "CrmSequenceExecution"("enrollmentId", "stepId");
CREATE INDEX "CrmSequenceExecution_status_scheduledAt_idx" ON "CrmSequenceExecution"("status", "scheduledAt");
CREATE INDEX "CrmSequenceExecution_enrollmentId_idx" ON "CrmSequenceExecution"("enrollmentId");
CREATE UNIQUE INDEX "CrmOutreachOptOut_contactId_key" ON "CrmOutreachOptOut"("contactId");
CREATE UNIQUE INDEX "CrmOutreachOptOut_tokenHash_key" ON "CrmOutreachOptOut"("tokenHash");

INSERT INTO "CrmOutreachSettings" ("id", "updatedAt") VALUES ('outreach', CURRENT_TIMESTAMP);

-- Foreign keys
ALTER TABLE "CrmSegment" ADD CONSTRAINT "CrmSegment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CrmSequence" ADD CONSTRAINT "CrmSequence_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CrmSequence" ADD CONSTRAINT "CrmSequence_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmSequenceStep" ADD CONSTRAINT "CrmSequenceStep_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "CrmSequence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmSequenceStep" ADD CONSTRAINT "CrmSequenceStep_emailTemplateId_fkey" FOREIGN KEY ("emailTemplateId") REFERENCES "CrmEmailTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmSequenceEnrollment" ADD CONSTRAINT "CrmSequenceEnrollment_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "CrmSequence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmSequenceEnrollment" ADD CONSTRAINT "CrmSequenceEnrollment_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmSequenceEnrollment" ADD CONSTRAINT "CrmSequenceEnrollment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "CrmLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmSequenceEnrollment" ADD CONSTRAINT "CrmSequenceEnrollment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CrmSequenceExecution" ADD CONSTRAINT "CrmSequenceExecution_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "CrmSequenceEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmSequenceExecution" ADD CONSTRAINT "CrmSequenceExecution_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "CrmSequenceStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmEmail" ADD CONSTRAINT "CrmEmail_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "CrmSequenceEnrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmEmail" ADD CONSTRAINT "CrmEmail_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "CrmSequenceExecution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmOutreachOptOut" ADD CONSTRAINT "CrmOutreachOptOut_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
