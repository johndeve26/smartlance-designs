-- AI Content Assistants Phase A: proposals + runs (Service / Solution)

CREATE TYPE "AIContentEntityType" AS ENUM ('SERVICE', 'SOLUTION');
CREATE TYPE "AIContentProposalStatus" AS ENUM ('PENDING', 'PARTIALLY_ACCEPTED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'STALE');
CREATE TYPE "AIContentRunStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

CREATE TABLE "AIContentRun" (
    "id" TEXT NOT NULL,
    "entityType" "AIContentEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "promptVersion" TEXT,
    "inputFingerprint" TEXT,
    "status" "AIContentRunStatus" NOT NULL DEFAULT 'QUEUED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "tokenUsageInput" INTEGER,
    "tokenUsageOutput" INTEGER,
    "errorCode" TEXT,
    "errorSummary" TEXT,
    "resultSummary" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIContentRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AIContentProposal" (
    "id" TEXT NOT NULL,
    "entityType" "AIContentEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" "AIContentProposalStatus" NOT NULL DEFAULT 'PENDING',
    "payloadJson" JSONB NOT NULL,
    "currentSnapshotJson" JSONB NOT NULL,
    "entityUpdatedAt" TIMESTAMP(3) NOT NULL,
    "acceptedFieldsJson" JSONB,
    "rejectedFieldsJson" JSONB,
    "lockedFieldsJson" JSONB,
    "customInstructions" TEXT,
    "promptVersion" TEXT,
    "runId" TEXT,
    "createdById" TEXT,
    "acceptedById" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIContentProposal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AIContentRun_entityType_entityId_createdAt_idx" ON "AIContentRun"("entityType", "entityId", "createdAt");
CREATE INDEX "AIContentRun_status_idx" ON "AIContentRun"("status");
CREATE INDEX "AIContentRun_action_idx" ON "AIContentRun"("action");
CREATE INDEX "AIContentProposal_entityType_entityId_status_idx" ON "AIContentProposal"("entityType", "entityId", "status");
CREATE INDEX "AIContentProposal_createdAt_idx" ON "AIContentProposal"("createdAt");
CREATE INDEX "AIContentProposal_runId_idx" ON "AIContentProposal"("runId");

ALTER TABLE "AIContentRun" ADD CONSTRAINT "AIContentRun_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AIContentProposal" ADD CONSTRAINT "AIContentProposal_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AIContentRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AIContentProposal" ADD CONSTRAINT "AIContentProposal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AIContentProposal" ADD CONSTRAINT "AIContentProposal_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
