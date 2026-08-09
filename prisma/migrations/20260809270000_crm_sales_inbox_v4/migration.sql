-- CRM V4: Sales Inbox workflow on CrmEmailThread

CREATE TYPE "CrmTaskType" AS ENUM ('GENERAL', 'REPLY_REQUIRED', 'FOLLOW_UP');
CREATE TYPE "CrmThreadWorkflowStatus" AS ENUM ('NEEDS_REPLY', 'WAITING_ON_CONTACT', 'SNOOZED', 'CLOSED', 'NEEDS_REVIEW');

ALTER TYPE "CrmEmailOrigin" ADD VALUE IF NOT EXISTS 'THREAD_REPLY';
ALTER TYPE "CrmEmailDeliveryStatus" ADD VALUE IF NOT EXISTS 'DRAFT';

ALTER TABLE "CrmEmailThread" ADD COLUMN "snippet" VARCHAR(280);
ALTER TABLE "CrmEmailThread" ADD COLUMN "workflowStatus" "CrmThreadWorkflowStatus" NOT NULL DEFAULT 'CLOSED';
ALTER TABLE "CrmEmailThread" ADD COLUMN "assignedToId" TEXT;
ALTER TABLE "CrmEmailThread" ADD COLUMN "snoozedUntil" TIMESTAMP(3);
ALTER TABLE "CrmEmailThread" ADD COLUMN "closedAt" TIMESTAMP(3);
ALTER TABLE "CrmEmailThread" ADD COLUMN "lastInboundAt" TIMESTAMP(3);
ALTER TABLE "CrmEmailThread" ADD COLUMN "lastOutboundAt" TIMESTAMP(3);
ALTER TABLE "CrmEmailThread" ADD COLUMN "lastActivityAt" TIMESTAMP(3);
ALTER TABLE "CrmEmailThread" ADD COLUMN "needsReplySince" TIMESTAMP(3);

ALTER TABLE "CrmTask" ADD COLUMN "emailThreadId" TEXT;
ALTER TABLE "CrmTask" ADD COLUMN "taskType" "CrmTaskType" NOT NULL DEFAULT 'GENERAL';

ALTER TABLE "CrmEmail" ADD COLUMN "clientRequestId" TEXT;

CREATE TABLE "CrmEmailThreadUserState" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmEmailThreadUserState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CrmEmail_clientRequestId_key" ON "CrmEmail"("clientRequestId");
CREATE INDEX "CrmEmailThread_workflowStatus_lastActivityAt_idx" ON "CrmEmailThread"("workflowStatus", "lastActivityAt");
CREATE INDEX "CrmEmailThread_assignedToId_workflowStatus_lastActivityAt_idx" ON "CrmEmailThread"("assignedToId", "workflowStatus", "lastActivityAt");
CREATE INDEX "CrmEmailThread_snoozedUntil_idx" ON "CrmEmailThread"("snoozedUntil");
CREATE INDEX "CrmTask_emailThreadId_status_taskType_idx" ON "CrmTask"("emailThreadId", "status", "taskType");
CREATE UNIQUE INDEX "CrmEmailThreadUserState_threadId_userId_key" ON "CrmEmailThreadUserState"("threadId", "userId");
CREATE INDEX "CrmEmailThreadUserState_userId_lastReadAt_idx" ON "CrmEmailThreadUserState"("userId", "lastReadAt");

ALTER TABLE "CrmEmailThread" ADD CONSTRAINT "CrmEmailThread_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_emailThreadId_fkey" FOREIGN KEY ("emailThreadId") REFERENCES "CrmEmailThread"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmEmailThreadUserState" ADD CONSTRAINT "CrmEmailThreadUserState_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "CrmEmailThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmEmailThreadUserState" ADD CONSTRAINT "CrmEmailThreadUserState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Conservative backfill: derive workflow from latest human messages (90-day cutoff)
UPDATE "CrmEmailThread" t
SET
  "lastInboundAt" = stats.last_inbound,
  "lastOutboundAt" = stats.last_outbound,
  "lastActivityAt" = stats.last_activity,
  "lastMessageAt" = stats.last_activity,
  "workflowStatus" = CASE
    WHEN stats.last_activity IS NULL THEN 'CLOSED'::"CrmThreadWorkflowStatus"
    WHEN stats.last_activity < NOW() - INTERVAL '90 days' THEN 'CLOSED'::"CrmThreadWorkflowStatus"
    WHEN stats.last_inbound IS NOT NULL AND (stats.last_outbound IS NULL OR stats.last_inbound > stats.last_outbound)
      THEN 'NEEDS_REPLY'::"CrmThreadWorkflowStatus"
    WHEN stats.last_outbound IS NOT NULL THEN 'WAITING_ON_CONTACT'::"CrmThreadWorkflowStatus"
    ELSE 'CLOSED'::"CrmThreadWorkflowStatus"
  END,
  "needsReplySince" = CASE
    WHEN stats.last_activity >= NOW() - INTERVAL '90 days'
      AND stats.last_inbound IS NOT NULL
      AND (stats.last_outbound IS NULL OR stats.last_inbound > stats.last_outbound)
      THEN stats.last_inbound
    ELSE NULL
  END,
  "closedAt" = CASE
    WHEN stats.last_activity IS NULL OR stats.last_activity < NOW() - INTERVAL '90 days' THEN NOW()
    ELSE NULL
  END
FROM (
  SELECT
    e."threadId" AS thread_id,
    MAX(COALESCE(e."receivedAt", e."sentAt", e."createdAt")) AS last_activity,
    MAX(CASE WHEN e."direction" = 'INBOUND' AND e."isAutomated" = false THEN e."receivedAt" END) AS last_inbound,
    MAX(CASE
      WHEN e."direction" = 'OUTBOUND'
        AND e."origin" IN ('MANUAL', 'THREAD_REPLY')
        AND e."deliveryStatus" IN ('SENT', 'SENT_UNCONFIRMED')
      THEN e."sentAt"
    END) AS last_outbound
  FROM "CrmEmail" e
  WHERE e."threadId" IS NOT NULL
  GROUP BY e."threadId"
) stats
WHERE t."id" = stats.thread_id;
