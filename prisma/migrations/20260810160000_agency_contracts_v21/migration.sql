-- Agency Operations V2.1 — Contracts & Electronic Signatures

-- CreateEnum
CREATE TYPE "AgencyContractStatus" AS ENUM ('DRAFT', 'READY_FOR_REVIEW', 'SENT', 'PARTIALLY_SIGNED', 'SIGNED', 'CORRECTION_REQUESTED', 'DECLINED', 'EXPIRED', 'VOIDED', 'ARCHIVED');
CREATE TYPE "AgencyContractType" AS ENUM ('SERVICE_AGREEMENT', 'NDA', 'MAINTENANCE', 'OTHER');
CREATE TYPE "AgencyContractSource" AS ENUM ('MANUAL', 'PROPOSAL_ACCEPTANCE');
CREATE TYPE "AgencyContractSignerType" AS ENUM ('CLIENT', 'AGENCY');
CREATE TYPE "AgencyContractSignerRole" AS ENUM ('CLIENT_SIGNATORY', 'AGENCY_SIGNATORY', 'VIEWER');
CREATE TYPE "AgencyContractSignerStatus" AS ENUM ('PENDING', 'VIEWED', 'SIGNED', 'DECLINED');
CREATE TYPE "AgencyContractResponseType" AS ENUM ('CORRECTION_REQUESTED', 'DECLINED');
CREATE TYPE "AgencyContractActivityType" AS ENUM ('CONTRACT_CREATED', 'VERSION_CREATED', 'CONTRACT_SENT', 'CONTRACT_VIEWED', 'SIGNATURE_COMPLETED', 'CORRECTION_REQUESTED', 'CONTRACT_DECLINED', 'CONTRACT_FULLY_SIGNED', 'CONTRACT_VOIDED', 'CONTRACT_ARCHIVED');
CREATE TYPE "AgencyContractTemplateStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "AgencyContractCounter" (
    "year" INTEGER NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AgencyContractCounter_pkey" PRIMARY KEY ("year")
);

CREATE TABLE "AgencyContractTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "AgencyContractTemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "currentVersionId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AgencyContractTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyContractTemplateVersion" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgencyContractTemplateVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyContract" (
    "id" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "proposalId" TEXT,
    "proposalAcceptanceId" TEXT,
    "projectId" TEXT,
    "companyId" TEXT,
    "primaryContactId" TEXT,
    "title" TEXT NOT NULL,
    "contractType" "AgencyContractType" NOT NULL DEFAULT 'SERVICE_AGREEMENT',
    "source" "AgencyContractSource" NOT NULL DEFAULT 'MANUAL',
    "status" "AgencyContractStatus" NOT NULL DEFAULT 'DRAFT',
    "currentVersionId" TEXT,
    "signedVersionId" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "internalNotes" TEXT,
    "sentAt" TIMESTAMP(3),
    "fullySignedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "voidedAt" TIMESTAMP(3),
    "voidReason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AgencyContract_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyContractVersion" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "resolvedVariables" JSONB,
    "sourceTemplateId" TEXT,
    "sourceTemplateVersionId" TEXT,
    "proposalAcceptanceId" TEXT,
    "proposalScopeHash" TEXT,
    "contentHash" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgencyContractVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyContractSigner" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "contractVersionId" TEXT,
    "signerType" "AgencyContractSignerType" NOT NULL,
    "portalUserId" TEXT,
    "adminUserId" TEXT,
    "contactId" TEXT,
    "nameSnapshot" TEXT NOT NULL,
    "emailSnapshot" TEXT NOT NULL,
    "companySnapshot" TEXT,
    "role" "AgencyContractSignerRole" NOT NULL,
    "signingOrder" INTEGER NOT NULL DEFAULT 1,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "status" "AgencyContractSignerStatus" NOT NULL DEFAULT 'PENDING',
    "invitedAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AgencyContractSigner_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyContractClientAccess" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "portalUserId" TEXT,
    "role" "AgencyContractSignerRole" NOT NULL DEFAULT 'VIEWER',
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "grantedById" TEXT NOT NULL,
    "firstViewedAt" TIMESTAMP(3),
    "lastViewedAt" TIMESTAMP(3),
    CONSTRAINT "AgencyContractClientAccess_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyContractSignature" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "contractVersionId" TEXT NOT NULL,
    "signerId" TEXT NOT NULL,
    "signerPortalUserId" TEXT,
    "signerAdminUserId" TEXT,
    "contactId" TEXT,
    "signerNameSnapshot" TEXT NOT NULL,
    "signerEmailSnapshot" TEXT NOT NULL,
    "typedSignatureName" TEXT NOT NULL,
    "signerTitle" TEXT,
    "consentTextSnapshot" TEXT NOT NULL,
    "consentVersion" TEXT NOT NULL,
    "contractContentHash" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipHash" TEXT,
    "userAgentHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgencyContractSignature_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyContractResponse" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "portalUserId" TEXT,
    "adminUserId" TEXT,
    "contactId" TEXT,
    "responseType" "AgencyContractResponseType" NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgencyContractResponse_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgencyContractActivity" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "type" "AgencyContractActivityType" NOT NULL,
    "summary" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorPortalUserId" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "clientVisible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgencyContractActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgencyContract_contractNumber_key" ON "AgencyContract"("contractNumber");
