-- CRM V3 Inbound Email

ALTER TYPE "CrmActivityType" ADD VALUE IF NOT EXISTS 'EMAIL_RECEIVED';
ALTER TYPE "CrmEmailOrigin" ADD VALUE IF NOT EXISTS 'INBOUND_SYNC';
ALTER TYPE "CrmEmailDeliveryStatus" ADD VALUE IF NOT EXISTS 'RECEIVED';
ALTER TYPE "CrmSequenceStopReason" ADD VALUE IF NOT EXISTS 'REPLY_RECEIVED';
ALTER TYPE "CrmSequenceStopReason" ADD VALUE IF NOT EXISTS 'AUTOMATED_REPLY';

CREATE TYPE "CrmInboundReviewStatus" AS ENUM ('NEEDS_REVIEW', 'REVIEWED', 'IGNORED', 'AUTOMATED', 'UNMATCHED', 'MATCHED');
CREATE TYPE "CrmEmailMatchConfidence" AS ENUM ('EXACT_THREAD', 'EXACT_EMAIL', 'UNMATCHED');

CREATE TABLE "InboundEmailSettings" (
    "id" TEXT NOT NULL DEFAULT 'inbound',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "providerType" TEXT NOT NULL DEFAULT 'IMAP',
    "host" TEXT,
    "port" INTEGER,
    "securityMode" TEXT NOT NULL DEFAULT 'TLS',
    "username" TEXT,
    "passwordCiphertext" TEXT,
    "passwordIv" TEXT,
    "passwordTag" TEXT,
    "passwordLast4" TEXT,
    "mailboxFolder" TEXT NOT NULL DEFAULT 'INBOX',
    "crmReplyToEmail" TEXT,
    "syncEnabledAt" TIMESTAMP(3),
    "syncActorId" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "lastSuccessfulSyncAt" TIMESTAMP(3),
    "lastSyncErrorSafe" TEXT,
    "lastImportCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,
    CONSTRAINT "InboundEmailSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InboundMailboxState" (
    "id" TEXT NOT NULL DEFAULT 'primary',
    "mailboxKey" TEXT NOT NULL,
    "uidValidity" BIGINT,
    "lastSeenUid" BIGINT NOT NULL DEFAULT 0,
    "lastSyncedAt" TIMESTAMP(3),
    "lastErrorSafe" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InboundMailboxState_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrmEmailThread" (
    "id" TEXT NOT NULL,
    "contactId" TEXT,
    "leadId" TEXT,
    "dealId" TEXT,
    "subjectNormalized" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CrmEmailThread_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InboundMessageImport" (
    "id" TEXT NOT NULL,
    "mailboxKey" TEXT NOT NULL,
    "uidValidity" BIGINT NOT NULL,
    "mailboxUid" BIGINT NOT NULL,
    "internetMessageId" TEXT,
    "crmEmailId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "failureSafe" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InboundMessageImport_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CrmEmail" ALTER COLUMN "contactId" DROP NOT NULL;

ALTER TABLE "CrmEmail" ADD COLUMN IF NOT EXISTS "leadId" TEXT;
ALTER TABLE "CrmEmail" ADD COLUMN IF NOT EXISTS "threadId" TEXT;
ALTER TABLE "CrmEmail" ADD COLUMN IF NOT EXISTS "replyToOutboundId" TEXT;
ALTER TABLE "CrmEmail" ADD COLUMN IF NOT EXISTS "reviewStatus" "CrmInboundReviewStatus";
ALTER TABLE "CrmEmail" ADD COLUMN IF NOT EXISTS "matchConfidence" "CrmEmailMatchConfidence";
ALTER TABLE "CrmEmail" ADD COLUMN IF NOT EXISTS "internetMessageId" TEXT;
ALTER TABLE "CrmEmail" ADD COLUMN IF NOT EXISTS "inReplyToMessageId" TEXT;
ALTER TABLE "CrmEmail" ADD COLUMN IF NOT EXISTS "referencesHeader" TEXT;
ALTER TABLE "CrmEmail" ADD COLUMN IF NOT EXISTS "fromAddress" TEXT;
ALTER TABLE "CrmEmail" ADD COLUMN IF NOT EXISTS "toAddresses" JSONB;
ALTER TABLE "CrmEmail" ADD COLUMN IF NOT EXISTS "ccAddresses" JSONB;
ALTER TABLE "CrmEmail" ADD COLUMN IF NOT EXISTS "mailboxKey" TEXT;
ALTER TABLE "CrmEmail" ADD COLUMN IF NOT EXISTS "mailboxUid" BIGINT;
ALTER TABLE "CrmEmail" ADD COLUMN IF NOT EXISTS "mailboxUidValidity" BIGINT;
ALTER TABLE "CrmEmail" ADD COLUMN IF NOT EXISTS "isAutomated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CrmEmail" ADD COLUMN IF NOT EXISTS "bodyTruncated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CrmEmail" ADD COLUMN IF NOT EXISTS "attachmentMeta" JSONB;
ALTER TABLE "CrmEmail" ADD COLUMN IF NOT EXISTS "receivedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "CrmEmail_internetMessageId_key" ON "CrmEmail"("internetMessageId");
CREATE UNIQUE INDEX IF NOT EXISTS "CrmEmail_mailboxKey_mailboxUidValidity_mailboxUid_key" ON "CrmEmail"("mailboxKey", "mailboxUidValidity", "mailboxUid");
CREATE INDEX IF NOT EXISTS "CrmEmail_direction_receivedAt_idx" ON "CrmEmail"("direction", "receivedAt");
CREATE INDEX IF NOT EXISTS "CrmEmail_reviewStatus_receivedAt_idx" ON "CrmEmail"("reviewStatus", "receivedAt");
CREATE INDEX IF NOT EXISTS "CrmEmail_threadId_receivedAt_idx" ON "CrmEmail"("threadId", "receivedAt");
CREATE INDEX IF NOT EXISTS "CrmEmail_inReplyToMessageId_idx" ON "CrmEmail"("inReplyToMessageId");
CREATE INDEX IF NOT EXISTS "CrmEmail_leadId_idx" ON "CrmEmail"("leadId");

CREATE UNIQUE INDEX IF NOT EXISTS "InboundMailboxState_mailboxKey_key" ON "InboundMailboxState"("mailboxKey");
CREATE UNIQUE INDEX IF NOT EXISTS "InboundMessageImport_crmEmailId_key" ON "InboundMessageImport"("crmEmailId");
CREATE UNIQUE INDEX IF NOT EXISTS "InboundMessageImport_mailboxKey_uidValidity_mailboxUid_key" ON "InboundMessageImport"("mailboxKey", "uidValidity", "mailboxUid");
CREATE INDEX IF NOT EXISTS "InboundMessageImport_internetMessageId_idx" ON "InboundMessageImport"("internetMessageId");
CREATE INDEX IF NOT EXISTS "CrmEmailThread_contactId_lastMessageAt_idx" ON "CrmEmailThread"("contactId", "lastMessageAt");

ALTER TABLE "InboundEmailSettings" ADD CONSTRAINT "InboundEmailSettings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InboundEmailSettings" ADD CONSTRAINT "InboundEmailSettings_syncActorId_fkey" FOREIGN KEY ("syncActorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CrmEmailThread" ADD CONSTRAINT "CrmEmailThread_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmEmailThread" ADD CONSTRAINT "CrmEmailThread_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "CrmLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmEmailThread" ADD CONSTRAINT "CrmEmailThread_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "CrmDeal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InboundMessageImport" ADD CONSTRAINT "InboundMessageImport_crmEmailId_fkey" FOREIGN KEY ("crmEmailId") REFERENCES "CrmEmail"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CrmEmail" ADD CONSTRAINT "CrmEmail_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "CrmLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmEmail" ADD CONSTRAINT "CrmEmail_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "CrmEmailThread"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmEmail" ADD CONSTRAINT "CrmEmail_replyToOutboundId_fkey" FOREIGN KEY ("replyToOutboundId") REFERENCES "CrmEmail"("id") ON DELETE SET NULL ON UPDATE CASCADE;
