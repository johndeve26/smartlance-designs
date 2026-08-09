-- CRM V3.2 Email Engagement Tracking

CREATE TYPE "CrmEmailEngagementEventType" AS ENUM ('OPEN_DETECTED', 'LINK_CLICKED');
CREATE TYPE "CrmEngagementClassification" AS ENUM ('UNKNOWN', 'LIKELY_HUMAN', 'POSSIBLE_AUTOMATED');

ALTER TABLE "CrmEmail" ADD COLUMN "openTrackingEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CrmEmail" ADD COLUMN "clickTrackingEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CrmEmail" ADD COLUMN "openTokenHash" TEXT;
ALTER TABLE "CrmEmail" ADD COLUMN "firstOpenDetectedAt" TIMESTAMP(3);
ALTER TABLE "CrmEmail" ADD COLUMN "lastOpenDetectedAt" TIMESTAMP(3);
ALTER TABLE "CrmEmail" ADD COLUMN "openDetectedCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "CrmEmail" ADD COLUMN "firstClickDetectedAt" TIMESTAMP(3);
ALTER TABLE "CrmEmail" ADD COLUMN "lastClickDetectedAt" TIMESTAMP(3);
ALTER TABLE "CrmEmail" ADD COLUMN "clickDetectedCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "CrmEmail" ADD COLUMN "likelyHumanClickCount" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "CrmEmail_openTokenHash_key" ON "CrmEmail"("openTokenHash");
CREATE INDEX "CrmEmail_contactId_firstOpenDetectedAt_idx" ON "CrmEmail"("contactId", "firstOpenDetectedAt");
CREATE INDEX "CrmEmail_contactId_firstClickDetectedAt_idx" ON "CrmEmail"("contactId", "firstClickDetectedAt");

CREATE TABLE "CrmTrackedLink" (
    "id" TEXT NOT NULL,
    "crmEmailId" TEXT NOT NULL,
    "destinationUrl" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "label" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "firstClickAt" TIMESTAMP(3),
    "lastClickAt" TIMESTAMP(3),
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CrmTrackedLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CrmTrackedLink_tokenHash_key" ON "CrmTrackedLink"("tokenHash");
CREATE INDEX "CrmTrackedLink_crmEmailId_idx" ON "CrmTrackedLink"("crmEmailId");

CREATE TABLE "CrmEmailEngagementEvent" (
    "id" TEXT NOT NULL,
    "crmEmailId" TEXT NOT NULL,
    "trackedLinkId" TEXT,
    "type" "CrmEmailEngagementEventType" NOT NULL,
    "classification" "CrmEngagementClassification" NOT NULL DEFAULT 'UNKNOWN',
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgentHash" TEXT,
    "ipHash" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CrmEmailEngagementEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CrmEmailEngagementEvent_crmEmailId_occurredAt_idx" ON "CrmEmailEngagementEvent"("crmEmailId", "occurredAt");
CREATE INDEX "CrmEmailEngagementEvent_type_occurredAt_idx" ON "CrmEmailEngagementEvent"("type", "occurredAt");
CREATE INDEX "CrmEmailEngagementEvent_trackedLinkId_occurredAt_idx" ON "CrmEmailEngagementEvent"("trackedLinkId", "occurredAt");

ALTER TABLE "CrmOutreachSettings" ADD COLUMN "trackEmailOpens" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CrmOutreachSettings" ADD COLUMN "trackEmailClicks" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "CrmOutreachSettings" ADD COLUMN "engagementTrackingUpdatedAt" TIMESTAMP(3);

ALTER TABLE "CrmTrackedLink" ADD CONSTRAINT "CrmTrackedLink_crmEmailId_fkey" FOREIGN KEY ("crmEmailId") REFERENCES "CrmEmail"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmEmailEngagementEvent" ADD CONSTRAINT "CrmEmailEngagementEvent_crmEmailId_fkey" FOREIGN KEY ("crmEmailId") REFERENCES "CrmEmail"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmEmailEngagementEvent" ADD CONSTRAINT "CrmEmailEngagementEvent_trackedLinkId_fkey" FOREIGN KEY ("trackedLinkId") REFERENCES "CrmTrackedLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TYPE "CrmActivityType" ADD VALUE 'EMAIL_OPEN_DETECTED';
ALTER TYPE "CrmActivityType" ADD VALUE 'EMAIL_LINK_CLICKED';