CREATE INDEX "AgencyContract_status_updatedAt_idx" ON "AgencyContract"("status", "updatedAt");
CREATE INDEX "AgencyContract_ownerId_status_idx" ON "AgencyContract"("ownerId", "status");
CREATE INDEX "AgencyContract_proposalId_idx" ON "AgencyContract"("proposalId");
CREATE INDEX "AgencyContract_proposalAcceptanceId_idx" ON "AgencyContract"("proposalAcceptanceId");
CREATE INDEX "AgencyContract_projectId_idx" ON "AgencyContract"("projectId");
CREATE INDEX "AgencyContract_companyId_idx" ON "AgencyContract"("companyId");

CREATE UNIQUE INDEX "AgencyContractTemplateVersion_templateId_versionNumber_key" ON "AgencyContractTemplateVersion"("templateId", "versionNumber");
CREATE INDEX "AgencyContractTemplateVersion_templateId_idx" ON "AgencyContractTemplateVersion"("templateId");
CREATE INDEX "AgencyContractTemplate_status_updatedAt_idx" ON "AgencyContractTemplate"("status", "updatedAt");

CREATE UNIQUE INDEX "AgencyContractVersion_contractId_versionNumber_key" ON "AgencyContractVersion"("contractId", "versionNumber");
CREATE INDEX "AgencyContractVersion_contractId_idx" ON "AgencyContractVersion"("contractId");

CREATE INDEX "AgencyContractSigner_contractId_status_idx" ON "AgencyContractSigner"("contractId", "status");
CREATE INDEX "AgencyContractSigner_portalUserId_idx" ON "AgencyContractSigner"("portalUserId");
CREATE INDEX "AgencyContractSigner_adminUserId_idx" ON "AgencyContractSigner"("adminUserId");

CREATE UNIQUE INDEX "AgencyContractClientAccess_contractId_contactId_key" ON "AgencyContractClientAccess"("contractId", "contactId");
CREATE INDEX "AgencyContractClientAccess_portalUserId_contractId_idx" ON "AgencyContractClientAccess"("portalUserId", "contractId");

CREATE UNIQUE INDEX "AgencyContractSignature_contractVersionId_signerId_key" ON "AgencyContractSignature"("contractVersionId", "signerId");
CREATE INDEX "AgencyContractSignature_contractId_idx" ON "AgencyContractSignature"("contractId");

