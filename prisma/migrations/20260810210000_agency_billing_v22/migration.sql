-- Agency Operations V2.2 — Billing

-- CreateEnum
CREATE TYPE "AgencyInvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'VOID', 'WRITTEN_OFF');
CREATE TYPE "AgencyInvoiceSource" AS ENUM ('MANUAL', 'PROPOSAL_ACCEPTANCE', 'CONTRACT', 'PROJECT', 'RETAINER', 'SCHEDULE');
CREATE TYPE "AgencyPaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'NEEDS_REVIEW');
CREATE TYPE "AgencyPaymentMethod" AS ENUM ('CARD', 'BANK_TRANSFER', 'ONLINE_TRANSFER', 'CASH', 'OTHER');
CREATE TYPE "AgencyPaymentProvider" AS ENUM ('MANUAL', 'PAYSTACK');
CREATE TYPE "AgencyPaymentSource" AS ENUM ('PORTAL', 'ADMIN_MANUAL', 'WEBHOOK', 'VERIFY');
CREATE TYPE "AgencyBillingScheduleStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE "AgencyBillingInstallmentType" AS ENUM ('DEPOSIT', 'MILESTONE', 'FINAL', 'OTHER');
CREATE TYPE "AgencyBillingInstallmentStatus" AS ENUM ('PENDING', 'INVOICED', 'PAID');
CREATE TYPE "AgencyRetainerStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ENDED', 'CANCELLED');
CREATE TYPE "AgencyRetainerInterval" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY');
CREATE TYPE "AgencyRetainerIssueMode" AS ENUM ('CREATE_DRAFT', 'AUTO_ISSUE');
CREATE TYPE "AgencyBillingClientAccessRole" AS ENUM ('BILLING_ADMIN', 'VIEWER');
CREATE TYPE "AgencyBillingActivityType" AS ENUM ('INVOICE_CREATED', 'INVOICE_ISSUED', 'INVOICE_VIEWED', 'INVOICE_VOIDED', 'INVOICE_WRITTEN_OFF', 'PAYMENT_INITIATED', 'PAYMENT_RECEIVED', 'PAYMENT_PARTIAL', 'INVOICE_PAID', 'MANUAL_PAYMENT_RECORDED', 'PAYMENT_ANOMALY', 'RETAINER_INVOICE_GENERATED', 'REMINDER_SENT');
CREATE TYPE "AgencyPaymentWebhookStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED', 'IGNORED');

