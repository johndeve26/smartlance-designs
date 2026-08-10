-- CreateEnum
CREATE TYPE "EmailTransportType" AS ENUM ('SYSTEM_SMTP', 'CUSTOM_SMTP');

-- CreateEnum
CREATE TYPE "EmailRouteCategory" AS ENUM (
  'AUTH_MAGIC_LINK',
  'PROSPECT_GENERAL',
  'PROSPECT_REQUEST',
  'PROSPECT_CLARIFICATION',
  'CRM_MANUAL',
  'CRM_SEQUENCE',
  'CRM_INBOUND_REPLY',
  'PROPOSAL',
  'CONTRACT',
  'PROJECT',
  'ONBOARDING',
  'CHANGE_REQUEST',
  'INVOICE',
  'PAYMENT_CONFIRMATION',
  'SUPPORT',
  'GENERAL_SYSTEM'
);

-- CreateEnum
CREATE TYPE "EmailProfileTestStatus" AS ENUM ('UNTESTED', 'PASSED', 'FAILED');

-- CreateTable
CREATE TABLE "EmailSendingProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "fromName" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "replyToName" TEXT,
    "replyToEmail" TEXT,
    "transportType" "EmailTransportType" NOT NULL DEFAULT 'SYSTEM_SMTP',
    "smtpHost" TEXT,
    "smtpPort" INTEGER,
    "smtpSecurityMode" TEXT DEFAULT 'STARTTLS',
    "smtpUsername" TEXT,
    "smtpPasswordCiphertext" TEXT,
    "smtpPasswordIv" TEXT,
    "smtpPasswordTag" TEXT,
    "smtpPasswordLast4" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "lastTestedAt" TIMESTAMP(3),
    "lastTestStatus" "EmailProfileTestStatus" NOT NULL DEFAULT 'UNTESTED',
    "lastTestErrorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "EmailSendingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailRoutingRule" (
    "id" TEXT NOT NULL,
    "category" "EmailRouteCategory" NOT NULL,
    "sendingProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "EmailRoutingRule_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "CrmEmail" ADD COLUMN "sendingProfileId" TEXT,
ADD COLUMN "fromNameSnapshot" TEXT,
ADD COLUMN "fromEmailSnapshot" TEXT,
ADD COLUMN "replyToSnapshot" TEXT,
ADD COLUMN "transportTypeSnapshot" "EmailTransportType";

-- CreateIndex
CREATE UNIQUE INDEX "EmailSendingProfile_slug_key" ON "EmailSendingProfile"("slug");

-- CreateIndex
CREATE INDEX "EmailSendingProfile_isActive_sortOrder_idx" ON "EmailSendingProfile"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "EmailSendingProfile_isDefault_idx" ON "EmailSendingProfile"("isDefault");

-- Partial unique: at most one default profile
CREATE UNIQUE INDEX "EmailSendingProfile_one_default" ON "EmailSendingProfile"((true)) WHERE "isDefault" = true;

-- CreateIndex
CREATE UNIQUE INDEX "EmailRoutingRule_category_key" ON "EmailRoutingRule"("category");

-- AddForeignKey
ALTER TABLE "EmailSendingProfile" ADD CONSTRAINT "EmailSendingProfile_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailSendingProfile" ADD CONSTRAINT "EmailSendingProfile_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailRoutingRule" ADD CONSTRAINT "EmailRoutingRule_sendingProfileId_fkey" FOREIGN KEY ("sendingProfileId") REFERENCES "EmailSendingProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailRoutingRule" ADD CONSTRAINT "EmailRoutingRule_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmEmail" ADD CONSTRAINT "CrmEmail_sendingProfileId_fkey" FOREIGN KEY ("sendingProfileId") REFERENCES "EmailSendingProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