CREATE INDEX "AgencyContractResponse_contractId_createdAt_idx" ON "AgencyContractResponse"("contractId", "createdAt");
CREATE INDEX "AgencyContractActivity_contractId_createdAt_idx" ON "AgencyContractActivity"("contractId", "createdAt");

-- AddForeignKey
ALTER TABLE "AgencyContractTemplate" ADD CONSTRAINT "AgencyContractTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgencyContractTemplateVersion" ADD CONSTRAINT "AgencyContractTemplateVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "AgencyContractTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AgencyContract" ADD CONSTRAINT "AgencyContract_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "AgencyProposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyContract" ADD CONSTRAINT "AgencyContract_proposalAcceptanceId_fkey" FOREIGN KEY ("proposalAcceptanceId") REFERENCES "AgencyProposalAcceptance"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyContract" ADD CONSTRAINT "AgencyContract_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "AgencyProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyContract" ADD CONSTRAINT "AgencyContract_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CrmCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyContract" ADD CONSTRAINT "AgencyContract_primaryContactId_fkey" FOREIGN KEY ("primaryContactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyContract" ADD CONSTRAINT "AgencyContract_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgencyContract" ADD CONSTRAINT "AgencyContract_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AgencyContractVersion" ADD CONSTRAINT "AgencyContractVersion_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "AgencyContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyContractVersion" ADD CONSTRAINT "AgencyContractVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AgencyContractSigner" ADD CONSTRAINT "AgencyContractSigner_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "AgencyContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyContractSigner" ADD CONSTRAINT "AgencyContractSigner_contractVersionId_fkey" FOREIGN KEY ("contractVersionId") REFERENCES "AgencyContractVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyContractSigner" ADD CONSTRAINT "AgencyContractSigner_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "ClientPortalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyContractSigner" ADD CONSTRAINT "AgencyContractSigner_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyContractSigner" ADD CONSTRAINT "AgencyContractSigner_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgencyContractClientAccess" ADD CONSTRAINT "AgencyContractClientAccess_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "AgencyContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyContractClientAccess" ADD CONSTRAINT "AgencyContractClientAccess_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyContractClientAccess" ADD CONSTRAINT "AgencyContractClientAccess_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "ClientPortalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyContractClientAccess" ADD CONSTRAINT "AgencyContractClientAccess_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AgencyContractSignature" ADD CONSTRAINT "AgencyContractSignature_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "AgencyContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyContractSignature" ADD CONSTRAINT "AgencyContractSignature_contractVersionId_fkey" FOREIGN KEY ("contractVersionId") REFERENCES "AgencyContractVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyContractSignature" ADD CONSTRAINT "AgencyContractSignature_signerId_fkey" FOREIGN KEY ("signerId") REFERENCES "AgencyContractSigner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyContractSignature" ADD CONSTRAINT "AgencyContractSignature_signerPortalUserId_fkey" FOREIGN KEY ("signerPortalUserId") REFERENCES "ClientPortalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyContractSignature" ADD CONSTRAINT "AgencyContractSignature_signerAdminUserId_fkey" FOREIGN KEY ("signerAdminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyContractSignature" ADD CONSTRAINT "AgencyContractSignature_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgencyContractResponse" ADD CONSTRAINT "AgencyContractResponse_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "AgencyContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyContractResponse" ADD CONSTRAINT "AgencyContractResponse_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "AgencyContractVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyContractResponse" ADD CONSTRAINT "AgencyContractResponse_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "ClientPortalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyContractResponse" ADD CONSTRAINT "AgencyContractResponse_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgencyContractActivity" ADD CONSTRAINT "AgencyContractActivity_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "AgencyContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgencyContractActivity" ADD CONSTRAINT "AgencyContractActivity_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgencyContractActivity" ADD CONSTRAINT "AgencyContractActivity_actorPortalUserId_fkey" FOREIGN KEY ("actorPortalUserId") REFERENCES "ClientPortalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
