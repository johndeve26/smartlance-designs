-- CRM Foundation V1

-- CreateEnum
CREATE TYPE "CrmContactLifecycleStage" AS ENUM ('PROSPECT', 'LEAD', 'OPPORTUNITY', 'CLIENT', 'PAST_CLIENT', 'OTHER');
CREATE TYPE "CrmContactSource" AS ENUM ('MANUAL', 'CONTACT_FORM', 'WEBSITE_REVIEW', 'PROJECT_PLANNER', 'REFERRAL', 'INBOUND_EMAIL', 'OUTBOUND', 'UPWORK', 'SOCIAL', 'OTHER');
CREATE TYPE "CrmContactEmailStatus" AS ENUM ('SENDABLE', 'DO_NOT_EMAIL', 'UNSUBSCRIBED', 'BOUNCED', 'COMPLAINED', 'INVALID', 'SUPPRESSED');
CREATE TYPE "CrmLeadStatus" AS ENUM ('NEW', 'ATTEMPTING', 'CONNECTED', 'QUALIFIED', 'UNQUALIFIED', 'BAD_TIMING', 'CLOSED');
CREATE TYPE "CrmLeadTemperature" AS ENUM ('COLD', 'WARM', 'HOT');
CREATE TYPE "CrmLeadDisqualificationReason" AS ENUM ('NO_BUDGET', 'NOT_A_FIT', 'NO_RESPONSE', 'BAD_TIMING', 'DUPLICATE', 'SPAM', 'OTHER');
CREATE TYPE "CrmDealStage" AS ENUM ('NEW_OPPORTUNITY', 'DISCOVERY', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST');
CREATE TYPE "CrmDealLostReason" AS ENUM ('PRICE', 'NO_RESPONSE', 'COMPETITOR', 'TIMING', 'INTERNAL_DECISION', 'NOT_A_FIT', 'OTHER');
CREATE TYPE "CrmActivityType" AS ENUM ('CONTACT_CREATED', 'LEAD_CREATED', 'STATUS_CHANGED', 'TEMPERATURE_CHANGED', 'EMAIL_SENT', 'CALL', 'MEETING', 'NOTE', 'TASK_CREATED', 'TASK_COMPLETED', 'FORM_SUBMISSION', 'PROPOSAL_SENT', 'DEAL_CREATED', 'DEAL_STAGE_CHANGED', 'DEAL_WON', 'DEAL_LOST', 'LIFECYCLE_CHANGED', 'EMAIL_STATUS_CHANGED');
CREATE TYPE "CrmTaskStatus" AS ENUM ('OPEN', 'COMPLETED', 'CANCELLED');
CREATE TYPE "CrmTaskPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH');
CREATE TYPE "CrmEmailDirection" AS ENUM ('OUTBOUND', 'INBOUND');
CREATE TYPE "CrmEmailDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "CrmCompany" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "domain" TEXT,
    "industry" TEXT,
    "phone" TEXT,
    "location" TEXT,
    "address" TEXT,
    "sizeLabel" TEXT,
    "description" TEXT,
    "ownerId" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmCompany_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrmContact" (
    "id" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "displayName" TEXT,
    "email" TEXT,
    "emailNormalized" TEXT,
    "phone" TEXT,
    "jobTitle" TEXT,
    "companyId" TEXT,
    "lifecycleStage" "CrmContactLifecycleStage" NOT NULL DEFAULT 'PROSPECT',
    "source" "CrmContactSource" NOT NULL DEFAULT 'MANUAL',
    "sourceDetail" TEXT,
    "sourceUrl" TEXT,
    "ownerId" TEXT,
    "emailStatus" "CrmContactEmailStatus" NOT NULL DEFAULT 'SENDABLE',
    "lastContactedAt" TIMESTAMP(3),
    "nextActivityAt" TIMESTAMP(3),
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "CrmContact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrmLead" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "companyId" TEXT,
    "status" "CrmLeadStatus" NOT NULL DEFAULT 'NEW',
    "temperature" "CrmLeadTemperature" NOT NULL DEFAULT 'COLD',
    "source" "CrmContactSource" NOT NULL DEFAULT 'MANUAL',
    "ownerId" TEXT,
    "interestSummary" TEXT,
    "servicesInterested" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "estimatedValue" DECIMAL(12,2),
    "currency" TEXT DEFAULT 'USD',
    "nextFollowUpAt" TIMESTAMP(3),
    "qualifiedAt" TIMESTAMP(3),
    "disqualifiedAt" TIMESTAMP(3),
    "disqualificationReason" "CrmLeadDisqualificationReason",
    "disqualificationNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmLead_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrmDeal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "companyId" TEXT,
    "leadId" TEXT,
    "ownerId" TEXT,
    "stage" "CrmDealStage" NOT NULL DEFAULT 'NEW_OPPORTUNITY',
    "amount" DECIMAL(12,2),
    "currency" TEXT DEFAULT 'USD',
    "probability" INTEGER,
    "expectedCloseAt" TIMESTAMP(3),
    "servicesInterested" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "proposalSentAt" TIMESTAMP(3),
    "wonAt" TIMESTAMP(3),
    "lostAt" TIMESTAMP(3),
    "lostReason" "CrmDealLostReason",
    "lostNote" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmDeal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrmActivity" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "companyId" TEXT,
    "leadId" TEXT,
    "dealId" TEXT,
    "type" "CrmActivityType" NOT NULL,
    "subject" TEXT,
    "body" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrmActivity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrmTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "contactId" TEXT,
    "companyId" TEXT,
    "leadId" TEXT,
    "dealId" TEXT,
    "assignedToId" TEXT,
    "priority" "CrmTaskPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "CrmTaskStatus" NOT NULL DEFAULT 'OPEN',
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrmEmail" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "dealId" TEXT,
    "direction" "CrmEmailDirection" NOT NULL DEFAULT 'OUTBOUND',
    "subject" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "bodyHtml" TEXT,
    "deliveryStatus" "CrmEmailDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "providerMessageId" TEXT,
    "sentAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "safeFailureCode" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrmEmail_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrmEmailTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmEmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CrmContact_emailNormalized_key" ON "CrmContact"("emailNormalized");
CREATE INDEX "CrmCompany_name_idx" ON "CrmCompany"("name");
CREATE INDEX "CrmCompany_domain_idx" ON "CrmCompany"("domain");
CREATE INDEX "CrmCompany_ownerId_idx" ON "CrmCompany"("ownerId");
CREATE INDEX "CrmCompany_isArchived_updatedAt_idx" ON "CrmCompany"("isArchived", "updatedAt");
CREATE INDEX "CrmContact_companyId_idx" ON "CrmContact"("companyId");
CREATE INDEX "CrmContact_lifecycleStage_idx" ON "CrmContact"("lifecycleStage");
CREATE INDEX "CrmContact_source_idx" ON "CrmContact"("source");
CREATE INDEX "CrmContact_ownerId_idx" ON "CrmContact"("ownerId");
CREATE INDEX "CrmContact_emailStatus_idx" ON "CrmContact"("emailStatus");
CREATE INDEX "CrmContact_isArchived_updatedAt_idx" ON "CrmContact"("isArchived", "updatedAt");
CREATE INDEX "CrmContact_nextActivityAt_idx" ON "CrmContact"("nextActivityAt");
CREATE INDEX "CrmLead_contactId_status_idx" ON "CrmLead"("contactId", "status");
CREATE INDEX "CrmLead_status_idx" ON "CrmLead"("status");
CREATE INDEX "CrmLead_temperature_idx" ON "CrmLead"("temperature");
CREATE INDEX "CrmLead_ownerId_idx" ON "CrmLead"("ownerId");
CREATE INDEX "CrmLead_source_idx" ON "CrmLead"("source");
CREATE INDEX "CrmLead_nextFollowUpAt_idx" ON "CrmLead"("nextFollowUpAt");
CREATE INDEX "CrmDeal_contactId_idx" ON "CrmDeal"("contactId");
CREATE INDEX "CrmDeal_companyId_idx" ON "CrmDeal"("companyId");
CREATE INDEX "CrmDeal_leadId_idx" ON "CrmDeal"("leadId");
CREATE INDEX "CrmDeal_stage_idx" ON "CrmDeal"("stage");
CREATE INDEX "CrmDeal_ownerId_idx" ON "CrmDeal"("ownerId");
CREATE INDEX "CrmDeal_isArchived_updatedAt_idx" ON "CrmDeal"("isArchived", "updatedAt");
CREATE INDEX "CrmDeal_expectedCloseAt_idx" ON "CrmDeal"("expectedCloseAt");
CREATE INDEX "CrmActivity_contactId_occurredAt_idx" ON "CrmActivity"("contactId", "occurredAt");
CREATE INDEX "CrmActivity_companyId_occurredAt_idx" ON "CrmActivity"("companyId", "occurredAt");
CREATE INDEX "CrmActivity_leadId_occurredAt_idx" ON "CrmActivity"("leadId", "occurredAt");
CREATE INDEX "CrmActivity_dealId_occurredAt_idx" ON "CrmActivity"("dealId", "occurredAt");
CREATE INDEX "CrmActivity_type_occurredAt_idx" ON "CrmActivity"("type", "occurredAt");
CREATE INDEX "CrmTask_status_dueAt_idx" ON "CrmTask"("status", "dueAt");
CREATE INDEX "CrmTask_assignedToId_status_dueAt_idx" ON "CrmTask"("assignedToId", "status", "dueAt");
CREATE INDEX "CrmTask_contactId_idx" ON "CrmTask"("contactId");
CREATE INDEX "CrmTask_leadId_idx" ON "CrmTask"("leadId");
CREATE INDEX "CrmTask_dealId_idx" ON "CrmTask"("dealId");
CREATE INDEX "CrmEmail_contactId_createdAt_idx" ON "CrmEmail"("contactId", "createdAt");
CREATE INDEX "CrmEmail_dealId_idx" ON "CrmEmail"("dealId");
CREATE INDEX "CrmEmailTemplate_isActive_name_idx" ON "CrmEmailTemplate"("isActive", "name");

-- AddForeignKey
ALTER TABLE "CrmCompany" ADD CONSTRAINT "CrmCompany_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmContact" ADD CONSTRAINT "CrmContact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CrmCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmContact" ADD CONSTRAINT "CrmContact_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmContact" ADD CONSTRAINT "CrmContact_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmLead" ADD CONSTRAINT "CrmLead_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmLead" ADD CONSTRAINT "CrmLead_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CrmCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmLead" ADD CONSTRAINT "CrmLead_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmDeal" ADD CONSTRAINT "CrmDeal_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmDeal" ADD CONSTRAINT "CrmDeal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CrmCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmDeal" ADD CONSTRAINT "CrmDeal_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "CrmLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmDeal" ADD CONSTRAINT "CrmDeal_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CrmCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "CrmLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "CrmDeal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CrmCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "CrmLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "CrmDeal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CrmEmail" ADD CONSTRAINT "CrmEmail_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmEmail" ADD CONSTRAINT "CrmEmail_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "CrmDeal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmEmail" ADD CONSTRAINT "CrmEmail_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CrmEmailTemplate" ADD CONSTRAINT "CrmEmailTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CrmEmailTemplate" ADD CONSTRAINT "CrmEmailTemplate_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