-- CreateTable
CREATE TABLE "AgencyBillingSettings" (
    "id" TEXT NOT NULL DEFAULT 'agency-billing',
    "defaultCurrency" TEXT NOT NULL DEFAULT 'USD',
    "defaultPaymentTermsDays" INTEGER NOT NULL DEFAULT 14,
    "businessLegalName" TEXT,
    "billingEmail" TEXT,
    "billingAddressJson" JSONB,
    "taxLabel" TEXT,
    "taxRateBasisPoints" INTEGER,
    "paymentInstructions" TEXT,
    "retainerDefaultIssueMode" "AgencyRetainerIssueMode" NOT NULL DEFAULT 'CREATE_DRAFT',
    "paystackEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyBillingSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyBillingProfile" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "contactId" TEXT,
    "legalName" TEXT NOT NULL,
    "billingEmail" TEXT NOT NULL,
    "billingPhone" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "stateRegion" TEXT,
    "postalCode" TEXT,
    "countryCode" TEXT,
    "taxIdentifier" TEXT,
    "taxLabel" TEXT,
    "defaultCurrency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyBillingProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyInvoiceCounter" (
    "year" INTEGER NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyInvoiceCounter_pkey" PRIMARY KEY ("year")
);

CREATE TABLE "AgencyPaymentCounter" (
    "year" INTEGER NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyPaymentCounter_pkey" PRIMARY KEY ("year")
);

CREATE TABLE "AgencyBillingSchedule" (
    "id" TEXT NOT NULL,
    "proposalAcceptanceId" TEXT,
    "contractId" TEXT,
    "projectId" TEXT,
    "currency" TEXT NOT NULL,
    "totalScheduledMinor" INTEGER NOT NULL,
    "status" "AgencyBillingScheduleStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyBillingSchedule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyBillingInstallment" (
    "id" TEXT NOT NULL,
    "billingScheduleId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "type" "AgencyBillingInstallmentType" NOT NULL DEFAULT 'OTHER',
    "amountMinor" INTEGER NOT NULL,
    "percentageBasisPoints" INTEGER,
    "milestoneId" TEXT,
    "dueDate" TIMESTAMP(3),
    "dueDaysOffset" INTEGER,
    "invoiceId" TEXT,
    "status" "AgencyBillingInstallmentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgencyBillingInstallment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyInvoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "source" "AgencyInvoiceSource" NOT NULL DEFAULT 'MANUAL',
    "companyId" TEXT,
    "primaryContactId" TEXT,
    "billingProfileId" TEXT,
    "proposalId" TEXT,
    "proposalAcceptanceId" TEXT,
    "contractId" TEXT,
    "projectId" TEXT,
    "retainerId" TEXT,
    "billingScheduleId" TEXT,
    "billingInstallmentId" TEXT,
    "billingPeriodStart" TIMESTAMP(3),
    "billingPeriodEnd" TIMESTAMP(3),
    "status" "AgencyInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL,
    "subtotalMinor" INTEGER NOT NULL DEFAULT 0,
    "discountMinor" INTEGER NOT NULL DEFAULT 0,
    "taxMinor" INTEGER NOT NULL DEFAULT 0,
    "totalMinor" INTEGER NOT NULL DEFAULT 0,
    "amountPaidMinor" INTEGER NOT NULL DEFAULT 0,
    "amountDueMinor" INTEGER NOT NULL DEFAULT 0,
    "issueDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "voidedAt" TIMESTAMP(3),
    "voidReason" TEXT,
    "writtenOffAt" TIMESTAMP(3),
    "writeOffReason" TEXT,
    "billingNameSnapshot" TEXT,
    "billingEmailSnapshot" TEXT,
    "billingAddressSnapshotJson" JSONB,
    "issuerNameSnapshot" TEXT,
    "issuerEmailSnapshot" TEXT,
    "memo" TEXT,
    "clientNotes" TEXT,
    "internalNotes" TEXT,
    "snapshotHash" TEXT,
    "allowPartialPayment" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyInvoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyInvoiceLineItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitAmountMinor" INTEGER NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "sourceType" TEXT,
    "sourceId" TEXT,

    CONSTRAINT "AgencyInvoiceLineItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyPayment" (
    "id" TEXT NOT NULL,
    "paymentReference" TEXT,
    "companyId" TEXT,
    "contactId" TEXT,
    "provider" "AgencyPaymentProvider" NOT NULL,
    "providerTransactionId" TEXT,
    "providerReference" TEXT,
    "status" "AgencyPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "currency" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "method" "AgencyPaymentMethod" NOT NULL DEFAULT 'OTHER',
    "source" "AgencyPaymentSource" NOT NULL DEFAULT 'PORTAL',
    "metadataJson" JSONB,
    "receivedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "recordedById" TEXT,
    "manualNote" TEXT,
    "clientRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyPayment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyPaymentAllocation" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgencyPaymentAllocation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyPaymentWebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" "AgencyPaymentProvider" NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "status" "AgencyPaymentWebhookStatus" NOT NULL DEFAULT 'RECEIVED',
    "paymentId" TEXT,
    "errorSafe" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "AgencyPaymentWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyRetainer" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "primaryContactId" TEXT,
    "projectId" TEXT,
    "contractId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "AgencyRetainerStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "billingInterval" "AgencyRetainerInterval" NOT NULL DEFAULT 'MONTHLY',
    "billingDay" INTEGER,
    "issueMode" "AgencyRetainerIssueMode" NOT NULL DEFAULT 'CREATE_DRAFT',
    "lineItemDescription" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "nextBillingDate" TIMESTAMP(3),
    "paymentTermsDays" INTEGER NOT NULL DEFAULT 14,
    "ownerId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyRetainer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyRetainerBillingPeriod" (
    "id" TEXT NOT NULL,
    "retainerId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "invoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgencyRetainerBillingPeriod_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyInvoiceClientAccess" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "portalUserId" TEXT,
    "role" "AgencyBillingClientAccessRole" NOT NULL DEFAULT 'VIEWER',
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "grantedById" TEXT NOT NULL,
    "firstViewedAt" TIMESTAMP(3),
    "lastViewedAt" TIMESTAMP(3),

    CONSTRAINT "AgencyInvoiceClientAccess_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyClientBillingAccess" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "contactId" TEXT NOT NULL,
    "portalUserId" TEXT,
    "role" "AgencyBillingClientAccessRole" NOT NULL DEFAULT 'VIEWER',
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "grantedById" TEXT NOT NULL,

    CONSTRAINT "AgencyClientBillingAccess_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyBillingActivity" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT,
    "paymentId" TEXT,
    "retainerId" TEXT,
    "type" "AgencyBillingActivityType" NOT NULL,
    "summary" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorPortalUserId" TEXT,
    "clientVisible" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgencyBillingActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgencyInvoice_invoiceNumber_key" ON "AgencyInvoice"("invoiceNumber");
CREATE UNIQUE INDEX "AgencyPayment_paymentReference_key" ON "AgencyPayment"("paymentReference");
CREATE UNIQUE INDEX "AgencyPayment_provider_providerTransactionId_key" ON "AgencyPayment"("provider", "providerTransactionId");
CREATE UNIQUE INDEX "AgencyPaymentWebhookEvent_provider_providerEventId_key" ON "AgencyPaymentWebhookEvent"("provider", "providerEventId");
CREATE UNIQUE INDEX "AgencyRetainerBillingPeriod_retainerId_periodStart_key" ON "AgencyRetainerBillingPeriod"("retainerId", "periodStart");
CREATE UNIQUE INDEX "AgencyInvoiceClientAccess_invoiceId_contactId_key" ON "AgencyInvoiceClientAccess"("invoiceId", "contactId");
CREATE UNIQUE INDEX "AgencyClientBillingAccess_contactId_companyId_key" ON "AgencyClientBillingAccess"("contactId", "companyId");
CREATE UNIQUE INDEX "AgencyBillingInstallment_billingScheduleId_sequence_key" ON "AgencyBillingInstallment"("billingScheduleId", "sequence");

CREATE INDEX "AgencyBillingProfile_companyId_idx" ON "AgencyBillingProfile"("companyId");
CREATE INDEX "AgencyBillingProfile_contactId_idx" ON "AgencyBillingProfile"("contactId");
CREATE INDEX "AgencyInvoice_status_dueDate_idx" ON "AgencyInvoice"("status", "dueDate");
CREATE INDEX "AgencyInvoice_companyId_idx" ON "AgencyInvoice"("companyId");
CREATE INDEX "AgencyInvoice_projectId_idx" ON "AgencyInvoice"("projectId");
CREATE INDEX "AgencyInvoice_proposalAcceptanceId_idx" ON "AgencyInvoice"("proposalAcceptanceId");
CREATE INDEX "AgencyInvoice_contractId_idx" ON "AgencyInvoice"("contractId");
CREATE INDEX "AgencyInvoice_retainerId_idx" ON "AgencyInvoice"("retainerId");
CREATE INDEX "AgencyPayment_status_createdAt_idx" ON "AgencyPayment"("status", "createdAt");
CREATE INDEX "AgencyPaymentAllocation_invoiceId_idx" ON "AgencyPaymentAllocation"("invoiceId");
CREATE INDEX "AgencyPaymentAllocation_paymentId_idx" ON "AgencyPaymentAllocation"("paymentId");
CREATE INDEX "AgencyRetainer_status_nextBillingDate_idx" ON "AgencyRetainer"("status", "nextBillingDate");
CREATE INDEX "AgencyBillingActivity_invoiceId_createdAt_idx" ON "AgencyBillingActivity"("invoiceId", "createdAt");
CREATE INDEX "AgencyInvoiceClientAccess_portalUserId_invoiceId_idx" ON "AgencyInvoiceClientAccess"("portalUserId", "invoiceId");

-- AddForeignKey
ALTER TABLE "AgencyBillingProfile" ADD CONSTRAINT "AgencyBillingProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CrmCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyBillingProfile" ADD CONSTRAINT "AgencyBillingProfile_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgencyBillingSchedule" ADD CONSTRAINT "AgencyBillingSchedule_proposalAcceptanceId_fkey" FOREIGN KEY ("proposalAcceptanceId") REFERENCES "AgencyProposalAcceptance"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyBillingSchedule" ADD CONSTRAINT "AgencyBillingSchedule_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "AgencyContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyBillingSchedule" ADD CONSTRAINT "AgencyBillingSchedule_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "AgencyProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyBillingSchedule" ADD CONSTRAINT "AgencyBillingSchedule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AgencyBillingInstallment" ADD CONSTRAINT "AgencyBillingInstallment_billingScheduleId_fkey" FOREIGN KEY ("billingScheduleId") REFERENCES "AgencyBillingSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyBillingInstallment" ADD CONSTRAINT "AgencyBillingInstallment_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "AgencyProjectMilestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyBillingInstallment" ADD CONSTRAINT "AgencyBillingInstallment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "AgencyInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgencyInvoice" ADD CONSTRAINT "AgencyInvoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CrmCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyInvoice" ADD CONSTRAINT "AgencyInvoice_primaryContactId_fkey" FOREIGN KEY ("primaryContactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyInvoice" ADD CONSTRAINT "AgencyInvoice_billingProfileId_fkey" FOREIGN KEY ("billingProfileId") REFERENCES "AgencyBillingProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyInvoice" ADD CONSTRAINT "AgencyInvoice_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "AgencyProposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyInvoice" ADD CONSTRAINT "AgencyInvoice_proposalAcceptanceId_fkey" FOREIGN KEY ("proposalAcceptanceId") REFERENCES "AgencyProposalAcceptance"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyInvoice" ADD CONSTRAINT "AgencyInvoice_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "AgencyContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyInvoice" ADD CONSTRAINT "AgencyInvoice_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "AgencyProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyInvoice" ADD CONSTRAINT "AgencyInvoice_retainerId_fkey" FOREIGN KEY ("retainerId") REFERENCES "AgencyRetainer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyInvoice" ADD CONSTRAINT "AgencyInvoice_billingScheduleId_fkey" FOREIGN KEY ("billingScheduleId") REFERENCES "AgencyBillingSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyInvoice" ADD CONSTRAINT "AgencyInvoice_billingInstallmentId_fkey" FOREIGN KEY ("billingInstallmentId") REFERENCES "AgencyBillingInstallment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyInvoice" ADD CONSTRAINT "AgencyInvoice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AgencyInvoiceLineItem" ADD CONSTRAINT "AgencyInvoiceLineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "AgencyInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AgencyPayment" ADD CONSTRAINT "AgencyPayment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CrmCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyPayment" ADD CONSTRAINT "AgencyPayment_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyPayment" ADD CONSTRAINT "AgencyPayment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgencyPaymentAllocation" ADD CONSTRAINT "AgencyPaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "AgencyPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyPaymentAllocation" ADD CONSTRAINT "AgencyPaymentAllocation_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "AgencyInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AgencyPaymentWebhookEvent" ADD CONSTRAINT "AgencyPaymentWebhookEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "AgencyPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgencyRetainer" ADD CONSTRAINT "AgencyRetainer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CrmCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgencyRetainer" ADD CONSTRAINT "AgencyRetainer_primaryContactId_fkey" FOREIGN KEY ("primaryContactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyRetainer" ADD CONSTRAINT "AgencyRetainer_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "AgencyProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyRetainer" ADD CONSTRAINT "AgencyRetainer_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "AgencyContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyRetainer" ADD CONSTRAINT "AgencyRetainer_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgencyRetainer" ADD CONSTRAINT "AgencyRetainer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AgencyRetainerBillingPeriod" ADD CONSTRAINT "AgencyRetainerBillingPeriod_retainerId_fkey" FOREIGN KEY ("retainerId") REFERENCES "AgencyRetainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyRetainerBillingPeriod" ADD CONSTRAINT "AgencyRetainerBillingPeriod_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "AgencyInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgencyInvoiceClientAccess" ADD CONSTRAINT "AgencyInvoiceClientAccess_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "AgencyInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyInvoiceClientAccess" ADD CONSTRAINT "AgencyInvoiceClientAccess_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyInvoiceClientAccess" ADD CONSTRAINT "AgencyInvoiceClientAccess_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "ClientPortalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyInvoiceClientAccess" ADD CONSTRAINT "AgencyInvoiceClientAccess_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AgencyClientBillingAccess" ADD CONSTRAINT "AgencyClientBillingAccess_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CrmCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyClientBillingAccess" ADD CONSTRAINT "AgencyClientBillingAccess_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyClientBillingAccess" ADD CONSTRAINT "AgencyClientBillingAccess_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "ClientPortalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyClientBillingAccess" ADD CONSTRAINT "AgencyClientBillingAccess_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AgencyBillingActivity" ADD CONSTRAINT "AgencyBillingActivity_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "AgencyInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyBillingActivity" ADD CONSTRAINT "AgencyBillingActivity_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "AgencyPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyBillingActivity" ADD CONSTRAINT "AgencyBillingActivity_retainerId_fkey" FOREIGN KEY ("retainerId") REFERENCES "AgencyRetainer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyBillingActivity" ADD CONSTRAINT "AgencyBillingActivity_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyBillingActivity" ADD CONSTRAINT "AgencyBillingActivity_actorPortalUserId_fkey" FOREIGN KEY ("actorPortalUserId") REFERENCES "ClientPortalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "AgencyBillingSettings" ("id", "defaultCurrency", "defaultPaymentTermsDays", "updatedAt")
VALUES ('agency-billing', 'USD', 14, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
